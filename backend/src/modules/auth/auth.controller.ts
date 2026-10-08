import type { Request, Response } from "express";
import { config } from "../../config";
import { isPublicRole, isStaffRole } from "../../../../shared/cms";
import {
  authenticate,
  cookieOptions,
  encodeSession,
  readSession,
  readUserSession,
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
  const email = String(body.email ?? "");
  const password = String(body.password ?? "");
  const session = await authenticate(email, password);
  if (!session) {
    res.status(401).json({ error: "Неверный логин или пароль. Демо: investor@kse.kg / kse" });
    return;
  }

  // Админ или редактор, вошедший через основной вход: выдаём админскую cookie,
  // ту же, что и в /api/admin/session. Так он сразу получает доступ к админке.
  if (isStaffRole(session.role)) {
    res.cookie(config.cookieName, encodeSession(session), cookieOptions());
    res.json({ user: session });
    return;
  }

  if (!isPublicRole(session.role)) {
    res.status(401).json({ error: "Эта учётная запись не может войти на сайт" });
    return;
  }
  res.cookie(config.userCookieName, encodeSession(session), cookieOptions());
  res.json({ user: session });
}

export function logoutUser(_req: Request, res: Response) {
  res.clearCookie(config.userCookieName, { path: "/" });
  res.json({ ok: true });
}