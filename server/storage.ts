import { 
  type User, type InsertUser,
  type Location, type InsertLocation,
  type Camera, type InsertCamera,
  type Alert, type InsertAlert,
  type VideoSearch, type InsertVideoSearch,
  type Activity, type InsertActivity
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Locations
  getLocations(): Promise<Location[]>;
  getLocation(id: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location | undefined>;

  // Cameras
  getCameras(): Promise<Camera[]>;
  getCamerasByLocation(locationId: string): Promise<Camera[]>;
  getCamera(id: string): Promise<Camera | undefined>;
  createCamera(camera: InsertCamera): Promise<Camera>;
  updateCamera(id: string, camera: Partial<InsertCamera>): Promise<Camera | undefined>;

  // Alerts
  getAlerts(): Promise<Alert[]>;
  getActiveAlerts(): Promise<Alert[]>;
  getAlert(id: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  resolveAlert(id: string, resolvedBy: string): Promise<Alert | undefined>;

  // Video Searches
  getVideoSearches(userId?: string): Promise<VideoSearch[]>;
  createVideoSearch(search: InsertVideoSearch): Promise<VideoSearch>;

  // Activities
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private locations: Map<string, Location>;
  private cameras: Map<string, Camera>;
  private alerts: Map<string, Alert>;
  private videoSearches: Map<string, VideoSearch>;
  private activities: Map<string, Activity>;

  constructor() {
    this.users = new Map();
    this.locations = new Map();
    this.cameras = new Map();
    this.alerts = new Map();
    this.videoSearches = new Map();
    this.activities = new Map();

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample locations
    const mainOffice: Location = {
      id: randomUUID(),
      name: "Main Office",
      address: "123 Business Ave, City, State",
      coordinates: { lat: 40.7128, lng: -74.0060 },
      isActive: true,
      createdAt: new Date(),
    };
    
    const warehouseA: Location = {
      id: randomUUID(),
      name: "Warehouse A",
      address: "456 Industrial Blvd, City, State",
      coordinates: { lat: 40.7589, lng: -73.9851 },
      isActive: true,
      createdAt: new Date(),
    };

    this.locations.set(mainOffice.id, mainOffice);
    this.locations.set(warehouseA.id, warehouseA);

    // Create sample cameras with real test RTSP streams
    const cameras = [
      {
        id: randomUUID(),
        name: "Main Entrance",
        locationId: mainOffice.id,
        rtspUrl: "rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4",
        webrtcUrl: null,
        hlsUrl: null,
        streamStatus: "inactive",
        position: { x: 0, y: 0, z: 3 },
        isOnline: true,
        isRecording: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Reception",
        locationId: mainOffice.id,
        rtspUrl: "rtsp://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
        webrtcUrl: null,
        hlsUrl: null,
        streamStatus: "inactive",
        position: { x: 10, y: 5, z: 3 },
        isOnline: true,
        isRecording: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Warehouse Floor",
        locationId: warehouseA.id,
        rtspUrl: "rtsp://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        webrtcUrl: null,
        hlsUrl: null,
        streamStatus: "inactive",
        position: { x: 0, y: 0, z: 5 },
        isOnline: true,
        isRecording: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Parking Lot",
        locationId: mainOffice.id,
        rtspUrl: "rtsp://techslides.com/demos/sample-videos/small.mp4",
        webrtcUrl: null,
        hlsUrl: null,
        streamStatus: "inactive",
        position: { x: -20, y: 10, z: 4 },
        isOnline: true,
        isRecording: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Hallway B",
        locationId: mainOffice.id,
        rtspUrl: null,
        webrtcUrl: null,
        hlsUrl: null,
        streamStatus: "inactive",
        position: { x: 5, y: 15, z: 3 },
        isOnline: false,
        isRecording: false,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Conference Room A",
        locationId: mainOffice.id,
        rtspUrl: null,
        webrtcUrl: null,
        hlsUrl: null,
        streamStatus: "inactive",
        position: { x: 15, y: 8, z: 3 },
        isOnline: false,
        isRecording: false,
        createdAt: new Date(),
      },
    ];

    cameras.forEach(camera => this.cameras.set(camera.id, camera));

    // Create sample alerts
    const alerts = [
      {
        id: randomUUID(),
        cameraId: cameras[0].id,
        type: "motion",
        severity: "high" as const,
        title: "Motion Detected",
        description: "Unauthorized access at Main Entrance",
        metadata: { confidence: 0.95, objectType: "person" },
        isResolved: false,
        resolvedBy: null,
        createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        resolvedAt: null,
      },
      {
        id: randomUUID(),
        cameraId: cameras[4].id,
        type: "offline",
        severity: "medium" as const,
        title: "Camera Offline",
        description: "Conference Room A camera disconnected",
        metadata: { lastSeen: new Date(Date.now() - 5 * 60 * 1000) },
        isResolved: false,
        resolvedBy: null,
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        resolvedAt: null,
      },
      {
        id: randomUUID(),
        cameraId: cameras[1].id,
        type: "person_detected",
        severity: "low" as const,
        title: "Person Identified",
        description: "Known visitor detected at Reception",
        metadata: { personId: "visitor_123", confidence: 0.88 },
        isResolved: false,
        resolvedBy: null,
        createdAt: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
        resolvedAt: null,
      },
    ];

    alerts.forEach(alert => this.alerts.set(alert.id, alert));

    // Create sample activities
    const activities = [
      {
        id: randomUUID(),
        userId: null,
        type: "camera_added",
        description: "New camera added to Warehouse B",
        metadata: { cameraName: "Loading Dock B" },
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        id: randomUUID(),
        userId: null,
        type: "system",
        description: "System backup completed successfully",
        metadata: { backupSize: "2.4GB" },
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        userId: null,
        type: "user_management",
        description: "User permissions updated for John Smith",
        metadata: { permissions: ["view_cameras", "manage_alerts"] },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        userId: null,
        type: "system",
        description: "AI model updated to version 2.1.3",
        metadata: { previousVersion: "2.1.2", improvements: ["better detection", "reduced false positives"] },
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
    ];

    activities.forEach(activity => this.activities.set(activity.id, activity));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      role: insertUser.role || "user",
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }

  async getLocation(id: string): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = randomUUID();
    const location: Location = { 
      ...insertLocation, 
      id, 
      createdAt: new Date() 
    };
    this.locations.set(id, location);
    return location;
  }

  async updateLocation(id: string, updateData: Partial<InsertLocation>): Promise<Location | undefined> {
    const location = this.locations.get(id);
    if (!location) return undefined;
    
    const updated: Location = { ...location, ...updateData };
    this.locations.set(id, updated);
    return updated;
  }

  // Cameras
  async getCameras(): Promise<Camera[]> {
    return Array.from(this.cameras.values());
  }

  async getCamerasByLocation(locationId: string): Promise<Camera[]> {
    return Array.from(this.cameras.values()).filter(camera => camera.locationId === locationId);
  }

  async getCamera(id: string): Promise<Camera | undefined> {
    return this.cameras.get(id);
  }

  async createCamera(insertCamera: InsertCamera): Promise<Camera> {
    const id = randomUUID();
    const camera: Camera = { 
      ...insertCamera, 
      id, 
      createdAt: new Date() 
    };
    this.cameras.set(id, camera);
    return camera;
  }

  async updateCamera(id: string, updateData: Partial<InsertCamera>): Promise<Camera | undefined> {
    const camera = this.cameras.get(id);
    if (!camera) return undefined;
    
    const updated: Camera = { ...camera, ...updateData };
    this.cameras.set(id, updated);
    return updated;
  }

  // Alerts
  async getAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.isResolved)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = randomUUID();
    const alert: Alert = { 
      ...insertAlert, 
      id, 
      createdAt: new Date(),
      resolvedAt: null
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async resolveAlert(id: string, resolvedBy: string): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;
    
    const updated: Alert = { 
      ...alert, 
      isResolved: true, 
      resolvedBy, 
      resolvedAt: new Date() 
    };
    this.alerts.set(id, updated);
    return updated;
  }

  // Video Searches
  async getVideoSearches(userId?: string): Promise<VideoSearch[]> {
    const searches = Array.from(this.videoSearches.values());
    if (userId) {
      return searches.filter(search => search.userId === userId);
    }
    return searches.sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createVideoSearch(insertSearch: InsertVideoSearch): Promise<VideoSearch> {
    const id = randomUUID();
    const search: VideoSearch = { 
      ...insertSearch, 
      id, 
      createdAt: new Date() 
    };
    this.videoSearches.set(id, search);
    return search;
  }

  // Activities
  async getActivities(limit = 50): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      createdAt: new Date() 
    };
    this.activities.set(id, activity);
    return activity;
  }
}

export const storage = new MemStorage();
