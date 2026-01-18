import { useEffect, useRef } from "react";
import type {
  Address,
  OptimizedRoute,
  DetailedRouteSegment,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Maximize2 } from "lucide-react";

// Declare Leaflet globally
declare global {
  interface Window {
    L: any;
  }
}

interface RouteMapProps {
  addresses: Address[];
  optimizedRoute: OptimizedRoute | null;
  detailedSegments?: DetailedRouteSegment[];
  isCalculating: boolean;
}

export default function RouteMap({
  addresses,
  optimizedRoute,
  detailedSegments,
  isCalculating,
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routeLineRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current && window.L) {
      mapInstanceRef.current = window.L
        .map(mapRef.current)
        .setView([37.4419, -122.1419], 11);

      window.L
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        })
        .addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (addresses.length === 0) return;

    const addressesToShow =
      optimizedRoute?.orderedAddresses || addresses;

    addressesToShow.forEach((address, index) => {
      const isStart = index === 0;
      const isEnd =
        index === addressesToShow.length - 1 && !!optimizedRoute;

      let color = "#3B82F6";
      if (isStart) color = "#10B981";
      else if (isEnd) color = "#EF4444";

      const marker = window.L
        .circleMarker([address.latitude, address.longitude], {
          radius: 8,
          fillColor: color,
          color: "white",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        })
        .addTo(mapInstanceRef.current);

      marker.bindPopup(`
        <div class="p-2">
          <h4 class="font-medium">${address.name}</h4>
          <p class="text-sm text-gray-600">${address.address}</p>
          <p class="text-xs text-gray-500 mt-1">${
            isStart ? "Start" : isEnd ? "End" : `Stop ${index + 1}`
          }</p>
        </div>
      `);

      markersRef.current.push(marker);
    });

    if (optimizedRoute && optimizedRoute.orderedAddresses.length > 1) {
      if (detailedSegments && detailedSegments.length > 0) {
        detailedSegments.forEach((segment, index) => {
          try {
            const geometry = JSON.parse(segment.geometry);
            if (geometry?.coordinates) {
              const coords = geometry.coordinates.map(
                (c: number[]) => [c[1], c[0]]
              );

              const color = index === 0 ? "#10B981" : "#3B82F6";

              window.L
                .polyline(coords, {
                  color,
                  weight: 4,
                  opacity: 0.8,
                })
                .addTo(mapInstanceRef.current);
            }
          } catch {
            window.L
              .polyline(
                [
                  [segment.from.latitude, segment.from.longitude],
                  [segment.to.latitude, segment.to.longitude],
                ],
                {
                  color: "#3B82F6",
                  weight: 3,
                  opacity: 0.8,
                  dashArray: "5, 5",
                }
              )
              .addTo(mapInstanceRef.current);
          }
        });
      } else {
        const coords = optimizedRoute.orderedAddresses.map((a) => [
          a.latitude,
          a.longitude,
        ]);

        coords.push([
          optimizedRoute.orderedAddresses[0].latitude,
          optimizedRoute.orderedAddresses[0].longitude,
        ]);

        routeLineRef.current = window.L
          .polyline(coords, {
            color: "#3B82F6",
            weight: 3,
            opacity: 0.8,
            dashArray: "5, 5",
          })
          .addTo(mapInstanceRef.current);
      }
    }

    if (markersRef.current.length > 0) {
      const group = new window.L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [addresses, optimizedRoute, detailedSegments]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      <div className="absolute top-4 right-4 space-y-2">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md border overflow-hidden">
          <Button size="sm" variant="ghost" onClick={() => mapInstanceRef.current?.zoomIn()}>
            <Plus className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => mapInstanceRef.current?.zoomOut()}>
            <Minus className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => {
            if (markersRef.current.length) {
              const g = new window.L.featureGroup(markersRef.current);
              mapInstanceRef.current.fitBounds(g.getBounds().pad(0.1));
            }
          }}>
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isCalculating && (
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-lg shadow">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="font-medium">Optimizing Route…</p>
          </div>
        </div>
      )}
    </div>
  );
}
