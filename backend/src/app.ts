import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { config } from "./config";
import { openApiSpec } from "./docs/openapi";
import { errorHandler } from "./middleware/error";
import { api } from "./routes";
import { eduApi } from "./edu";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    helmet({
      frameguard: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    }),
  );
  app.use((_req, res, next) => {
    const ancestors = ["'self'", ...config.corsOrigins].join(" ");
    res.setHeader("Content-Security-Policy", `frame-ancestors ${ancestors}`);
    next();
  });
  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));
  app.use("/uploads", express.static(config.uploadsDir));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 40,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method !== "POST",
    message: { error: "Слишком много попыток. Попробуйте позже." },
  });
  const publicLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Слишком много запросов. Попробуйте позже." },
  });

  app.use("/api/admin/session", authLimiter);
  app.use("/api/auth", authLimiter);
  app.use("/api/public/request", publicLimiter);
  app.use("/api/public/visit", publicLimiter);

  app.get("/openapi.json", (_req, res) => {
    res.json(openApiSpec);
  });
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec as object, {
      customSiteTitle: "KSE API — Swagger",
      swaggerOptions: {
        persistAuthorization: true,
        withCredentials: true,
        docExpansion: "list",
        displayRequestDuration: true,
      },
    }),
  );
  app.use("/api/edu/auth", authLimiter);
  app.use("/api/edu", eduApi);
  app.use("/api", api);
  app.use(errorHandler);

  return app;
}
