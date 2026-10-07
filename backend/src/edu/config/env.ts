import { z } from 'zod3';

/**
 * Учебный центр работает внутри бэкенда сайта: общий .env и общая база.
 * Свои таблицы — в схеме `edu` той же базы (EDU_DATABASE_URL можно задать явно).
 */
function eduDatabaseUrl() {
  if (process.env.EDU_DATABASE_URL) return process.env.EDU_DATABASE_URL;
  const base = process.env.DATABASE_URL ?? 'postgres://kse:kse@localhost:5433/kse';
  const url = new URL(base);
  url.searchParams.set('schema', 'edu');
  return url.toString();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  APP_URL: z.string().default('http://localhost:3000/education/app'),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().default('KSE Edu <noreply@kse.kg>'),
  MAGIC_LINK_TTL_MIN: z.coerce.number().int().positive().default(30),
  TELEGRAM_BOT_TOKEN: z.string().optional().default(''),
  TELEGRAM_BOT_USERNAME: z.string().optional().default(''),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional().default(''),
  TELEGRAM_2FA_ENABLED: z
    .string()
    .optional()
    .default('false')
    .transform((v) => v !== 'false' && v !== '0'),
  TELEGRAM_2FA_BYPASS: z
    .string()
    .optional()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),
});

const parsed = envSchema.safeParse({
  ...process.env,
  DATABASE_URL: eduDatabaseUrl(),
  JWT_SECRET: process.env.EDU_JWT_SECRET ?? `${process.env.SESSION_SECRET ?? 'kse-dev-session-secret'}:edu`,
  JWT_EXPIRES_IN: process.env.EDU_JWT_EXPIRES_IN,
  APP_URL: process.env.EDU_APP_URL,
});

if (!parsed.success) {
  console.error('Invalid education environment:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid education environment configuration');
}

export const env = parsed.data;
