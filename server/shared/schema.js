"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertRouteSchema = exports.insertAddressSchema = exports.routes = exports.addresses = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
exports.addresses = (0, pg_core_1.pgTable)("addresses", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    address: (0, pg_core_1.text)("address").notNull(),
    latitude: (0, pg_core_1.real)("latitude").notNull(),
    longitude: (0, pg_core_1.real)("longitude").notNull(),
    verified: (0, pg_core_1.boolean)("verified").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.routes = (0, pg_core_1.pgTable)("routes", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name"),
    algorithm: (0, pg_core_1.text)("algorithm").notNull(),
    totalDistance: (0, pg_core_1.real)("total_distance").notNull(),
    estimatedTime: (0, pg_core_1.integer)("estimated_time").notNull(), // in minutes
    addressOrder: (0, pg_core_1.text)("address_order").array().notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.insertAddressSchema = (0, drizzle_zod_1.createInsertSchema)(exports.addresses).omit({
    id: true,
    createdAt: true,
});
exports.insertRouteSchema = (0, drizzle_zod_1.createInsertSchema)(exports.routes).omit({
    id: true,
    createdAt: true,
});
//# sourceMappingURL=schema.js.map