import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { config } from "../../config";
import { findUserByEmail, updateUserPassword } from "../../db/repositories/cms.repository";
import { prisma } from "../../db/prisma";
import { hashPassword, isHashed, verifyPassword } from "./password";
import type { AdminSession, AuthSession, UserRole } from "../../../../shared/cms";
import { isStaffRole } from "../../../../shared/cms";

function signToken(payload: string) {
  const signature = createHmac("sha256", config.sessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readToken(token: string): AuthSession | null {
  const split = token.lastIndexOf(".");
  if (split <= 0) return null;
  const payload = token.slice(0, split);
  const signature = token.slice(split + 1);
  const expected = createHmac("sha256", config.sessionSecret).update(payload).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AuthSession & { exp?: number };
    if (!session.email || !session.role || (session.exp && session.exp < Date.now())) return null;
    // mfa — только true: у обычной cookie поля нет, сессии без 2FA выглядят как прежде.
    return { id: session.id, email: session.email, name: session.name, role: session.role, ...(session.mfa === true ? { mfa: true } : {}) };
  } catch {
    return null;
  }
}

export function encodeSession(session: AuthSession) {
  const payload = Buffer.from(JSON.stringify({ ...session, exp: Date.now() + config.cookieMaxAgeMs }), "utf8").toString(
    "base64url",
  );
  return signToken(payload);
}

export function readCookieSession(req: Request, cookieName: string): AuthSession | null {
  const token = req.cookies?.[cookieName] as string | undefined;
  if (!token) return null;
  return readToken(token);
}

export function readSession(req: Request): AdminSession | null {
  const session = readCookieSession(req, config.cookieName);
  if (!session || !isStaffRole(session.role)) return null;
  return session as AdminSession;
}

function toSession(user: { id: string; email: string; name: string; role: UserRole }): AuthSession {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/** Проверка пароля. totpEnabled — нужен ли второй шаг (код из приложения) до выдачи сессии. */
export async function authenticate(email: string, password: string): Promise<{ session: AuthSession; totpEnabled: boolean } | null> {
  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password))) return null;
  if (!isHashed(user.password)) {
    await updateUserPassword(user.id, await hashPassword(password));
  }
  return { session: toSession(user), totpEnabled: Boolean(user.totpEnabled) };
}

export async function ensureAuthAccounts() {
  const rows = await prisma.user.findMany({ select: { id: true, email: true, password: true } });
  for (const row of rows) {
    if (!isHashed(row.password)) {
      await updateUserPassword(row.id, await hashPassword(row.password));
    }
  }
}

function fail(name: "Unauthorized" | "Forbidden", message: string): never {
  const error = new Error(message);
  error.name = name;
  throw error;
}

/**
 * Сессия, подтверждённая базой: пользователь ещё существует, e-mail и роль совпадают с подписанной cookie.
 * Без этого удалённый или пониженный сотрудник сохранял бы права до истечения cookie (7 дней).
 */
type StaffLookup = (id: string) => Promise<{ email: string; role: string; totpEnabled?: boolean } | null>;
const findStaff: StaffLookup = (id) =>
  prisma.user.findUnique({ where: { id }, select: { email: true, role: true, totpEnabled: true } });

export async function verifiedSession(req: Request, lookup: StaffLookup = findStaff): Promise<AdminSession | null> {
  const session = readSession(req);
  if (!session) return null;
  const user = await lookup(session.id);
  if (!user || user.role !== session.role || user.email.toLowerCase() !== session.email.toLowerCase()) return null;
  // У сотрудника включён 2FA, а cookie получена без кода (выдана до включения) — нужен новый вход.
  if (user.totpEnabled && !session.mfa) return null;
  return session;
}

/** Сессия без требования 2FA — только для страницы его настройки (/api/admin/mfa). */
export async function requireSessionForSetup(req: Request): Promise<AdminSession> {
  const session = await verifiedSession(req);
  if (!session) fail("Unauthorized", "unauthorized");
  return session;
}

/** Сессия для админки. При обязательном 2FA сотрудник без него получает 403 mfa_setup_required. */
export async function requireSession(req: Request): Promise<AdminSession> {
  const session = await requireSessionForSetup(req);
  if (config.mfaRequired && !session.mfa) fail("Forbidden", "mfa_setup_required");
  return session;
}

export async function requireAdmin(req: Request): Promise<AdminSession> {
  const session = await requireSession(req);
  if (session.role !== "admin") fail("Forbidden", "Только администратор может управлять пользователями");
  return session;
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: config.isProduction,
    path: "/",
    maxAge: config.cookieMaxAgeMs,
  };
}

export type { AdminSession };
