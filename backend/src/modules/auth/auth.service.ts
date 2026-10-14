import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { config } from "../../config";
import {
  findUserByEmail,
  updateUserPassword,
} from "../../db/repositories/cms.repository";
import { prisma } from "../../db/prisma";
import { hashPassword, isHashed, verifyPassword } from "./password";
import type { AdminSession, AuthSession, UserRole } from "../../../../shared/cms";
import { isPublicRole, isStaffRole } from "../../../../shared/cms";

function signToken(payload: string) {
  const signature = createHmac("sha256", config.sessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readTokenPayload(token: string): (AuthSession & { pv?: string }) | null {
  const split = token.lastIndexOf(".");
  if (split <= 0) return null;
  const payload = token.slice(0, split);
  const signature = token.slice(split + 1);
  const expected = createHmac("sha256", config.sessionSecret).update(payload).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AuthSession & { exp?: number; pv?: string };
    if (!session.email || !session.role || (session.exp && session.exp < Date.now())) return null;
    return session;
  } catch {
    return null;
  }
}

function readToken(token: string): AuthSession | null {
  const session = readTokenPayload(token);
  return session ? { id: session.id, email: session.email, name: session.name, role: session.role } : null;
}

/**
 * Отпечаток пароля в cookie: сменили пароль — старые сессии перестают действовать.
 * Хранится только внутри подписанного токена, клиенту в JSON не отдаётся.
 */
function passwordVersion(passwordHash: string) {
  return createHmac("sha256", config.sessionSecret).update(passwordHash).digest("base64url").slice(0, 16);
}

const sessionVersions = new WeakMap<AuthSession, string>();

export function encodeSession(session: AuthSession) {
  const pv = sessionVersions.get(session);
  const payload = Buffer.from(JSON.stringify({ ...session, pv, exp: Date.now() + config.cookieMaxAgeMs }), "utf8").toString(
    "base64url",
  );
  return signToken(payload);
}

/**
 * Сверка cookie с базой на каждый запрос: удалённый пользователь, понижение роли или смена пароля
 * сразу закрывают доступ, а не через 7 дней, когда истечёт cookie.
 */
export async function revokeStaleSessions(req: Request, res: Response, next: NextFunction) {
  try {
    for (const name of [config.cookieName, config.userCookieName]) {
      const token = req.cookies?.[name] as string | undefined;
      if (!token) continue;
      const session = readTokenPayload(token);
      const user = session?.id
        ? await prisma.user.findUnique({ where: { id: session.id }, select: { role: true, password: true } })
        : null;
      if (!session || !user || user.role !== session.role || passwordVersion(user.password) !== session.pv) {
        delete req.cookies[name];
        res.clearCookie(name, { path: "/" });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
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

export function readUserSession(req: Request): AuthSession | null {
  const session = readCookieSession(req, config.userCookieName);
  if (!session || !isPublicRole(session.role)) return null;
  return session;
}

function toSession(user: { id: string; email: string; name: string; role: UserRole }): AuthSession {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function authenticate(email: string, password: string): Promise<AuthSession | null> {
  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password))) return null;
  let passwordHash = user.password;
  if (!isHashed(user.password)) {
    passwordHash = await hashPassword(password);
    await updateUserPassword(user.id, passwordHash);
  }
  const session = toSession(user);
  sessionVersions.set(session, passwordVersion(passwordHash));
  return session;
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

export function requireSession(req: Request): AdminSession {
  const session = readSession(req);
  if (!session) fail("Unauthorized", "unauthorized");
  return session;
}

export function requireAdmin(req: Request): AdminSession {
  const session = requireSession(req);
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
