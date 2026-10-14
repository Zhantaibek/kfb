import express, { type Request } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { revokeStaleSessions } from "./modules/auth/auth.service";
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
  app.use(
    "/uploads",
    express.static(config.uploadsDir, {
      setHeaders(res) {
        // Браузер не угадывает тип файла сам: загрузка отдаётся строго как картинка или документ.
        res.setHeader("X-Content-Type-Options", "nosniff");
      },
    }),
  );

  // Запросы приходят через прокси Next, поэтому req.ip — адрес сервера Next, общий для всех.
  // Реальный адрес посетителя прокси передаёт в x-visitor-ip (сам бэкенд наружу не публикуется).
  const visitorKey = (req: Request) => ipKeyGenerator(req.get("x-visitor-ip") || req.ip || "unknown");
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 40,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method !== "POST",
    keyGenerator: visitorKey,
    message: { error: "Слишком много попыток. Попробуйте позже." },
  });
  // Подбор пароля к одному аккаунту с разных адресов: не больше 30 попыток в час на e-mail.
  const accountLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 30,
    standardHeaders: false,
    legacyHeaders: false,
    skip: (req) => req.method !== "POST" || typeof req.body?.email !== "string",
    keyGenerator: (req) => `email:${String(req.body.email).trim().toLowerCase()}`,
    skipSuccessfulRequests: true,
    message: { error: "Слишком много неудачных попыток входа в этот аккаунт. Попробуйте через час." },
  });
  const publicLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: visitorKey,
    message: { error: "Слишком много запросов. Попробуйте позже." },
  });

  app.use(revokeStaleSessions);
  app.use("/api/admin/session", authLimiter, accountLimiter);
  app.use("/api/auth", authLimiter, accountLimiter);
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
  app.use("/api", api);
  app.use(errorHandler);

  return app;
}
