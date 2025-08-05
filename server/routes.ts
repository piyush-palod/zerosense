import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertVideoSearchSchema, insertAlertSchema, insertCameraSchema, insertLocationSchema } from "@shared/schema";
import { analyzeVideo, summarizeArticle, intelligentVideoSearch, analyzeIncident, VideoSearchResult } from "./services/gemini";
import { streamManager } from "./services/stream";
import multer from "multer";
import path from "path";
import fs from "fs";

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket setup for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast function for real-time updates
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Dashboard statistics
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const cameras = await storage.getCameras();
      const activeAlerts = await storage.getActiveAlerts();
      const locations = await storage.getLocations();

      const activeCameras = cameras.filter(camera => camera.isOnline).length;
      const totalStorage = cameras.length * 0.2; // Mock storage calculation
      
      res.json({
        activeCameras,
        activeAlerts: activeAlerts.length,
        locations: locations.length,
        storageUsed: `${totalStorage.toFixed(1)}TB`,
        storagePercent: Math.min(68, Math.round((totalStorage / 3.5) * 100))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Locations
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.post("/api/locations", async (req, res) => {
    try {
      const validatedData = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(validatedData);
      
      await storage.createActivity({
        userId: null,
        type: "location_added",
        description: `New location added: ${location.name}`,
        metadata: { locationId: location.id }
      });

      broadcast({ type: 'LOCATION_ADDED', data: location });
      res.status(201).json(location);
    } catch (error) {
      res.status(400).json({ message: "Invalid location data" });
    }
  });

  // Cameras
  app.get("/api/cameras", async (req, res) => {
    try {
      const { locationId } = req.query;
      let cameras;
      
      if (locationId && typeof locationId === 'string') {
        cameras = await storage.getCamerasByLocation(locationId);
      } else {
        cameras = await storage.getCameras();
      }
      
      res.json(cameras);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cameras" });
    }
  });

  app.post("/api/cameras", async (req, res) => {
    try {
      const validatedData = insertCameraSchema.parse(req.body);
      const camera = await storage.createCamera(validatedData);
      
      await storage.createActivity({
        userId: null,
        type: "camera_added",
        description: `New camera added: ${camera.name}`,
        metadata: { cameraId: camera.id, locationId: camera.locationId }
      });

      broadcast({ type: 'CAMERA_ADDED', data: camera });
      res.status(201).json(camera);
    } catch (error) {
      res.status(400).json({ message: "Invalid camera data" });
    }
  });

  app.patch("/api/cameras/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const camera = await storage.updateCamera(id, updates);
      if (!camera) {
        return res.status(404).json({ message: "Camera not found" });
      }

      broadcast({ type: 'CAMERA_UPDATED', data: camera });
      res.json(camera);
    } catch (error) {
      res.status(400).json({ message: "Failed to update camera" });
    }
  });

  // RTSP Stream Management
  app.post("/api/cameras/:id/stream/start", async (req, res) => {
    try {
      const { id } = req.params;
      const camera = await storage.getCamera(id);
      
      if (!camera || !camera.rtspUrl) {
        return res.status(404).json({ message: "Camera not found or no RTSP URL configured" });
      }

      const success = await streamManager.startStream({
        cameraId: id,
        rtspUrl: camera.rtspUrl,
        hlsOutputPath: `/streams/${id}/stream.m3u8`
      });

      if (success) {
        await storage.updateCamera(id, { 
          streamStatus: "active",
          hlsUrl: streamManager.getHLSUrl(id)
        });
        
        broadcast({ type: 'STREAM_STARTED', data: { cameraId: id } });
        res.json({ message: "Stream started successfully", hlsUrl: streamManager.getHLSUrl(id) });
      } else {
        res.status(500).json({ message: "Failed to start stream" });
      }
    } catch (error) {
      console.error('Stream start error:', error);
      res.status(500).json({ message: "Failed to start stream" });
    }
  });

  app.post("/api/cameras/:id/stream/stop", async (req, res) => {
    try {
      const { id } = req.params;
      
      await streamManager.stopStream(id);
      await storage.updateCamera(id, { 
        streamStatus: "inactive",
        hlsUrl: null
      });
      
      broadcast({ type: 'STREAM_STOPPED', data: { cameraId: id } });
      res.json({ message: "Stream stopped successfully" });
    } catch (error) {
      console.error('Stream stop error:', error);
      res.status(500).json({ message: "Failed to stop stream" });
    }
  });

  app.get("/api/cameras/:id/stream/status", async (req, res) => {
    try {
      const { id } = req.params;
      const status = streamManager.getStreamStatus(id);
      res.json({ cameraId: id, status });
    } catch (error) {
      res.status(500).json({ message: "Failed to get stream status" });
    }
  });

  // Alerts
  app.get("/api/alerts", async (req, res) => {
    try {
      const { active } = req.query;
      let alerts;
      
      if (active === 'true') {
        alerts = await storage.getActiveAlerts();
      } else {
        alerts = await storage.getAlerts();
      }
      
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const validatedData = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert(validatedData);
      
      await storage.createActivity({
        userId: null,
        type: "alert_created",
        description: `New alert: ${alert.title}`,
        metadata: { alertId: alert.id, severity: alert.severity }
      });

      broadcast({ type: 'ALERT_CREATED', data: alert });
      res.status(201).json(alert);
    } catch (error) {
      res.status(400).json({ message: "Invalid alert data" });
    }
  });

  app.patch("/api/alerts/:id/resolve", async (req, res) => {
    try {
      const { id } = req.params;
      const { resolvedBy } = req.body;
      
      const alert = await storage.resolveAlert(id, resolvedBy);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      await storage.createActivity({
        userId: resolvedBy,
        type: "alert_resolved",
        description: `Alert resolved: ${alert.title}`,
        metadata: { alertId: alert.id }
      });

      broadcast({ type: 'ALERT_RESOLVED', data: alert });
      res.json(alert);
    } catch (error) {
      res.status(400).json({ message: "Failed to resolve alert" });
    }
  });

  // Enhanced AI Video Search
  app.post("/api/video/search", async (req, res) => {
    try {
      const { query, filters } = req.body;
      const validatedData = insertVideoSearchSchema.parse({
        userId: null,
        query,
        filters: filters || {},
        results: []
      });

      // Get cameras for metadata
      const cameras = await storage.getCameras();
      const videoMetadata = cameras.map(camera => ({
        cameraId: camera.id,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        duration: Math.floor(Math.random() * 300) + 60 // 1-5 minutes
      }));

      try {
        // Use Gemini AI for intelligent video search
        const aiResults = await intelligentVideoSearch(query, videoMetadata);
        
        // Convert AI results to our format
        const searchResults = aiResults.map(result => ({
          cameraId: result.timestamp ? cameras.find(c => c.id)?.id || cameras[0]?.id : cameras[0]?.id,
          timestamp: result.timestamp,
          confidence: result.confidence,
          description: result.description
        })).filter(r => r.cameraId);

        validatedData.results = searchResults;
      } catch (aiError) {
        console.error('AI search failed, using fallback:', aiError);
        // Fallback results if AI fails
        validatedData.results = [
          {
            cameraId: cameras[0]?.id || "unknown",
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            confidence: 0.85,
            description: `Search completed for: ${query}`
          }
        ];
      }

      const search = await storage.createVideoSearch(validatedData);

      await storage.createActivity({
        userId: null,
        type: "search_performed",
        description: `AI video search: "${query}"`,
        metadata: { searchId: search.id, resultCount: validatedData.results.length }
      });

      broadcast({ type: 'SEARCH_COMPLETED', data: search });
      res.json(search);
    } catch (error) {
      console.error('Video search error:', error);
      res.status(400).json({ message: "Failed to perform video search" });
    }
  });

  app.get("/api/video/searches", async (req, res) => {
    try {
      const { userId } = req.query;
      const searches = await storage.getVideoSearches(
        typeof userId === 'string' ? userId : undefined
      );
      res.json(searches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch video searches" });
    }
  });

  // Video Analysis with Gemini AI
  app.post("/api/video/analyze", upload.single('video'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No video file provided" });
      }

      const videoPath = req.file.path;
      
      try {
        const analysis = await analyzeVideo(videoPath);
        
        // Try to analyze for incidents using AI
        let incidentAnalysis = null;
        try {
          incidentAnalysis = await analyzeIncident(
            `Video analysis: ${analysis.substring(0, 500)}`,
            analysis
          );
          
          // Create alert if incident severity is medium or higher
          if (incidentAnalysis.severity !== "low") {
            await storage.createAlert({
              cameraId: null,
              type: incidentAnalysis.type,
              severity: incidentAnalysis.severity,
              title: `AI Detected: ${incidentAnalysis.summary}`,
              description: `AI analysis found: ${incidentAnalysis.summary}. Confidence: ${Math.round(incidentAnalysis.confidence * 100)}%`,
              metadata: {
                aiAnalysis: incidentAnalysis,
                filename: req.file.originalname,
                uploadedAt: new Date().toISOString()
              },
              isResolved: false,
              resolvedBy: null
            });
            
            broadcast({ 
              type: 'AI_INCIDENT_DETECTED', 
              data: { 
                analysis: incidentAnalysis,
                filename: req.file.originalname
              }
            });
          }
        } catch (incidentError) {
          console.error('Incident analysis failed:', incidentError);
        }
        
        // Create activity for the analysis
        await storage.createActivity({
          userId: null,
          type: "video_analyzed",
          description: "Video analyzed with AI",
          metadata: { 
            filename: req.file.originalname,
            analysis: analysis.substring(0, 200) + "...",
            incidentDetected: !!incidentAnalysis && incidentAnalysis.severity !== "low"
          }
        });

        res.json({ 
          analysis,
          incidentAnalysis,
          alertCreated: !!incidentAnalysis && incidentAnalysis.severity !== "low"
        });
      } finally {
        // Clean up uploaded file
        fs.unlink(videoPath, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
      }
    } catch (error) {
      console.error('Video analysis error:', error);
      res.status(500).json({ message: "Failed to analyze video" });
    }
  });

  // Activities
  app.get("/api/activities", async (req, res) => {
    try {
      const { limit } = req.query;
      const activities = await storage.getActivities(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Analytics
  app.get("/api/analytics", async (req, res) => {
    try {
      const { timeRange = '24h' } = req.query;
      
      // Mock analytics data
      const mockAnalytics = {
        peopleCount: 1247,
        vehicleCount: 89,
        motionEvents: 156,
        alertTrends: [
          { time: '00:00', count: 5 },
          { time: '04:00', count: 2 },
          { time: '08:00', count: 15 },
          { time: '12:00', count: 22 },
          { time: '16:00', count: 18 },
          { time: '20:00', count: 8 }
        ],
        timeRange
      };

      res.json(mockAnalytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Serve static files for HLS streaming
  const publicDir = path.join(process.cwd(), 'public');
  const streamsDir = path.join(publicDir, 'streams');
  
  // Ensure directories exist
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(streamsDir)) {
    fs.mkdirSync(streamsDir, { recursive: true });
  }
  
  app.use('/streams', express.static(streamsDir));

  // WebSocket endpoint for camera streams and real-time updates
  wss.on('connection', (ws, req) => {
    console.log('Client connected to WebSocket');
    
    // Handle camera stream subscription
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'SUBSCRIBE_CAMERA' && data.cameraId) {
          streamManager.addWebSocketClient(data.cameraId, ws);
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}
