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

// Ключом подписывается cookie админа: известный или короткий ключ позволяет подделать вход без пароля.
const weakSecret = /^(change-me|kse-dev-session-secret)/i.test(sessionSecret) || sessionSecret.length < 32;
if (isProduction && weakSecret) {
  throw new Error("SESSION_SECRET в production должен быть случайной строкой не короче 32 символов (не заглушкой из примера)");
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
  /**
   * Двухфакторный вход обязателен: сотрудник без 2FA попадает только на страницу его настройки.
   * По умолчанию — в production; MFA_REQUIRED=on / off задаёт явно (в разработке демо-вход admin/admin без кода).
   */
  mfaRequired: process.env.MFA_REQUIRED ? process.env.MFA_REQUIRED === "on" : isProduction,
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
