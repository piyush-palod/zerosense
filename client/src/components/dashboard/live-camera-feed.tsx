import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, RotateCcw, Maximize2, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LiveCameraFeedProps {
  camera: {
    id: string;
    name: string;
    rtspUrl?: string | null;
    hlsUrl?: string | null;
    streamStatus?: string;
    isOnline: boolean;
  };
  className?: string;
}

export default function LiveCameraFeed({ camera, className = "" }: LiveCameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const startStream = async () => {
    if (!camera.rtspUrl) {
      toast({
        title: "No RTSP URL",
        description: "This camera doesn't have an RTSP URL configured",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setStreamError(null);

    try {
      const response = await apiRequest("POST", `/api/cameras/${camera.id}/stream/start`, {});
      const data = await response.json();

      if (response.ok && data.hlsUrl) {
        // Load HLS stream
        if (videoRef.current) {
          videoRef.current.src = data.hlsUrl;
          videoRef.current.load();
          
          // Try to play after a short delay
          setTimeout(() => {
            videoRef.current?.play()
              .then(() => {
                setIsPlaying(true);
              })
              .catch((error) => {
                console.error('Video play error:', error);
                setStreamError("Failed to play video stream");
              });
          }, 1000);
        }

        toast({
          title: "Stream Started",
          description: `Live feed from ${camera.name} is now active`,
        });
      } else {
        throw new Error(data.message || "Failed to start stream");
      }
    } catch (error: any) {
      console.error('Start stream error:', error);
      setStreamError(error.message || "Failed to start stream");
      toast({
        title: "Stream Error",
        description: error.message || "Failed to start live stream",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopStream = async () => {
    setIsLoading(true);

    try {
      await apiRequest("POST", `/api/cameras/${camera.id}/stream/stop`, {});
      
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
      }
      
      setIsPlaying(false);
      setStreamError(null);

      toast({
        title: "Stream Stopped",
        description: `Live feed from ${camera.name} has been stopped`,
      });
    } catch (error: any) {
      console.error('Stop stream error:', error);
      toast({
        title: "Error",
        description: "Failed to stop stream",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const enterFullscreen = () => {
    if (videoRef.current && videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = (e: any) => {
      console.error('Video error:', e);
      setStreamError("Video playback error");
      setIsLoading(false);
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, []);

  // Auto-load HLS stream if available
  useEffect(() => {
    if (camera.hlsUrl && camera.streamStatus === 'active' && videoRef.current) {
      videoRef.current.src = camera.hlsUrl;
      videoRef.current.load();
    }
  }, [camera.hlsUrl, camera.streamStatus]);

  return (
    <div className={`relative overflow-hidden bg-zb-darker rounded-lg border border-slate-800 ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted={isMuted}
        controls={false}
        playsInline
        poster={`https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450`}
      />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zb-accent"></div>
        </div>
      )}

      {/* Error Overlay */}
      {streamError && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="text-center text-white p-4">
            <p className="text-sm mb-2">{streamError}</p>
            <Button
              size="sm"
              onClick={() => setStreamError(null)}
              className="bg-zb-accent hover:bg-blue-600"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Camera Info */}
      <div className="absolute top-2 left-2">
        <div className="bg-black/70 rounded px-2 py-1 text-xs text-white">
          {camera.name}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="absolute top-2 right-2">
        <div className={`w-3 h-3 rounded-full ${
          camera.isOnline 
            ? (isPlaying ? 'bg-red-500 animate-pulse' : 'bg-green-500') 
            : 'bg-gray-500'
        }`} />
      </div>

      {/* Controls */}
      <div className="absolute bottom-2 left-2 right-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {!isPlaying ? (
              <Button
                size="sm"
                onClick={startStream}
                disabled={isLoading || !camera.isOnline}
                className="bg-black/70 hover:bg-black/90 text-white p-1 h-6 w-6"
              >
                <Play className="w-3 h-3" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={stopStream}
                disabled={isLoading}
                className="bg-black/70 hover:bg-black/90 text-white p-1 h-6 w-6"
              >
                <Square className="w-3 h-3" />
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={toggleMute}
              disabled={!isPlaying}
              className="bg-black/70 hover:bg-black/90 text-white p-1 h-6 w-6"
            >
              {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </Button>
            
            <Button
              size="sm"
              onClick={enterFullscreen}
              disabled={!isPlaying}
              className="bg-black/70 hover:bg-black/90 text-white p-1 h-6 w-6"
            >
              <Maximize2 className="w-3 h-3" />
            </Button>
          </div>
          
          <span className="bg-black/70 rounded px-2 py-1 text-xs text-white">
            {isPlaying ? 'LIVE' : (camera.isOnline ? 'Ready' : 'Offline')}
          </span>
        </div>
      </div>
    </div>
  );
}