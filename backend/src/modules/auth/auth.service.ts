import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { config } from "../../config";
import {
  findUserByEmail,
  insertAudit,
  insertUser,
  updateUserPassword,
} from "../../db/repositories/cms.repository";
import { prisma } from "../../db/prisma";
import { hashPassword, isHashed, verifyPassword } from "./password";
import type { AdminSession, AuthSession, PublicRole, UserRole } from "../../../../shared/cms";
import { isPublicRole, isStaffRole } from "../../../../shared/cms";

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
    return { id: session.id, email: session.email, name: session.name, role: session.role };
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
  if (!isHashed(user.password)) {
    await updateUserPassword(user.id, await hashPassword(password));
  }
  return toSession(user);
}

export async function registerPublicUser(input: {
  name: string;
  email: string;
  password: string;
  role: PublicRole;
}): Promise<AuthSession> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const role = input.role;

  const existing = await findUserByEmail(email);
  if (existing) throw new Error("Этот e-mail уже зарегистрирован");

  const hashed = await hashPassword(password);
  const user = { id: crypto.randomUUID(), name, email, role, password: hashed };
  await insertUser(user);
  await insertAudit({ action: "create", entity: "users", detail: email, actor: "public" });
  return toSession(user);
}

export async function ensureAuthAccounts() {
  const rows = await prisma.user.findMany({ select: { id: true, email: true, password: true } });
  for (const row of rows) {
    if (!isHashed(row.password)) {
      await updateUserPassword(row.id, await hashPassword(row.password));
    }
  }
  const emails = new Set(rows.map((row: { email: string }) => row.email.toLowerCase()));
  const extras = [
    { id: "user-investor", name: "Инвестор", email: "investor@kse.kg", role: "investor" as const, password: "kse" },
    { id: "user-issuer", name: "Эмитент", email: "issuer@kse.kg", role: "issuer" as const, password: "kse" },
  ];
  for (const user of extras) {
    if (emails.has(user.email)) continue;
    await insertUser({ ...user, password: await hashPassword(user.password) });
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
