import type { Request, Response } from "express";
import { config } from "../../config";
import { isStaffRole } from "../../../../shared/cms";
import { authenticate, cookieOptions, encodeSession, readSession } from "./auth.service";

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
    res.status(401).json({ error: "Неверный логин или пароль" });
    return;
  }
  if (!isStaffRole(session.role)) {
    res.status(401).json({ error: "Вход только для сотрудников биржи" });
    return;
  }
  res.cookie(config.cookieName, encodeSession(session), cookieOptions());
  res.json({ user: session });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(config.cookieName, { path: "/" });
  res.json({ ok: true });
}

// Кнопка «Войти» на сайте — вход только для сотрудников (админ, редактор): выдаём админскую cookie,
// ту же, что и в /api/admin/session. Кабинетов инвестора и эмитента нет.
export const loginUser = login;

export function logoutUser(_req: Request, res: Response) {
  res.clearCookie(config.cookieName, { path: "/" });
  // Cookie прежнего кабинета инвестора — стираем, если осталась в браузере.
  res.clearCookie(config.userCookieName, { path: "/" });
  res.json({ ok: true });
}