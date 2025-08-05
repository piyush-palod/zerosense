import { useEffect, useState } from "react";
import Header from "@/components/dashboard/header";
import StatusBar from "@/components/dashboard/status-bar";
import CameraGrid from "@/components/dashboard/camera-grid";
import AISearchPanel from "@/components/dashboard/ai-search-panel";
import AlertsPanel from "@/components/dashboard/alerts-panel";
import AnalyticsWidget from "@/components/dashboard/analytics-widget";
import ActivityFeed from "@/components/dashboard/activity-feed";
import AIVideoAnalysisPanel from "@/components/dashboard/ai-video-analysis-panel";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  
  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useWebSocket("/ws");

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        
        switch (data.type) {
          case 'ALERT_CREATED':
            toast({
              title: "New Alert",
              description: data.data.title,
              variant: data.data.severity === 'high' ? 'destructive' : 'default',
            });
            break;
          case 'CAMERA_ADDED':
            toast({
              title: "Camera Added",
              description: `New camera: ${data.data.name}`,
            });
            break;
          case 'CAMERA_UPDATED':
            if (!data.data.isOnline) {
              toast({
                title: "Camera Offline",
                description: `${data.data.name} has gone offline`,
                variant: "destructive",
              });
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage, toast]);

  return (
    <div className="min-h-screen bg-zb-darker">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <StatusBar />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Camera Feeds & AI Search */}
          <div className="lg:col-span-2 space-y-6">
            <CameraGrid 
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AISearchPanel />
              <AIVideoAnalysisPanel />
            </div>
          </div>
          
          {/* Right Column: Alerts & Analytics */}
          <div className="space-y-6">
            <AlertsPanel />
            <AnalyticsWidget />
            <ActivityFeed />
          </div>
        </div>
      </main>
      
      {/* Connection Status Indicator */}
      <div className="fixed bottom-4 right-4">
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-medium ${
          isConnected 
            ? 'bg-green-900/50 text-green-400 border border-green-400/20' 
            : 'bg-red-900/50 text-red-400 border border-red-400/20'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-400 animate-pulse-slow' : 'bg-red-400'
          }`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </div>
  );
}
