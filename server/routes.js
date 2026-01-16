"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const http_1 = require("http");
const storage_1 = require("./storage");
const geocoding_1 = require("./services/geocoding");
const tsp_1 = require("./services/tsp");
const schema_1 = require("@shared/schema");
const zod_1 = require("zod");
const optimizeRouteSchema = zod_1.z.object({
    addressIds: zod_1.z.array(zod_1.z.number()).min(2).max(20),
    algorithm: zod_1.z.enum(['nearest-neighbor', '2-opt']).default('2-opt'),
});
async function registerRoutes(app) {
    // Address routes
    app.get("/api/addresses", async (req, res) => {
        try {
            const addresses = await storage_1.storage.getAllAddresses();
            res.json(addresses);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch addresses" });
        }
    });
    app.post("/api/addresses", async (req, res) => {
        try {
            const addressData = schema_1.insertAddressSchema.parse(req.body);
            const address = await storage_1.storage.createAddress(addressData);
            res.status(201).json(address);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({ message: "Invalid address data", errors: error.errors });
            }
            else {
                res.status(500).json({ message: "Failed to create address" });
            }
        }
    });
    app.put("/api/addresses/:id", async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const updateData = schema_1.insertAddressSchema.partial().parse(req.body);
            const address = await storage_1.storage.updateAddress(id, updateData);
            if (!address) {
                res.status(404).json({ message: "Address not found" });
                return;
            }
            res.json(address);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({ message: "Invalid address data", errors: error.errors });
            }
            else {
                res.status(500).json({ message: "Failed to update address" });
            }
        }
    });
    app.delete("/api/addresses/:id", async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const deleted = await storage_1.storage.deleteAddress(id);
            if (!deleted) {
                res.status(404).json({ message: "Address not found" });
                return;
            }
            res.status(204).send();
        }
        catch (error) {
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
            const result = await geocoding_1.geocodingService.geocodeAddress(address);
            if (!result) {
                res.status(404).json({ message: "Address not found" });
                return;
            }
            res.json(result);
        }
        catch (error) {
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
                const address = await storage_1.storage.getAddress(id);
                if (!address) {
                    res.status(404).json({ message: `Address with id ${id} not found` });
                    return;
                }
                addresses.push(address);
            }
            // Optimize route
            const result = await tsp_1.tspService.optimizeRoute(addresses, algorithm);
            // Save route
            const routeData = {
                name: null,
                algorithm,
                totalDistance: result.totalDistance,
                estimatedTime: result.estimatedTime,
                addressOrder: result.orderedAddresses.map((addr) => addr.id.toString()),
            };
            const savedRoute = await storage_1.storage.createRoute(routeData);
            res.json({
                route: savedRoute,
                optimizedRoute: result,
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({ message: "Invalid request data", errors: error.errors });
            }
            else {
                console.error("Route optimization error:", error);
                res.status(500).json({ message: "Failed to optimize route" });
            }
        }
    });
    // Route routes
    app.get("/api/routes", async (req, res) => {
        try {
            const routes = await storage_1.storage.getAllRoutes();
            res.json(routes);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch routes" });
        }
    });
    app.delete("/api/routes/:id", async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const deleted = await storage_1.storage.deleteRoute(id);
            if (!deleted) {
                res.status(404).json({ message: "Route not found" });
                return;
            }
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ message: "Failed to delete route" });
        }
    });
    const httpServer = (0, http_1.createServer)(app);
    return httpServer;
}
//# sourceMappingURL=routes.js.map