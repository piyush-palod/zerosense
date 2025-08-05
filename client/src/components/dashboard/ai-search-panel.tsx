import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Search, User, Car, Play, Package } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AISearchPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recentSearches } = useQuery({
    queryKey: ["/api/video/searches"],
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/video/search", {
        query,
        filters: {}
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Search Complete",
        description: `Found ${data.results?.length || 0} results for "${data.query}"`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/video/searches"] });
      setSearchQuery("");
    },
    onError: (error: any) => {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to perform video search",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchMutation.mutate(searchQuery.trim());
    }
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    searchMutation.mutate(query);
  };

  const quickSearchOptions = [
    { label: "People", icon: User, query: "person detected" },
    { label: "Vehicles", icon: Car, query: "vehicle in parking lot" },
    { label: "Motion", icon: Play, query: "motion detected" },
    { label: "Objects", icon: Package, query: "package or object left behind" },
  ];

  return (
    <Card className="bg-zb-card border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">AI-Powered Video Search</CardTitle>
          <Badge className="zb-gradient text-white border-0">
            <Brain className="w-3 h-3 mr-1" />
            AI Enhanced
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative">
          <Input
            type="text"
            placeholder="Search for people, vehicles, or describe what you're looking for..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-zb-dark text-slate-300 placeholder-slate-500 border-slate-700 pl-12 pr-20 focus:ring-2 focus:ring-zb-accent focus:border-transparent"
            disabled={searchMutation.isPending}
          />
          <Brain className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zb-accent w-4 h-4" />
          <Button
            type="submit"
            size="sm"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-zb-accent hover:bg-blue-600 text-white"
            disabled={!searchQuery.trim() || searchMutation.isPending}
          >
            {searchMutation.isPending ? 'Searching...' : 'Search'}
          </Button>
        </form>
        
        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 text-sm">Quick searches:</span>
          {quickSearchOptions.map((option) => (
            <Button
              key={option.label}
              variant="outline"
              size="sm"
              className="bg-zb-dark hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700 transition-colors"
              onClick={() => handleQuickSearch(option.query)}
              disabled={searchMutation.isPending}
            >
              <option.icon className="w-3 h-3 mr-1" />
              {option.label}
            </Button>
          ))}
        </div>
        
        {/* Recent Searches */}
        <div className="bg-zb-dark rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Recent AI Searches</h3>
          <div className="space-y-2">
            {Array.isArray(recentSearches) && recentSearches.slice(0, 3).map((search: any) => (
              <div key={search.id} className="flex items-center justify-between text-sm">
                <button
                  className="text-slate-400 hover:text-slate-300 text-left flex-1 truncate"
                  onClick={() => handleQuickSearch(search.query)}
                >
                  "{search.query}"
                </button>
                <span className="text-zb-accent ml-2">
                  {search.results?.length || 0} results
                </span>
              </div>
            )) || (
              <div className="text-slate-500 text-sm">No recent searches</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
