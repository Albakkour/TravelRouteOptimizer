import { Address, OptimizedRoute } from "@shared/schema";

interface DistanceMatrix {
  [key: string]: { [key: string]: number };
}

interface RouteSegment {
  distance: number;
  duration: number; // in seconds
}

export class TSPService {
  private osrmBaseUrl = 'https://router.project-osrm.org';

  // Calculate distance matrix using OSRM
  async calculateDistanceMatrix(addresses: Address[]): Promise<DistanceMatrix> {
    if (addresses.length < 2) {
      throw new Error('Need at least 2 addresses to calculate distances');
    }

    const coordinates = addresses.map(addr => `${addr.longitude},${addr.latitude}`).join(';');
    const url = `${this.osrmBaseUrl}/table/v1/driving/${coordinates}?annotations=distance,duration`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.statusText}`);
      }

      const data = await response.json();
      const matrix: DistanceMatrix = {};

      for (let i = 0; i < addresses.length; i++) {
        matrix[addresses[i].id.toString()] = {};
        for (let j = 0; j < addresses.length; j++) {
          const distance = data.distances[i][j] / 1000; // Convert to kilometers
          matrix[addresses[i].id.toString()][addresses[j].id.toString()] = distance;
        }
      }

      return matrix;
    } catch (error) {
      console.error('Distance matrix calculation error:', error);
      // Fallback to Euclidean distance
      return this.calculateEuclideanDistanceMatrix(addresses);
    }
  }

  // Fallback Euclidean distance calculation
  private calculateEuclideanDistanceMatrix(addresses: Address[]): DistanceMatrix {
    const matrix: DistanceMatrix = {};
    
    for (const addr1 of addresses) {
      matrix[addr1.id.toString()] = {};
      for (const addr2 of addresses) {
        const distance = this.haversineDistance(
          addr1.latitude, addr1.longitude,
          addr2.latitude, addr2.longitude
        );
        matrix[addr1.id.toString()][addr2.id.toString()] = distance;
      }
    }

    return matrix;
  }

  // Haversine formula for calculating distance between two points
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Nearest Neighbor TSP Algorithm
  solveNearestNeighbor(addresses: Address[], distanceMatrix: DistanceMatrix): OptimizedRoute {
    if (addresses.length < 2) {
      throw new Error('Need at least 2 addresses for TSP');
    }

    const unvisited = new Set(addresses.map(addr => addr.id.toString()));
    const route = [addresses[0]];
    unvisited.delete(addresses[0].id.toString());
    
    let totalDistance = 0;
    let currentId = addresses[0].id.toString();

    while (unvisited.size > 0) {
      let nearestId = '';
      let nearestDistance = Infinity;

      for (const id of unvisited) {
        const distance = distanceMatrix[currentId][id];
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestId = id;
        }
      }

      const nearestAddress = addresses.find(addr => addr.id.toString() === nearestId)!;
      route.push(nearestAddress);
      totalDistance += nearestDistance;
      unvisited.delete(nearestId);
      currentId = nearestId;
    }

    // Return to start
    totalDistance += distanceMatrix[currentId][addresses[0].id.toString()];

    return {
      orderedAddresses: route,
      totalDistance,
      estimatedTime: Math.round(totalDistance * 2), // Rough estimate: 2 minutes per km
      algorithm: 'nearest-neighbor'
    };
  }

  // 2-Opt TSP Algorithm
  solve2Opt(addresses: Address[], distanceMatrix: DistanceMatrix): OptimizedRoute {
    let route = this.solveNearestNeighbor(addresses, distanceMatrix);
    let improved = true;
    let iterations = 0;
    const maxIterations = 1000;

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      for (let i = 1; i < route.orderedAddresses.length - 2; i++) {
        for (let j = i + 1; j < route.orderedAddresses.length; j++) {
          if (j - i === 1) continue; // Skip adjacent edges

          const newRoute = this.twoOptSwap(route.orderedAddresses, i, j);
          const newDistance = this.calculateRouteDistance(newRoute, distanceMatrix);

          if (newDistance < route.totalDistance) {
            route = {
              orderedAddresses: newRoute,
              totalDistance: newDistance,
              estimatedTime: Math.round(newDistance * 2),
              algorithm: '2-opt'
            };
            improved = true;
          }
        }
      }
    }

    return route;
  }

  private twoOptSwap(route: Address[], i: number, j: number): Address[] {
    const newRoute = [...route];
    // Reverse the segment between i and j
    const segment = newRoute.slice(i, j + 1).reverse();
    newRoute.splice(i, j - i + 1, ...segment);
    return newRoute;
  }

  private calculateRouteDistance(route: Address[], distanceMatrix: DistanceMatrix): number {
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += distanceMatrix[route[i].id.toString()][route[i + 1].id.toString()];
    }
    // Add return to start
    totalDistance += distanceMatrix[route[route.length - 1].id.toString()][route[0].id.toString()];
    return totalDistance;
  }

  async optimizeRoute(addresses: Address[], algorithm: 'nearest-neighbor' | '2-opt' = '2-opt'): Promise<OptimizedRoute> {
    const distanceMatrix = await this.calculateDistanceMatrix(addresses);
    
    const originalDistance = this.calculateOriginalDistance(addresses, distanceMatrix);
    
    let optimizedRoute: OptimizedRoute;
    
    if (algorithm === 'nearest-neighbor') {
      optimizedRoute = this.solveNearestNeighbor(addresses, distanceMatrix);
    } else {
      optimizedRoute = this.solve2Opt(addresses, distanceMatrix);
    }

    // Calculate efficiency metrics
    const savedDistance = originalDistance - optimizedRoute.totalDistance;
    const efficiency = originalDistance > 0 ? (savedDistance / originalDistance) * 100 : 0;

    return {
      ...optimizedRoute,
      savedDistance,
      efficiency
    };
  }

  private calculateOriginalDistance(addresses: Address[], distanceMatrix: DistanceMatrix): number {
    let totalDistance = 0;
    for (let i = 0; i < addresses.length - 1; i++) {
      totalDistance += distanceMatrix[addresses[i].id.toString()][addresses[i + 1].id.toString()];
    }
    // Add return to start
    totalDistance += distanceMatrix[addresses[addresses.length - 1].id.toString()][addresses[0].id.toString()];
    return totalDistance;
  }
}

export const tspService = new TSPService();
