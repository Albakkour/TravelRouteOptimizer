"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const routes_1 = require("./routes");
function createApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: false }));
    (0, routes_1.registerRoutes)(app);
    app.use((err, _req, res, _next) => {
        const status = typeof err === "object" && err !== null && "status" in err
            ? err.status
            : 500;
        const message = typeof err === "object" && err !== null && "message" in err
            ? err.message
            : "Internal Server Error";
        res.status(status).json({ message });
    });
    return app;
}
/**
 * Local development only
 */
if (require.main === module) {
    const app = createApp();
    const port = Number(process.env.PORT) || 3000;
    app.listen(port, "0.0.0.0", () => {
        console.log(`API server running on port ${port}`);
    });
}
//# sourceMappingURL=index.js.map