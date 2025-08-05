import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function ActivityFeed() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activities", { limit: 10 }],
  });

  const getActivityColor = (type: string) => {
    switch (type) {
      case "camera_added":
      case "location_added":
        return "bg-zb-success";
      case "alert_created":
        return "bg-zb-danger";
      case "alert_resolved":
        return "bg-zb-accent";
      case "search_performed":
        return "bg-purple-500";
      case "system":
        return "bg-zb-accent";
      case "user_management":
        return "bg-zb-warning";
      case "video_analyzed":
        return "bg-purple-500";
      default:
        return "bg-slate-500";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (isLoading) {
    return (
      <Card className="bg-zb-card border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="w-2 h-2 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zb-card border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" className="text-zb-accent hover:text-blue-400">
            View More
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 custom-scrollbar max-h-64 overflow-y-auto">
        {!Array.isArray(activities) || activities.length === 0 ? (
          <div className="text-center py-4 text-slate-400">
            <p>No recent activity</p>
          </div>
        ) : (
          Array.isArray(activities) && activities.map((activity: any) => (
            <div key={activity.id} className="flex items-center space-x-3">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${getActivityColor(activity.type)}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-sm">{activity.description}</p>
                <p className="text-slate-500 text-xs">
                  {formatTimeAgo(activity.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
