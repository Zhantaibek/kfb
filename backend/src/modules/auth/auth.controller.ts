import type { Request, Response } from "express";
import { config } from "../../config";
import { isPublicRole, isStaffRole } from "../../../../shared/cms";
import {
  authenticate,
  cookieOptions,
  encodeSession,
  readSession,
  readUserSession,
  registerPublicUser,
} from "./auth.service";

export function getSession(req: Request, res: Response) {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ user: null });
    return;
  }
  res.json({ user: session });
}

export async function login(req: Request, res: Response) {
  const body = req.body as { email?: string; password?: string };
  const session = await authenticate(String(body.email ?? ""), String(body.password ?? ""));
  if (!session) {
    res.status(401).json({ error: "Неверный логин или пароль. Демо: admin@kse.kg / admin" });
    return;
  }
  if (!isStaffRole(session.role)) {
    res.status(401).json({ error: "Этот аккаунт для кабинета на сайте. Откройте /login" });
    return;
  }
  res.cookie(config.cookieName, encodeSession(session), cookieOptions());
  res.json({ user: session });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(config.cookieName, { path: "/" });
  res.json({ ok: true });
}

export function getUserSession(req: Request, res: Response) {
  res.json({ user: readUserSession(req) });
}

export async function loginUser(req: Request, res: Response) {
  const body = req.body as { email?: string; password?: string };
  const session = await authenticate(String(body.email ?? ""), String(body.password ?? ""));
  if (!session) {
    res.status(401).json({ error: "Неверный логин или пароль. Демо: investor@kse.kg / kse" });
    return;
  }
  if (!isPublicRole(session.role)) {
    res.status(401).json({ error: "Для портала администратора откройте /admin" });
    return;
  }
  res.cookie(config.userCookieName, encodeSession(session), cookieOptions());
  res.json({ user: session });
}

export async function registerUser(req: Request, res: Response) {
  const session = await registerPublicUser(req.body ?? {});
  res.cookie(config.userCookieName, encodeSession(session), cookieOptions());
  res.status(201).json({ user: session });
}

export function logoutUser(_req: Request, res: Response) {
  res.clearCookie(config.userCookieName, { path: "/" });
  res.json({ ok: true });
}
