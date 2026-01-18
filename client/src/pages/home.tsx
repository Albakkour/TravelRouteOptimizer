import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AddressInput from "@/components/address-input";
import AddressList from "@/components/address-list";
import RouteMap from "@/components/route-map";
import RouteStats from "@/components/route-stats";
import RouteDirections from "@/components/route-directions";
import RouteSummary from "@/components/route-summary";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Route,
  Settings,
  Moon,
  Sun,
  Save,
  Download,
  Share2,
  Trash2,
  Navigation,
  Map,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* =========================================================
   FRONTEND-ONLY TYPES (DO NOT IMPORT BACKEND SCHEMA)
========================================================= */

interface Address {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  verified: boolean | null;
}

interface DetailedRouteSegment {
  from: Address;
  to: Address;
  distance: number;
  duration: number;
  geometry: string;
  steps: {
    instruction: string;
    distance: number;
    duration: number;
    geometry: string;
  }[];
}

interface OptimizedRoute {
  orderedAddresses: Address[];
  totalDistance: number;
  estimatedTime: number;
  algorithm: string;
  efficiency?: number;
  savedDistance?: number;
  detailedSegments?: DetailedRouteSegment[];
}

/* ========================================================= */

export default function Home() {
  const [algorithm, setAlgorithm] =
    useState<"nearest-neighbor" | "2-opt">("2-opt");
  const [optimizedRoute, setOptimizedRoute] =
    useState<OptimizedRoute | null>(null);
  const [detailedSegments, setDetailedSegments] = useState<
    DetailedRouteSegment[]
  >([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { toast } = useToast();

  /* -------------------------------
     Fetch addresses
  -------------------------------- */
  const { data: addresses = [], isLoading } = useQuery<Address[]>({
    queryKey: ["/api/addresses"],
  });

  /* -------------------------------
     Optimize route
  -------------------------------- */
  const optimizeRouteMutation = useMutation({
    mutationFn: async (payload: {
      addressIds: number[];
      algorithm: string;
    }) => {
      const res = await apiRequest(
        "POST",
        "/api/optimize-route",
        payload
      );
      return res.json();
    },
    onSuccess: (data) => {
      setOptimizedRoute(data.optimizedRoute);
      setDetailedSegments(data.optimizedRoute.detailedSegments || []);
      toast({
        title: "Route Optimized",
        description: `Algorithm: ${algorithm}`,
      });
    },
    onError: () => {
      toast({
        title: "Optimization Failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  /* -------------------------------
     Clear all addresses
  -------------------------------- */
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      for (const addr of addresses) {
        await apiRequest("DELETE", `/api/addresses/${addr.id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      setOptimizedRoute(null);
      setDetailedSegments([]);
      toast({
        title: "Cleared",
        description: "All addresses removed",
      });
    },
  });

  const handleOptimizeRoute = () => {
    if (addresses.length < 2) {
      toast({
        title: "Need at least 2 addresses",
        variant: "destructive",
      });
      return;
    }

    optimizeRouteMutation.mutate({
      addressIds: addresses.map((a) => a.id),
      algorithm,
    });
  };

  const toggleDarkMode = () => {
    setIsDarkMode((v) => !v);
    document.documentElement.classList.toggle("dark");
  };

  /* ========================================================= */

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? "dark" : ""}`}>
      {/* HEADER */}
      <header className="flex justify-between items-center p-4 border-b bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Route />
          <h1 className="font-semibold">Route Optimizer</h1>
        </div>
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" onClick={toggleDarkMode}>
            {isDarkMode ? <Sun /> : <Moon />}
          </Button>
          <Button size="icon" variant="ghost">
            <Settings />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-96 border-r p-4 bg-white dark:bg-slate-900 flex flex-col">
          <div className="mb-3 flex justify-between items-center">
            <h2 className="font-medium">Addresses</h2>
            <Badge>{addresses.length} / 20</Badge>
          </div>

          <AddressInput />

          <div className="flex-1 overflow-y-auto mt-4">
            <AddressList addresses={addresses} isLoading={isLoading} />
          </div>

          <div className="mt-4 space-y-3">
            <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nearest-neighbor">
                  Nearest Neighbor
                </SelectItem>
                <SelectItem value="2-opt">2-Opt</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleOptimizeRoute}>
                Optimize
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => clearAllMutation.mutate()}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 bg-slate-50 dark:bg-slate-800">
          {optimizedRoute ? (
            <Tabs defaultValue="map" className="h-full flex flex-col">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="map">
                  <Map /> Map
                </TabsTrigger>
                <TabsTrigger value="directions">
                  <Navigation /> Directions
                </TabsTrigger>
                <TabsTrigger value="summary">
                  <Route /> Summary
                </TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="flex-1">
                <RouteMap
                  addresses={addresses}
                  optimizedRoute={optimizedRoute}
                  detailedSegments={detailedSegments}
                  isCalculating={optimizeRouteMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="directions" className="flex-1">
                <RouteDirections
                  segments={detailedSegments}
                  orderedAddresses={optimizedRoute.orderedAddresses}
                />
              </TabsContent>

              <TabsContent value="summary" className="flex-1">
                <RouteSummary
                  segments={detailedSegments}
                  orderedAddresses={optimizedRoute.orderedAddresses}
                  efficiency={optimizedRoute.efficiency}
                  savedDistance={optimizedRoute.savedDistance}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-slate-500">
                Add addresses and optimize a route
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
