import type { Express, Request, Response } from "express";
import { geocodingService } from "./services/geocoding";

export function registerRoutes(app: Express) {
  // -------------------------------
  // HEALTH CHECK (already exists)
  // -------------------------------
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // -------------------------------
  // FORWARD GEOCODING
  // -------------------------------
  app.post("/api/geocode", async (req: Request, res: Response) => {
    const { address } = req.body;

    if (!address || typeof address !== "string") {
      return res.status(400).json({ message: "Invalid address" });
    }

    const result = await geocodingService.geocodeAddress(address);

    if (!result) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.json(result);
  });

  // -------------------------------
  // REVERSE GEOCODING  ✅ NEW
  // -------------------------------
  app.post("/api/reverse-geocode", async (req: Request, res: Response) => {
    const { latitude, longitude } = req.body;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    const address = await geocodingService.reverseGeocode(
      latitude,
      longitude
    );

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.json({ address });
  });
}
