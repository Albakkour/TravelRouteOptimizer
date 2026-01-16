"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tspService = exports.TSPService = void 0;
class TSPService {
    constructor() {
        this.osrmBaseUrl = 'https://router.project-osrm.org';
    }
    // Calculate distance matrix using OSRM with detailed routing
    async calculateDistanceMatrix(addresses) {
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
            const matrix = {};
            for (let i = 0; i < addresses.length; i++) {
                matrix[addresses[i].id.toString()] = {};
                for (let j = 0; j < addresses.length; j++) {
                    const distance = data.distances[i][j] / 1000; // Convert to kilometers
                    matrix[addresses[i].id.toString()][addresses[j].id.toString()] = distance;
                }
            }
            return matrix;
        }
        catch (error) {
            console.error('Distance matrix calculation error:', error);
            // Fallback to Euclidean distance
            return this.calculateEuclideanDistanceMatrix(addresses);
        }
    }
    // Get detailed routing information between two addresses
    async getDetailedRoute(from, to) {
        const coordinates = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
        const url = `${this.osrmBaseUrl}/route/v1/driving/${coordinates}?steps=true&geometries=geojson&overview=full`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`OSRM route API error: ${response.statusText}`);
            }
            const data = await response.json();
            const route = data.routes[0];
            const steps = route.legs[0].steps.map((step) => ({
                instruction: step.maneuver.instruction || `${step.maneuver.type} ${step.maneuver.modifier || ''}`.trim(),
                distance: Math.round(step.distance),
                duration: Math.round(step.duration),
                geometry: JSON.stringify(step.geometry)
            }));
            return {
                from,
                to,
                distance: Math.round(route.distance / 1000 * 10) / 10, // km with 1 decimal
                duration: Math.round(route.duration / 60), // minutes
                geometry: JSON.stringify(route.geometry),
                steps
            };
        }
        catch (error) {
            console.error('Detailed route error:', error);
            // Fallback to basic segment
            const distance = this.haversineDistance(from.latitude, from.longitude, to.latitude, to.longitude);
            return {
                from,
                to,
                distance: Math.round(distance * 10) / 10,
                duration: Math.round(distance * 2), // 2 minutes per km estimate
                geometry: JSON.stringify({
                    type: "LineString",
                    coordinates: [[from.longitude, from.latitude], [to.longitude, to.latitude]]
                }),
                steps: [{
                        instruction: `Drive to ${to.name}`,
                        distance: Math.round(distance * 1000),
                        duration: Math.round(distance * 2 * 60),
                        geometry: JSON.stringify({
                            type: "LineString",
                            coordinates: [[from.longitude, from.latitude], [to.longitude, to.latitude]]
                        })
                    }]
            };
        }
    }
    // Fallback Euclidean distance calculation
    calculateEuclideanDistanceMatrix(addresses) {
        const matrix = {};
        for (const addr1 of addresses) {
            matrix[addr1.id.toString()] = {};
            for (const addr2 of addresses) {
                const distance = this.haversineDistance(addr1.latitude, addr1.longitude, addr2.latitude, addr2.longitude);
                matrix[addr1.id.toString()][addr2.id.toString()] = distance;
            }
        }
        return matrix;
    }
    // Haversine formula for calculating distance between two points
    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    // Nearest Neighbor TSP Algorithm
    solveNearestNeighbor(addresses, distanceMatrix) {
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
            for (const id of Array.from(unvisited)) {
                const distance = distanceMatrix[currentId][id];
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestId = id;
                }
            }
            const nearestAddress = addresses.find(addr => addr.id.toString() === nearestId);
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
    solve2Opt(addresses, distanceMatrix) {
        let route = this.solveNearestNeighbor(addresses, distanceMatrix);
        let improved = true;
        let iterations = 0;
        const maxIterations = 1000;
        while (improved && iterations < maxIterations) {
            improved = false;
            iterations++;
            for (let i = 1; i < route.orderedAddresses.length - 2; i++) {
                for (let j = i + 1; j < route.orderedAddresses.length; j++) {
                    if (j - i === 1)
                        continue; // Skip adjacent edges
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
    twoOptSwap(route, i, j) {
        const newRoute = [...route];
        // Reverse the segment between i and j
        const segment = newRoute.slice(i, j + 1).reverse();
        newRoute.splice(i, j - i + 1, ...segment);
        return newRoute;
    }
    calculateRouteDistance(route, distanceMatrix) {
        let totalDistance = 0;
        for (let i = 0; i < route.length - 1; i++) {
            totalDistance += distanceMatrix[route[i].id.toString()][route[i + 1].id.toString()];
        }
        // Add return to start
        totalDistance += distanceMatrix[route[route.length - 1].id.toString()][route[0].id.toString()];
        return totalDistance;
    }
    async optimizeRoute(addresses, algorithm = '2-opt') {
        const distanceMatrix = await this.calculateDistanceMatrix(addresses);
        const originalDistance = this.calculateOriginalDistance(addresses, distanceMatrix);
        let optimizedRoute;
        if (algorithm === 'nearest-neighbor') {
            optimizedRoute = this.solveNearestNeighbor(addresses, distanceMatrix);
        }
        else {
            optimizedRoute = this.solve2Opt(addresses, distanceMatrix);
        }
        // Calculate efficiency metrics
        const savedDistance = originalDistance - optimizedRoute.totalDistance;
        const efficiency = originalDistance > 0 ? (savedDistance / originalDistance) * 100 : 0;
        // Get detailed routing for each segment
        const detailedSegments = [];
        for (let i = 0; i < optimizedRoute.orderedAddresses.length; i++) {
            const from = optimizedRoute.orderedAddresses[i];
            const to = optimizedRoute.orderedAddresses[(i + 1) % optimizedRoute.orderedAddresses.length];
            const segment = await this.getDetailedRoute(from, to);
            detailedSegments.push(segment);
        }
        return {
            ...optimizedRoute,
            savedDistance,
            efficiency,
            detailedSegments
        };
    }
    calculateOriginalDistance(addresses, distanceMatrix) {
        let totalDistance = 0;
        for (let i = 0; i < addresses.length - 1; i++) {
            totalDistance += distanceMatrix[addresses[i].id.toString()][addresses[i + 1].id.toString()];
        }
        // Add return to start
        totalDistance += distanceMatrix[addresses[addresses.length - 1].id.toString()][addresses[0].id.toString()];
        return totalDistance;
    }
}
exports.TSPService = TSPService;
exports.tspService = new TSPService();
//# sourceMappingURL=tsp.js.map