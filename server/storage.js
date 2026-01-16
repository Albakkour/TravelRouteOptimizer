"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.MemStorage = void 0;
class MemStorage {
    constructor() {
        this.addresses = new Map();
        this.routes = new Map();
        this.currentAddressId = 1;
        this.currentRouteId = 1;
    }
    async getAddress(id) {
        return this.addresses.get(id);
    }
    async getAllAddresses() {
        return Array.from(this.addresses.values());
    }
    async createAddress(insertAddress) {
        const id = this.currentAddressId++;
        const address = {
            id,
            name: insertAddress.name,
            address: insertAddress.address,
            latitude: insertAddress.latitude,
            longitude: insertAddress.longitude,
            verified: insertAddress.verified ?? null,
            createdAt: new Date(),
        };
        this.addresses.set(id, address);
        return address;
    }
    async updateAddress(id, updateData) {
        const existing = this.addresses.get(id);
        if (!existing)
            return undefined;
        const updated = { ...existing, ...updateData };
        this.addresses.set(id, updated);
        return updated;
    }
    async deleteAddress(id) {
        return this.addresses.delete(id);
    }
    async getRoute(id) {
        return this.routes.get(id);
    }
    async getAllRoutes() {
        return Array.from(this.routes.values());
    }
    async createRoute(insertRoute) {
        const id = this.currentRouteId++;
        const route = {
            id,
            name: insertRoute.name ?? null,
            algorithm: insertRoute.algorithm,
            totalDistance: insertRoute.totalDistance,
            estimatedTime: insertRoute.estimatedTime,
            addressOrder: insertRoute.addressOrder,
            createdAt: new Date(),
        };
        this.routes.set(id, route);
        return route;
    }
    async deleteRoute(id) {
        return this.routes.delete(id);
    }
}
exports.MemStorage = MemStorage;
exports.storage = new MemStorage();
//# sourceMappingURL=storage.js.map