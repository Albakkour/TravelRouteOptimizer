import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { geocodingService } from "./services/geocoding";
import { tspService } from "./services/tsp";
import { insertAddressSchema, insertRouteSchema } from "@shared/schema";
import { z } from "zod";

const optimizeRouteSchema = z.object({
  addressIds: z.array(z.number()).min(2).max(20),
  algorithm: z.enum(['nearest-neighbor', '2-opt']).default('2-opt'),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Address routes
  app.get("/api/addresses", async (req, res) => {
    try {
      const addresses = await storage.getAllAddresses();
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch addresses" });
    }
  });

  app.post("/api/addresses", async (req, res) => {
    try {
      const addressData = insertAddressSchema.parse(req.body);
      const address = await storage.createAddress(addressData);
      res.status(201).json(address);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid address data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create address" });
      }
    }
  });

  app.put("/api/addresses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertAddressSchema.partial().parse(req.body);
      const address = await storage.updateAddress(id, updateData);
      
      if (!address) {
        res.status(404).json({ message: "Address not found" });
        return;
      }
      
      res.json(address);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid address data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update address" });
      }
    }
  });

  app.delete("/api/addresses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAddress(id);
      
      if (!deleted) {
        res.status(404).json({ message: "Address not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete address" });
    }
  });

  // Geocoding route
  app.post("/api/geocode", async (req, res) => {
    try {
      const { address } = req.body;
      if (!address || typeof address !== 'string') {
        res.status(400).json({ message: "Address is required" });
        return;
      }

      const result = await geocodingService.geocodeAddress(address);
      if (!result) {
        res.status(404).json({ message: "Address not found" });
        return;
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Geocoding failed" });
    }
  });

  // Route optimization
  app.post("/api/optimize-route", async (req, res) => {
    try {
      const { addressIds, algorithm } = optimizeRouteSchema.parse(req.body);
      
      // Fetch addresses
      const addresses = [];
      for (const id of addressIds) {
        const address = await storage.getAddress(id);
        if (!address) {
          res.status(404).json({ message: `Address with id ${id} not found` });
          return;
        }
        addresses.push(address);
      }

      // Optimize route
      const result = await tspService.optimizeRoute(addresses, algorithm);
      
      // Save route
      const routeData = {
        name: null,
        algorithm,
        totalDistance: result.totalDistance,
        estimatedTime: result.estimatedTime,
        addressOrder: result.orderedAddresses.map(addr => addr.id.toString()),
      };
      
      const savedRoute = await storage.createRoute(routeData);
      
      res.json({
        route: savedRoute,
        optimizedRoute: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        console.error("Route optimization error:", error);
        res.status(500).json({ message: "Failed to optimize route" });
      }
    }
  });

  // Route routes
  app.get("/api/routes", async (req, res) => {
    try {
      const routes = await storage.getAllRoutes();
      res.json(routes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch routes" });
    }
  });

  app.delete("/api/routes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRoute(id);
      
      if (!deleted) {
        res.status(404).json({ message: "Route not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete route" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
