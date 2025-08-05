import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Search, Expand, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import LiveCameraFeed from "./live-camera-feed";

interface CameraGridProps {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
}

export default function CameraGrid({ selectedLocation, onLocationChange }: CameraGridProps) {
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

  const { data: cameras, isLoading: camerasLoading } = useQuery({
    queryKey: ["/api/cameras", selectedLocation !== "all" ? { locationId: selectedLocation } : {}],
  });

  const { data: locations } = useQuery({
    queryKey: ["/api/locations"],
  });

  const handleCameraClick = (cameraId: string) => {
    setSelectedCamera(cameraId);
    // TODO: Open fullscreen camera view or detailed controls
    console.log('Camera clicked:', cameraId);
  };

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? "status-online" : "status-offline";
  };

  const getCameraImage = (cameraName: string) => {
    // Mock camera feed images based on camera name
    const imageMap: Record<string, string> = {
      "Main Entrance": "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450",
      "Reception": "https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450",
      "Warehouse A": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450",
      "Parking Lot": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450",
      "Hallway B": "https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450",
      "Conference A": "https://images.unsplash.com/photo-1497366412874-3415097a27e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450",
    };
    
    return imageMap[cameraName] || imageMap["Main Entrance"];
  };

  if (camerasLoading) {
    return (
      <Card className="bg-zb-card border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Live Camera Feeds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-video rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zb-card border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Live Camera Feeds</CardTitle>
          <div className="flex items-center space-x-3">
            <Select value={selectedLocation} onValueChange={onLocationChange}>
              <SelectTrigger className="bg-zb-dark text-slate-300 border-slate-700 w-48">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {Array.isArray(locations) && locations.map((location: any) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="bg-zb-accent hover:bg-blue-600 text-white">
              <Expand className="w-4 h-4 mr-2" />
              Fullscreen
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.isArray(cameras) && cameras.map((camera: any) => (
            <div
              key={camera.id}
              className="group cursor-pointer"
              onClick={() => handleCameraClick(camera.id)}
            >
              <LiveCameraFeed 
                camera={camera}
                className="aspect-video"
              />
            </div>
          ))}
          
          {/* Add Camera Button */}
          <div className="aspect-video bg-zb-dark border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center group hover:border-zb-accent transition-colors cursor-pointer">
            <div className="text-center">
              <Plus className="w-8 h-8 text-slate-500 group-hover:text-zb-accent mx-auto mb-2" />
              <p className="text-slate-500 group-hover:text-zb-accent text-sm">Add Camera</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
