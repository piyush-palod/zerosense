import { Card, CardContent } from "@/components/ui/card";
import { Video, AlertTriangle, MapPin, Database, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatusBar() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-zb-card border-slate-800">
            <CardContent className="p-4">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Active Cameras",
      value: (stats && typeof stats.activeCameras === 'number') ? stats.activeCameras : 0,
      icon: Video,
      iconBg: "bg-zb-success/20",
      iconColor: "text-zb-success",
      trend: { value: 5, direction: "up" },
      trendLabel: "vs last week"
    },
    {
      title: "Active Alerts",
      value: (stats && typeof stats.activeAlerts === 'number') ? stats.activeAlerts : 0,
      icon: AlertTriangle,
      iconBg: "bg-zb-warning/20",
      iconColor: "text-zb-warning",
      trend: { value: 12, direction: "up" },
      trendLabel: "vs last week"
    },
    {
      title: "Locations",
      value: (stats && typeof stats.locations === 'number') ? stats.locations : 0,
      icon: MapPin,
      iconBg: "bg-zb-accent/20",
      iconColor: "text-zb-accent",
      trend: { value: 2, direction: "up" },
      trendLabel: "new this month"
    },
    {
      title: "Storage Used",
      value: (stats && stats.storageUsed) ? stats.storageUsed : "0TB",
      icon: Database,
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-500",
      trend: null,
      trendLabel: `${(stats && typeof stats.storagePercent === 'number') ? stats.storagePercent : 0}% of 3.5TB limit`
    }
  ];

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="bg-zb-card border-slate-800 zb-card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`${stat.iconColor} w-6 h-6`} />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              {stat.trend && (
                <>
                  <span className={`text-sm flex items-center ${
                    stat.trend.direction === 'up' ? 'text-zb-success' : 'text-zb-danger'
                  }`}>
                    {stat.trend.direction === 'up' ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {stat.trend.value}%
                  </span>
                  <span className="text-slate-400 text-sm ml-2">{stat.trendLabel}</span>
                </>
              )}
              {!stat.trend && (
                <span className="text-slate-400 text-sm">{stat.trendLabel}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
