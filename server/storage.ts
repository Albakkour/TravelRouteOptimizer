import {
  addresses,
  routes,
  type Address,
  type InsertAddress,
  type Route,
  type InsertRoute,
} from "./shared/schema";


export interface IStorage {
  // Address operations
  getAddress(id: number): Promise<Address | undefined>;
  getAllAddresses(): Promise<Address[]>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(
    id: number,
    address: Partial<InsertAddress>
  ): Promise<Address | undefined>;
  deleteAddress(id: number): Promise<boolean>;

  // Route operations
  getRoute(id: number): Promise<Route | undefined>;
  getAllRoutes(): Promise<Route[]>;
  createRoute(route: InsertRoute): Promise<Route>;
  deleteRoute(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private addresses: Map<number, Address>;
  private routes: Map<number, Route>;
  private currentAddressId: number;
  private currentRouteId: number;

  constructor() {
    this.addresses = new Map();
    this.routes = new Map();
    this.currentAddressId = 1;
    this.currentRouteId = 1;
  }

  async getAddress(id: number): Promise<Address | undefined> {
    return this.addresses.get(id);
  }

  async getAllAddresses(): Promise<Address[]> {
    return Array.from(this.addresses.values());
  }

  async createAddress(insertAddress: InsertAddress): Promise<Address> {
    const id = this.currentAddressId++;

    const address: Address = {
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

  async updateAddress(
    id: number,
    updateData: Partial<InsertAddress>
  ): Promise<Address | undefined> {
    const existing = this.addresses.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updateData };
    this.addresses.set(id, updated);
    return updated;
  }

  async deleteAddress(id: number): Promise<boolean> {
    return this.addresses.delete(id);
  }

  async getRoute(id: number): Promise<Route | undefined> {
    return this.routes.get(id);
  }

  async getAllRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values());
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const id = this.currentRouteId++;

    const route: Route = {
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

  async deleteRoute(id: number): Promise<boolean> {
    return this.routes.delete(id);
  }
}

export const storage = new MemStorage();
