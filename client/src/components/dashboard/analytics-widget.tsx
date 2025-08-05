import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsWidget() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics", { timeRange: "24h" }],
  });

  if (isLoading) {
    return (
      <Card className="bg-zb-card border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Analytics Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zb-card border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Analytics Overview</CardTitle>
          <Select defaultValue="24h">
            <SelectTrigger className="bg-zb-dark text-slate-300 border-slate-700 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7d</SelectItem>
              <SelectItem value="30d">Last 30d</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Analytics Chart Placeholder */}
        <div className="relative h-32 bg-zb-dark rounded-lg mb-4 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300"
            alt="Analytics dashboard chart"
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zb-accent/20 to-zb-success/20" />
          <div className="absolute top-4 left-4">
            <div className="text-white text-sm font-medium">Motion Events Trend</div>
            <div className="text-zb-success text-lg font-bold flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              +23%
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zb-dark rounded-lg p-3">
            <div className="text-slate-400 text-xs mb-1">People Detected</div>
            <div className="text-white text-lg font-bold">
              {(analytics && typeof analytics.peopleCount === 'number') ? analytics.peopleCount.toLocaleString() : "1,247"}
            </div>
            <div className="text-zb-success text-xs flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12% today
            </div>
          </div>
          <div className="bg-zb-dark rounded-lg p-3">
            <div className="text-slate-400 text-xs mb-1">Vehicle Traffic</div>
            <div className="text-white text-lg font-bold">
              {(analytics && analytics.vehicleCount) ? analytics.vehicleCount : "89"}
            </div>
            <div className="text-zb-warning text-xs flex items-center">
              <TrendingDown className="w-3 h-3 mr-1" />
              -3% today
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
