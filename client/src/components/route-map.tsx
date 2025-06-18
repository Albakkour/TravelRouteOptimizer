import { useEffect, useRef } from "react";
import { Address, OptimizedRoute, DetailedRouteSegment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Maximize2, Layers } from "lucide-react";

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

export default function RouteMap({ addresses, optimizedRoute, detailedSegments, isCalculating }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routeLineRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if not already done
    if (!mapInstanceRef.current && window.L) {
      mapInstanceRef.current = window.L.map(mapRef.current).setView([37.4419, -122.1419], 11);
      
      // Add tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;

    // Clear existing markers and route
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (addresses.length === 0) return;

    const addressesToShow = optimizedRoute?.orderedAddresses || addresses;

    // Add markers
    addressesToShow.forEach((address, index) => {
      const isStart = index === 0;
      const isEnd = index === addressesToShow.length - 1 && optimizedRoute;
      
      let color = '#3B82F6'; // blue
      if (isStart) color = '#10B981'; // green
      else if (isEnd) color = '#EF4444'; // red

      const marker = window.L.circleMarker([address.latitude, address.longitude], {
        radius: 8,
        fillColor: color,
        color: 'white',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(mapInstanceRef.current);

      marker.bindPopup(`
        <div class="p-2">
          <h4 class="font-medium">${address.name}</h4>
          <p class="text-sm text-gray-600">${address.address}</p>
          <p class="text-xs text-gray-500 mt-1">${isStart ? 'Start' : isEnd ? 'End' : `Stop ${index + 1}`}</p>
        </div>
      `);

      markersRef.current.push(marker);
    });

    // Add detailed route lines if available, otherwise fallback to straight lines
    if (optimizedRoute && optimizedRoute.orderedAddresses.length > 1) {
      if (detailedSegments && detailedSegments.length > 0) {
        // Draw detailed routes with actual road geometry
        detailedSegments.forEach((segment, index) => {
          try {
            const geometry = JSON.parse(segment.geometry);
            if (geometry && geometry.coordinates) {
              // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
              const coords = geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
              
              const color = index === 0 ? '#10B981' : '#3B82F6'; // Green for first segment, blue for others
              
              const polyline = window.L.polyline(coords, {
                color,
                weight: 4,
                opacity: 0.8
              }).addTo(mapInstanceRef.current);

              // Add segment markers with distance info
              const midpoint = coords[Math.floor(coords.length / 2)];
              const popup = window.L.popup({
                closeButton: false,
                autoClose: false,
                closeOnClick: false,
                className: 'route-segment-popup'
              })
              .setLatLng(midpoint)
              .setContent(`
                <div class="text-xs p-1">
                  <div class="font-medium">${segment.from.name} → ${segment.to.name}</div>
                  <div class="text-gray-600">${(segment.distance).toFixed(1)}km • ${segment.duration}min</div>
                </div>
              `);

              polyline.bindPopup(popup);
            }
          } catch (error) {
            console.error('Error parsing geometry for segment:', error);
            // Fallback to straight line for this segment
            const coords = [[segment.from.latitude, segment.from.longitude], [segment.to.latitude, segment.to.longitude]];
            window.L.polyline(coords, {
              color: '#3B82F6',
              weight: 3,
              opacity: 0.8,
              dashArray: '5, 5'
            }).addTo(mapInstanceRef.current);
          }
        });
      } else {
        // Fallback to straight lines
        const coordinates = optimizedRoute.orderedAddresses.map(addr => [addr.latitude, addr.longitude]);
        coordinates.push([optimizedRoute.orderedAddresses[0].latitude, optimizedRoute.orderedAddresses[0].longitude]);

        routeLineRef.current = window.L.polyline(coordinates, {
          color: '#3B82F6',
          weight: 3,
          opacity: 0.8,
          dashArray: '5, 5'
        }).addTo(mapInstanceRef.current);
      }
    }

    // Fit map to show all markers
    if (addressesToShow.length > 0) {
      const group = new window.L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [addresses, optimizedRoute, detailedSegments]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleFitBounds = () => {
    if (mapInstanceRef.current && markersRef.current.length > 0) {
      const group = new window.L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className="w-full border-b border-gray-200 dark:border-slate-700 rounded-none"
            onClick={handleZoomIn}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full border-b border-gray-200 dark:border-slate-700 rounded-none"
            onClick={handleZoomOut}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full rounded-none"
            onClick={handleFitBounds}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Route Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-900 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-3 max-w-xs">
        <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2 text-sm">Route Legend</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
            <span className="text-slate-600 dark:text-slate-400">Start Location</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
            <span className="text-slate-600 dark:text-slate-400">Waypoints</span>
          </div>
          {optimizedRoute && (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                <span className="text-slate-600 dark:text-slate-400">End Location</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-0.5 bg-blue-500 flex-shrink-0"></div>
                <span className="text-slate-600 dark:text-slate-400">Optimized Route</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isCalculating && (
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 text-center border border-gray-200 dark:border-slate-700">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-900 dark:text-slate-100 font-medium">Optimizing Route...</p>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">This may take a moment for complex routes</p>
          </div>
        </div>
      )}
    </div>
  );
}
