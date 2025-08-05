import { spawn, ChildProcess } from "child_process";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import fs from "fs";

interface StreamConfig {
  cameraId: string;
  rtspUrl: string;
  hlsOutputPath: string;
  wsPort?: number;
}

interface ActiveStream {
  process: ChildProcess;
  wsServer?: WebSocketServer;
  clients: Set<WebSocket>;
  config: StreamConfig;
  status: "starting" | "active" | "error" | "stopped";
}

export class RTSPStreamManager {
  private activeStreams = new Map<string, ActiveStream>();
  private hlsDir = path.join(process.cwd(), "public", "streams");

  constructor() {
    // Ensure HLS directory exists
    if (!fs.existsSync(this.hlsDir)) {
      fs.mkdirSync(this.hlsDir, { recursive: true });
    }
  }

  async startStream(config: StreamConfig): Promise<boolean> {
    try {
      if (this.activeStreams.has(config.cameraId)) {
        await this.stopStream(config.cameraId);
      }

      const hlsOutputDir = path.join(this.hlsDir, config.cameraId);
      if (!fs.existsSync(hlsOutputDir)) {
        fs.mkdirSync(hlsOutputDir, { recursive: true });
      }

      const hlsPlaylist = path.join(hlsOutputDir, "stream.m3u8");
      
      // FFmpeg command to convert RTSP to HLS
      const ffmpegArgs = [
        "-i", config.rtspUrl,
        "-c:v", "libx264",
        "-c:a", "aac",
        "-preset", "ultrafast",
        "-tune", "zerolatency",
        "-f", "hls",
        "-hls_time", "2",
        "-hls_list_size", "3",
        "-hls_flags", "delete_segments",
        "-hls_allow_cache", "0",
        hlsPlaylist
      ];

      const ffmpegProcess = spawn("ffmpeg", ffmpegArgs, {
        stdio: ["ignore", "pipe", "pipe"]
      });

      const streamData: ActiveStream = {
        process: ffmpegProcess,
        clients: new Set(),
        config,
        status: "starting"
      };

      this.activeStreams.set(config.cameraId, streamData);

      ffmpegProcess.stdout?.on("data", (data) => {
        console.log(`FFmpeg stdout [${config.cameraId}]:`, data.toString());
      });

      ffmpegProcess.stderr?.on("data", (data) => {
        const output = data.toString();
        console.log(`FFmpeg stderr [${config.cameraId}]:`, output);
        
        // Check if stream is active
        if (output.includes("Opening") || output.includes("Stream #")) {
          streamData.status = "active";
          this.notifyClients(config.cameraId, { type: "stream_active" });
        }
      });

      ffmpegProcess.on("close", (code) => {
        console.log(`FFmpeg process [${config.cameraId}] exited with code ${code}`);
        streamData.status = code === 0 ? "stopped" : "error";
        this.notifyClients(config.cameraId, { 
          type: "stream_stopped", 
          code 
        });
      });

      ffmpegProcess.on("error", (error) => {
        console.error(`FFmpeg error [${config.cameraId}]:`, error);
        streamData.status = "error";
        this.notifyClients(config.cameraId, { 
          type: "stream_error", 
          error: error.message 
        });
      });

      // Wait a moment to see if the process starts successfully
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return streamData.status === "active" || streamData.status === "starting";
    } catch (error) {
      console.error(`Failed to start stream for camera ${config.cameraId}:`, error);
      return false;
    }
  }

  async stopStream(cameraId: string): Promise<void> {
    const stream = this.activeStreams.get(cameraId);
    if (!stream) return;

    try {
      // Close WebSocket server
      if (stream.wsServer) {
        stream.wsServer.close();
      }

      // Close WebSocket clients
      stream.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.close();
        }
      });

      // Kill FFmpeg process
      if (stream.process && !stream.process.killed) {
        stream.process.kill("SIGTERM");
        
        // Force kill after 5 seconds if it doesn't terminate
        setTimeout(() => {
          if (!stream.process.killed) {
            stream.process.kill("SIGKILL");
          }
        }, 5000);
      }

      // Clean up HLS files
      const hlsDir = path.join(this.hlsDir, cameraId);
      if (fs.existsSync(hlsDir)) {
        fs.rmSync(hlsDir, { recursive: true, force: true });
      }

      this.activeStreams.delete(cameraId);
    } catch (error) {
      console.error(`Error stopping stream for camera ${cameraId}:`, error);
    }
  }

  getStreamStatus(cameraId: string): string {
    const stream = this.activeStreams.get(cameraId);
    return stream?.status || "inactive";
  }

  getHLSUrl(cameraId: string): string {
    return `/streams/${cameraId}/stream.m3u8`;
  }

  private notifyClients(cameraId: string, message: any): void {
    const stream = this.activeStreams.get(cameraId);
    if (!stream) return;

    const messageStr = JSON.stringify({
      cameraId,
      ...message
    });

    stream.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  addWebSocketClient(cameraId: string, ws: WebSocket): void {
    const stream = this.activeStreams.get(cameraId);
    if (stream) {
      stream.clients.add(ws);
      
      ws.on("close", () => {
        stream.clients.delete(ws);
      });

      // Send current status
      ws.send(JSON.stringify({
        cameraId,
        type: "status",
        status: stream.status
      }));
    }
  }

  async stopAllStreams(): Promise<void> {
    const cameraIds = Array.from(this.activeStreams.keys());
    await Promise.all(cameraIds.map(id => this.stopStream(id)));
  }

  getActiveStreams(): string[] {
    return Array.from(this.activeStreams.keys());
  }
}

export const streamManager = new RTSPStreamManager();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Stopping all streams...");
  await streamManager.stopAllStreams();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Stopping all streams...");
  await streamManager.stopAllStreams();
  process.exit(0);
});