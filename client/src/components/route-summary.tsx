import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailedRouteSegment, Address } from "@shared/schema";
import { MapPin, ArrowRight, Clock, Route, CheckCircle } from "lucide-react";
import { formatDistance, formatTime } from "@/lib/utils";

interface RouteSummaryProps {
  segments: DetailedRouteSegment[];
  orderedAddresses: Address[];
  efficiency?: number;
  savedDistance?: number;
}

export default function RouteSummary({ segments, orderedAddresses, efficiency, savedDistance }: RouteSummaryProps) {
  const totalDistance = segments.reduce((sum, segment) => sum + segment.distance, 0);
  const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            Route Summary
          </CardTitle>
          <div className="flex items-center space-x-2">
            {efficiency && efficiency > 0 && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {efficiency.toFixed(1)}% improvement
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {formatDistance(totalDistance)}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Total Distance</div>
          </div>
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {formatTime(totalDuration)}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Drive Time</div>
          </div>
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {segments.length}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Segments</div>
          </div>
        </div>

        {/* Route Order */}
        <div>
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center">
            <Route className="w-4 h-4 mr-2" />
            Optimized Visit Order
          </h4>
          <div className="space-y-2">
            {orderedAddresses.map((address, index) => {
              const isLast = index === orderedAddresses.length - 1;
              const segment = segments[index];
              
              return (
                <div key={address.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      index === 0 
                        ? 'bg-green-500 text-white' 
                        : isLast 
                        ? 'bg-red-500 text-white' 
                        : 'bg-blue-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {address.name}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {index === 0 ? 'Start' : isLast ? 'End' : `Stop ${index}`}
                      </p>
                    </div>
                  </div>
                  
                  {segment && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {formatDistance(segment.distance)}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {formatTime(segment.duration)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Return to start */}
            <div className="flex items-center justify-center py-2">
              <ArrowRight className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Return to start</span>
            </div>
          </div>
        </div>

        {/* Efficiency Info */}
        {savedDistance && savedDistance > 0 && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm text-green-800 dark:text-green-300">
                Optimization saved {formatDistance(savedDistance)} compared to the original route
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}