import { useState } from "react";
import { Search, Bell, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: activeAlerts } = useQuery({
    queryKey: ["/api/alerts", { active: true }],
  });

  const alertCount = Array.isArray(activeAlerts) ? activeAlerts.length : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement global search functionality
      console.log("Searching for:", searchQuery);
    }
  };

  return (
    <header className="bg-zb-dark border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 zb-gradient rounded-lg flex items-center justify-center">
                <Bot className="text-white w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-white">Zerobotics</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6 ml-8">
              <a href="#" className="text-slate-300 hover:text-white transition-colors">
                Dashboard
              </a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">
                Cameras
              </a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">
                Analytics
              </a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">
                Reports
              </a>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:block relative">
              <Input
                type="text"
                placeholder="Search video feeds, incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zb-card text-slate-300 placeholder-slate-500 border-slate-700 w-64 pl-10 focus:ring-2 focus:ring-zb-accent focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
            </form>
            
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative p-2 text-slate-400 hover:text-white">
                  <Bell className="w-5 h-5" />
                  {alertCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                      {alertCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Array.isArray(activeAlerts) && activeAlerts.slice(0, 3).map((alert: any) => (
                  <DropdownMenuItem key={alert.id} className="flex flex-col items-start space-y-1">
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-sm text-slate-500">{alert.description}</div>
                    <div className="text-xs text-slate-400">
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </div>
                  </DropdownMenuItem>
                )) || (
                  <DropdownMenuItem>No new notifications</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-zb-accent to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">JD</span>
              </div>
              <span className="hidden md:block text-slate-300">John Doe</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
