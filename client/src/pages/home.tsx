import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Address, OptimizedRoute } from "@shared/schema";
import AddressInput from "@/components/address-input";
import AddressList from "@/components/address-list";
import RouteMap from "@/components/route-map";
import RouteStats from "@/components/route-stats";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route, Settings, Moon, Sun, Save, Download, Share2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [algorithm, setAlgorithm] = useState<'nearest-neighbor' | '2-opt'>('2-opt');
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { toast } = useToast();

  const { data: addresses = [], isLoading: addressesLoading } = useQuery<Address[]>({
    queryKey: ['/api/addresses'],
  });

  const optimizeRouteMutation = useMutation({
    mutationFn: async (data: { addressIds: number[], algorithm: string }) => {
      const response = await apiRequest('POST', '/api/optimize-route', data);
      return response.json();
    },
    onSuccess: (data) => {
      setOptimizedRoute(data.optimizedRoute);
      toast({
        title: "Route Optimized",
        description: `Found optimal route using ${algorithm} algorithm`,
      });
    },
    onError: () => {
      toast({
        title: "Optimization Failed",
        description: "Failed to optimize route. Please try again.",
        variant: "destructive",
      });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      // Delete all addresses
      for (const address of addresses) {
        await apiRequest('DELETE', `/api/addresses/${address.id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
      setOptimizedRoute(null);
      toast({
        title: "Cleared",
        description: "All addresses have been cleared",
      });
    },
  });

  const handleOptimizeRoute = () => {
    if (addresses.length < 2) {
      toast({
        title: "Insufficient Addresses",
        description: "Please add at least 2 addresses to optimize the route",
        variant: "destructive",
      });
      return;
    }

    if (addresses.length > 20) {
      toast({
        title: "Too Many Addresses",
        description: "Maximum 20 addresses allowed",
        variant: "destructive",
      });
      return;
    }

    optimizeRouteMutation.mutate({
      addressIds: addresses.map(addr => addr.id),
      algorithm,
    });
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`h-screen flex flex-col bg-slate-50 ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Route className="text-white w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Route Optimizer</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Traveling Salesman Problem Solver</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-96 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col">
          {/* Address Input Section */}
          <div className="p-4 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-slate-900 dark:text-slate-100">Addresses</h2>
              <Badge variant="secondary" className="text-xs">
                {addresses.length} / 20
              </Badge>
            </div>
            <AddressInput />
          </div>

          {/* Address List */}
          <div className="flex-1 overflow-y-auto">
            <AddressList addresses={addresses} isLoading={addressesLoading} />
          </div>

          {/* Control Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
            {/* Algorithm Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                Optimization Algorithm
              </label>
              <Select value={algorithm} onValueChange={(value) => setAlgorithm(value as typeof algorithm)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nearest-neighbor">Nearest Neighbor (Fast)</SelectItem>
                  <SelectItem value="2-opt">2-Opt Optimization (Better)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                onClick={handleOptimizeRoute}
                disabled={optimizeRouteMutation.isPending || addresses.length < 2}
              >
                <Route className="w-4 h-4 mr-2" />
                {optimizeRouteMutation.isPending ? 'Optimizing...' : 'Optimize Route'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearAllMutation.mutate()}
                disabled={clearAllMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex space-x-2">
              <Button variant="secondary" size="sm" className="flex-1">
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
              <Button variant="secondary" size="sm" className="flex-1">
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
              <Button variant="secondary" size="sm" className="flex-1">
                <Share2 className="w-3 h-3 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-800">
          {/* Results Header */}
          {optimizedRoute && (
            <RouteStats route={optimizedRoute} />
          )}

          {/* Map Container */}
          <div className="flex-1 relative">
            <RouteMap
              addresses={addresses}
              optimizedRoute={optimizedRoute}
              isCalculating={optimizeRouteMutation.isPending}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
