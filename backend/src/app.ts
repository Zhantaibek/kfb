import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { config } from "./config";
import { openApiSpec } from "./docs/openapi";
import { errorHandler } from "./middleware/error";
import { api } from "./routes";

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

  // Лимиты считаем по IP посетителя: сайт (Next-прокси) передаёт его в x-visitor-ip. Без этого все посетители
  // выглядели бы одним IP сервера Next. API снаружи не опубликован (docker-compose), поэтому заголовку можно верить.
  const visitorKey = (req: express.Request) => {
    const ip = String(req.headers["x-visitor-ip"] ?? "").trim() || req.ip || "unknown";
    return ipKeyGenerator(ip);
  };
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 40,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method !== "POST",
    keyGenerator: visitorKey,
    message: { error: "Слишком много попыток. Попробуйте позже." },
  });
  // Подбор пароля к одной учётке с разных IP: не больше 20 попыток на e-mail за 15 минут.
  const emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method !== "POST" || typeof req.body?.email !== "string",
    keyGenerator: (req) => `email:${String(req.body.email).trim().toLowerCase()}`,
    message: { error: "Слишком много попыток входа для этой учётной записи. Попробуйте позже." },
  });
  const publicLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: visitorKey,
    message: { error: "Слишком много запросов. Попробуйте позже." },
  });

  app.use("/api/admin/session", authLimiter, emailLimiter);
  app.use("/api/auth", authLimiter, emailLimiter);
  app.use("/api/public/request", publicLimiter);
  app.use("/api/public/visit", publicLimiter);

  // Документация API (все маршруты админки) — только при разработке; в production включается явно: API_DOCS=on.
  if (!config.isProduction || process.env.API_DOCS === "on") {
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
  }
  app.use("/api", api);
  app.use(errorHandler);

  return app;
}
