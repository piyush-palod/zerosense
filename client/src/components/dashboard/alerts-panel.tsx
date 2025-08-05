import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Wifi, UserCheck, Eye, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function AlertsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["/api/alerts", { active: true }],
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await apiRequest("PATCH", `/api/alerts/${alertId}/resolve`, {
        resolvedBy: "current-user-id", // TODO: Get from auth context
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Alert Resolved",
        description: "Alert has been successfully resolved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resolve alert",
        variant: "destructive",
      });
    },
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "motion":
        return AlertTriangle;
      case "offline":
        return Wifi;
      case "person_detected":
        return UserCheck;
      default:
        return AlertTriangle;
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "alert-high border-zb-danger";
      case "medium":
        return "alert-medium border-zb-warning";
      case "low":
        return "alert-low border-zb-accent";
      default:
        return "alert-medium border-zb-warning";
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-zb-danger hover:bg-red-600";
      case "medium":
        return "bg-zb-warning hover:bg-amber-600";
      case "low":
        return "bg-zb-accent hover:bg-blue-600";
      default:
        return "bg-zb-warning hover:bg-amber-600";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <Card className="bg-zb-card border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Active Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zb-card border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Active Alerts</CardTitle>
          <Button variant="ghost" size="sm" className="text-zb-accent hover:text-blue-400">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 custom-scrollbar max-h-96 overflow-y-auto">
        {!Array.isArray(alerts) || alerts.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No active alerts</p>
          </div>
        ) : (
          Array.isArray(alerts) && alerts.map((alert: any) => {
            const IconComponent = getAlertIcon(alert.type);
            return (
              <div
                key={alert.id}
                className={`bg-zb-dark rounded-lg p-3 border-l-4 ${getAlertSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <IconComponent className={`w-4 h-4 ${
                        alert.severity === 'high' ? 'text-zb-danger' :
                        alert.severity === 'medium' ? 'text-zb-warning' :
                        'text-zb-accent'
                      }`} />
                      <span className="text-white font-medium text-sm">{alert.title}</span>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getSeverityBadgeColor(alert.severity)} text-white border-0`}
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-xs mb-2">{alert.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-xs">
                        {formatTimeAgo(alert.createdAt)}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          className={`text-xs px-2 py-1 h-6 ${getSeverityBadgeColor(alert.severity)} text-white`}
                          onClick={() => console.log('View alert:', alert.id)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs px-2 py-1 h-6 bg-slate-600 hover:bg-slate-500 text-white"
                          onClick={() => resolveAlertMutation.mutate(alert.id)}
                          disabled={resolveAlertMutation.isPending}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
