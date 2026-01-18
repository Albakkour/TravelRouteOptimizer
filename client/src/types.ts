/* =========================================================
   FRONTEND DATA TRANSFER OBJECTS (DTOs)
   DO NOT import backend schema here
========================================================= */

export interface Address {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  verified: boolean | null;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  geometry: string;
}

export interface DetailedRouteSegment {
  from: Address;
  to: Address;
  distance: number;
  duration: number;
  geometry: string;
  steps: RouteStep[];
}

export interface OptimizedRoute {
  orderedAddresses: Address[];
  totalDistance: number;
  estimatedTime: number;
  algorithm: string;
  efficiency?: number;
  savedDistance?: number;
  detailedSegments?: DetailedRouteSegment[];
}
