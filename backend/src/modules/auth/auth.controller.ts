import type { Request, Response } from "express";
import { config } from "../../config";
import { isStaffRole } from "../../../../shared/cms";
import { authenticate, cookieOptions, encodeSession, requireAdmin, requireSessionForSetup, verifiedSession } from "./auth.service";
import { completeLogin, disableMfa, enableMfa, issueTicket, mfaStatus, resetMfa, startSetup } from "./mfa.service";

/** Для сайта: кто вошёл. Посетитель без входа — это норма, поэтому 200 и user: null, а не 401 в консоли. */
export async function getPublicSession(req: Request, res: Response) {
  res.json({ user: await verifiedSession(req) });
}

/** mfaSetupRequired: 2FA обязателен, а вход не подтверждён кодом — админка ведёт на страницу настройки. */
export async function getSession(req: Request, res: Response) {
  const session = await verifiedSession(req);
  if (!session) {
    res.status(401).json({ user: null });
    return;
  }
  res.json({ user: session, mfaSetupRequired: config.mfaRequired && !session.mfa });
}

export async function login(req: Request, res: Response) {
  const body = req.body as { email?: string; password?: string };
  const result = await authenticate(String(body.email ?? ""), String(body.password ?? ""));
  if (!result) {
    res.status(401).json({ error: "Неверный логин или пароль" });
    return;
  }
  const { session, totpEnabled } = result;
  if (!isStaffRole(session.role)) {
    res.status(401).json({ error: "Вход только для сотрудников биржи" });
    return;
  }
  // С включённым 2FA пароль даёт только билет на второй шаг — сессию выдаст /session/mfa после кода.
  if (totpEnabled) {
    res.json({ mfa: "code", ticket: issueTicket(session.id) });
    return;
  }
  res.cookie(config.cookieName, encodeSession(session), cookieOptions());
  res.json({ user: session, mfaSetupRequired: config.mfaRequired });
}

/** Второй шаг входа: билет из первого шага и 6 цифр из приложения. */
export async function loginMfa(req: Request, res: Response) {
  const body = req.body as { ticket: string; code: string };
  const session = await completeLogin(body.ticket, body.code);
  res.cookie(config.cookieName, encodeSession(session), cookieOptions());
  res.json({ user: session });
}

export async function getMfa(req: Request, res: Response) {
  res.json(await mfaStatus(await requireSessionForSetup(req)));
}

export async function setupMfa(req: Request, res: Response) {
  res.json(await startSetup(await requireSessionForSetup(req)));
}

export async function confirmMfa(req: Request, res: Response) {
  const session = await enableMfa(await requireSessionForSetup(req), (req.body as { code: string }).code);
  // Текущий вход подтверждён кодом — обновляем cookie, чтобы не входить заново.
  res.cookie(config.cookieName, encodeSession(session), cookieOptions());
  res.json({ user: session });
}

export async function turnOffMfa(req: Request, res: Response) {
  const session = await requireSessionForSetup(req);
  await disableMfa(session, (req.body as { code: string }).code);
  const { mfa: _mfa, ...plain } = session;
  res.cookie(config.cookieName, encodeSession(plain), cookieOptions());
  res.json({ ok: true });
}

export async function resetUserMfa(req: Request, res: Response) {
  await resetMfa(await requireAdmin(req), String(req.params.id));
  res.json({ ok: true });
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