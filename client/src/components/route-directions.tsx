import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { DetailedRouteSegment, Address } from "@/types";
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Clock,
  Route,
  Navigation,
} from "lucide-react";
import { formatDistance, formatTime } from "@/lib/utils";

interface RouteDirectionsProps {
  segments: DetailedRouteSegment[];
  orderedAddresses: Address[];
}

export default function RouteDirections({
  segments,
  orderedAddresses,
}: RouteDirectionsProps) {
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(
    new Set()
  );

  const toggleSegment = (index: number) => {
    const next = new Set(expandedSegments);
    next.has(index) ? next.delete(index) : next.add(index);
    setExpandedSegments(next);
  };

  const formatInstruction = (instruction: string): string => {
    const clean = instruction
      .replace(/undefined/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!clean || clean === "depart" || clean === "arrive") {
      return instruction.includes("depart")
        ? "Start your journey"
        : "You have arrived";
    }

    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  const totalDistance = segments.reduce(
    (sum, s) => sum + s.distance,
    0
  );
  const totalDuration = segments.reduce(
    (sum, s) => sum + s.duration,
    0
  );

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Navigation className="w-5 h-5 mr-2 text-blue-500" />
            Turn-by-Turn Directions
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {segments.length} segments
          </Badge>
        </div>

        <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center">
            <Route className="w-4 h-4 mr-1" />
            {formatDistance(totalDistance)}
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {formatTime(totalDuration)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-y-auto max-h-[600px]">
        <div className="space-y-1">
          {segments.map((segment, index) => {
            const isExpanded = expandedSegments.has(index);
            const isLast = index === segments.length - 1;

            return (
              <div
                key={index}
                className="border-b border-gray-100 dark:border-slate-800 last:border-b-0"
              >
                {/* Segment header */}
                <Button
                  variant="ghost"
                  className="w-full p-4 justify-start rounded-none hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  onClick={() => toggleSegment(index)}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {segment.from.name}
                            <span className="mx-2 text-slate-400">→</span>
                            {isLast
                              ? orderedAddresses[0].name
                              : segment.to.name}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {formatDistance(segment.distance)} •{" "}
                            {formatTime(segment.duration)}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {segment.steps.length} steps
                          </Badge>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Button>

                {/* Expanded steps */}
                {isExpanded && (
                  <div className="px-4 pb-4 pl-16 space-y-3">
                    <div className="flex items-start space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-800 dark:text-green-300">
                          Starting Point
                        </p>
                        <p className="text-green-700 dark:text-green-400">
                          {segment.from.address}
                        </p>
                      </div>
                    </div>

                    {segment.steps.map((step, i) => (
                      <div
                        key={i}
                        className="flex items-start space-x-3 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/30"
                      >
                        <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs">
                          {i + 1}
                        </div>
                        <div className="flex-1 text-sm">
                          <p className="text-slate-900 dark:text-slate-100">
                            {formatInstruction(step.instruction)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {step.distance}m •{" "}
                            {Math.ceil(step.duration / 60)} min
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-start space-x-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      <MapPin className="w-4 h-4 text-red-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-red-800 dark:text-red-300">
                          {isLast ? "Return to Start" : "Destination"}
                        </p>
                        <p className="text-red-700 dark:text-red-400">
                          {isLast
                            ? orderedAddresses[0].address
                            : segment.to.address}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
