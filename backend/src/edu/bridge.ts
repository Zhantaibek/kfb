import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { Router, type Request, type Response } from "express";
import type { AuthSession } from "../../../shared/cms";
import { readSession, readUserSession } from "../modules/auth/auth.service";
import { prisma } from "./config/prisma.js";
import type { Role } from "./prisma-client/index.js";
import { signToken } from "./utils/jwt.js";

/**
 * Мост между входом сайта и учебным центром.
 * Сайт хранит сессию в своей cookie; учебный центр работает с JWT. Здесь одно превращается в другое,
 * чтобы человек входил один раз — через /login сайта.
 */

const eduRoleBySite: Record<string, Role> = { admin: "ADMIN", editor: "ADMIN", teacher: "TEACHER" };

function splitName(name: string, email: string) {
  const [first, ...rest] = name.trim().split(/\s+/).filter(Boolean);
  return { firstName: first || email.split("@")[0], lastName: rest.join(" ") || "—" };
}

/** Вход на сайте аккаунтом учебного центра (преподаватель, студент, админ учебного центра). */
export async function authenticateEduAccount(email: string, password: string): Promise<AuthSession | null> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, include: { profile: true } });
  if (!user || user.status === "BLOCKED") return null;
  if (!(await bcrypt.compare(password, user.passwordHash))) return null;
  const name = [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ") || user.email;
  return { id: `edu:${user.id}`, email: user.email, name, role: user.role === "STUDENT" ? "student" : "teacher" };
}

/** Аккаунт учебного центра для вошедшего на сайт человека: находим по email или заводим. */
async function eduUserFor(session: AuthSession) {
  const email = session.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  if (existing) return existing;
  // Пароль учебного центра не нужен — вход идёт через сайт. Ставим случайный, чтобы его нельзя было угадать.
  const passwordHash = await bcrypt.hash(randomBytes(24).toString("hex"), 10);
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      role: eduRoleBySite[session.role] ?? "STUDENT",
      profile: { create: splitName(session.name, email) },
    },
    include: { profile: true },
  });
}

async function issueSession(req: Request, res: Response) {
  const session = readSession(req) ?? readUserSession(req);
  if (!session) {
    res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Войдите на сайте" } });
    return;
  }
  const user = await eduUserFor(session);
  if (user.status === "BLOCKED") {
    res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Аккаунт учебного центра заблокирован" } });
    return;
  }
  const { passwordHash: _hidden, ...safe } = user;
  res.json({ success: true, data: { token: signToken({ id: user.id, email: user.email, role: user.role }), user: safe } });
}

export const eduBridge = Router();
eduBridge.get("/session", (req, res, next) => {
  issueSession(req, res).catch(next);
});
