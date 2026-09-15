import path from "node:path";
import { config as loadEnv } from "dotenv";

const candidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env"),
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env"),
];

for (const file of candidates) {
  loadEnv({ path: file });
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";
const sessionSecret = process.env.SESSION_SECRET ?? (isProduction ? "" : "kse-dev-session-secret");

if (isProduction && !sessionSecret) {
  throw new Error("SESSION_SECRET обязателен в production");
}

const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const rootDir = path.resolve(process.cwd());

export const config = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT ?? 4000),
  cookieName: "kse-admin",
  userCookieName: "kse-user",
  sessionSecret,
  cookieMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
  corsOrigins,
  databaseUrl: process.env.DATABASE_URL ?? "postgres://kse:kse@localhost:5433/kse",
  rootDir,
  get dataFile() {
    return path.join(this.rootDir, "data", "cms.json");
  },
  get uploadsDir() {
    return process.env.UPLOADS_DIR || path.join(this.rootDir, "uploads");
  },
};
