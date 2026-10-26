import { createHmac, timingSafeEqual } from "node:crypto";
import QRCode from "qrcode";
import { config } from "../../config";
import { prisma } from "../../db/prisma";
import { insertAudit } from "../../db/repositories/cms.repository";
import { AppError } from "../../middleware/error";
import type { AdminSession, AuthSession, UserRole } from "../../../../shared/cms";
import { decryptSecret, encryptSecret, generateSecret, otpauthUri, verifyCode } from "./totp";

/**
 * Двухфакторный вход сотрудников. После верного пароля сотрудник с 2FA получает не сессию, а «билет» на 5 минут;
 * сессия (cookie с mfa: true) выдаётся только по билету и коду из приложения.
 */

const TICKET_TTL_MS = 5 * 60 * 1000;
const MAX_FAILURES = 5;
const FAILURE_WINDOW_MS = 10 * 60 * 1000;

// Свой ключ подписи: билет нельзя выдать за cookie сессии и наоборот.
function ticketSignature(payload: string) {
  return createHmac("sha256", `mfa-ticket:${config.sessionSecret}`).update(payload).digest("base64url");
}

export function issueTicket(userId: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ id: userId, exp: now + TICKET_TTL_MS }), "utf8").toString("base64url");
  return `${payload}.${ticketSignature(payload)}`;
}

export function readTicket(ticket: string, now = Date.now()): string | null {
  const split = ticket.lastIndexOf(".");
  if (split <= 0) return null;
  const payload = ticket.slice(0, split);
  const given = Buffer.from(ticket.slice(split + 1));
  const expected = Buffer.from(ticketSignature(payload));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { id?: string; exp?: number };
    return data.id && data.exp && data.exp > now ? data.id : null;
  } catch {
    return null;
  }
}

/** Неверные коды по сотруднику: после 5 ошибок за 10 минут вход кодом блокируется до конца окна. */
const failures = new Map<string, { count: number; until: number }>();

function assertNotLocked(userId: string) {
  const entry = failures.get(userId);
  if (entry && entry.until > Date.now() && entry.count >= MAX_FAILURES) {
    throw new AppError("Слишком много неверных кодов. Попробуйте через 10 минут.", 429);
  }
}

function recordFailure(userId: string) {
  const now = Date.now();
  const entry = failures.get(userId);
  if (!entry || entry.until <= now) failures.set(userId, { count: 1, until: now + FAILURE_WINDOW_MS });
  else entry.count += 1;
}

/** Проверяет код по сохранённому секрету и запоминает шаг, чтобы этот код нельзя было ввести ещё раз. */
async function acceptCode(userId: string, code: string, requireEnabled: boolean) {
  assertNotLocked(userId);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.totpSecret || (requireEnabled && !user.totpEnabled)) {
    throw new AppError("Двухфакторный вход не настроен", 400);
  }
  const step = verifyCode(decryptSecret(user.totpSecret), code, user.totpLastStep);
  if (step === null) {
    recordFailure(userId);
    throw new AppError("Неверный код. Введите 6 цифр из приложения-аутентификатора.", 400);
  }
  failures.delete(userId);
  await prisma.user.update({ where: { id: userId }, data: { totpLastStep: step } });
  return user;
}

/** Второй шаг входа: билет + код → сессия с mfa: true. */
export async function completeLogin(ticket: string, code: string): Promise<AuthSession> {
  const userId = readTicket(ticket);
  if (!userId) throw new AppError("Время на ввод кода истекло. Войдите заново.", 401);
  const user = await acceptCode(userId, code, true);
  return { id: user.id, email: user.email, name: user.name, role: user.role as UserRole, mfa: true };
}

export async function mfaStatus(session: AdminSession) {
  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { totpEnabled: true } });
  return { enabled: Boolean(user?.totpEnabled), required: config.mfaRequired };
}

/** Новый секрет для подключения приложения. Пока код не подтверждён, 2FA не включён. */
export async function startSetup(session: AdminSession) {
  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { totpEnabled: true } });
  if (user?.totpEnabled) throw new AppError("Двухфакторный вход уже включён", 400);
  const secret = generateSecret();
  await prisma.user.update({
    where: { id: session.id },
    data: { totpSecret: encryptSecret(secret), totpEnabled: false, totpLastStep: null },
  });
  const uri = otpauthUri(secret, session.email);
  const qrSvg = await QRCode.toString(uri, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  return { secret, uri, qrSvg };
}

/** Подтверждение первым кодом: 2FA включается, текущая сессия становится подтверждённой. */
export async function enableMfa(session: AdminSession, code: string): Promise<AdminSession> {
  await acceptCode(session.id, code, false);
  await prisma.user.update({ where: { id: session.id }, data: { totpEnabled: true } });
  await insertAudit({ action: "update", entity: "users", detail: `2FA включён: ${session.email}`, actor: session.email });
  return { ...session, mfa: true };
}

/** Отключить можно, только если 2FA не обязателен, и только с действующим кодом. */
export async function disableMfa(session: AdminSession, code: string) {
  if (config.mfaRequired) throw new AppError("Двухфакторный вход обязателен для сотрудников биржи", 400);
  await acceptCode(session.id, code, true);
  await prisma.user.update({ where: { id: session.id }, data: { totpSecret: null, totpEnabled: false, totpLastStep: null } });
  await insertAudit({ action: "update", entity: "users", detail: `2FA отключён: ${session.email}`, actor: session.email });
}

/** Администратор сбрасывает 2FA сотруднику (потерян телефон): при следующем входе тот настроит его заново. */
export async function resetMfa(admin: AdminSession, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) throw new Error("not-found");
  await prisma.user.update({ where: { id: userId }, data: { totpSecret: null, totpEnabled: false, totpLastStep: null } });
  failures.delete(userId);
  await insertAudit({ action: "update", entity: "users", detail: `2FA сброшен: ${user.email}`, actor: admin.email });
}
