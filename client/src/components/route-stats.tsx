import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import type { OptimizedRoute } from "@/types";

interface RouteStatsProps {
  route: OptimizedRoute;
}

export default function RouteStats({ route }: RouteStatsProps) {
  const formatDistance = (km: number) => `${km.toFixed(1)} km`;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-slate-900 dark:text-slate-100">
          Optimized Route
        </h3>

        <div className="flex items-center space-x-2">
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <Check className="w-3 h-3 mr-1" />
            Optimized
          </Badge>

          <span className="text-xs text-slate-600 dark:text-slate-400">
            Algorithm: {route.algorithm === "2-opt" ? "2-Opt" : "Nearest Neighbor"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-50 dark:bg-slate-800 border-none">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {formatDistance(route.totalDistance)}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Total Distance
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 dark:bg-slate-800 border-none">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {formatTime(route.estimatedTime)}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Drive Time
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 dark:bg-slate-800 border-none">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {route.savedDistance
                ? formatDistance(route.savedDistance)
                : "N/A"}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Distance Saved
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 dark:bg-slate-800 border-none">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {route.efficiency
                ? `${route.efficiency.toFixed(1)}%`
                : "N/A"}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Improvement
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
