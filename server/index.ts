import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import cors from "cors";


export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "https://travelrouteoptimizer.web.app",
        "https://travelrouteoptimizer.firebaseapp.com",
      ],
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type"],
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  registerRoutes(app);

  app.use(
    (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? (err as any).status
          : 500;

      const message =
        typeof err === "object" && err !== null && "message" in err
          ? (err as any).message
          : "Internal Server Error";

      res.status(status).json({ message });
    }
  );

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