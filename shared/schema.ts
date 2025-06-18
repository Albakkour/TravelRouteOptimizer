import { pgTable, text, serial, real, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  name: text("name"),
  algorithm: text("algorithm").notNull(),
  totalDistance: real("total_distance").notNull(),
  estimatedTime: integer("estimated_time").notNull(), // in minutes
  addressOrder: text("address_order").array().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAddressSchema = createInsertSchema(addresses).omit({
  id: true,
  createdAt: true,
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
  createdAt: true,
});

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Route = typeof routes.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;

// Additional types for the application
export interface OptimizedRoute {
  orderedAddresses: Address[];
  totalDistance: number;
  estimatedTime: number;
  algorithm: string;
  efficiency?: number;
  savedDistance?: number;
}

export interface GeocodingResult {
  address: string;
  latitude: number;
  longitude: number;
  displayName: string;
}
