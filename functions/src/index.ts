import { onRequest } from "firebase-functions/https";
import { setGlobalOptions } from "firebase-functions";

// Import COMPILED backend (JS, not TS)
const { createApp } = require("../../server/dist/index.js");

setGlobalOptions({ maxInstances: 10 });

export const api = onRequest(createApp());
