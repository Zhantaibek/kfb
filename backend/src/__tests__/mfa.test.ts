import assert from "node:assert/strict";
import { test } from "node:test";
import type { Request } from "express";
import { config } from "../config";
import { readSession } from "../modules/auth/auth.service";
import { issueTicket, readTicket } from "../modules/auth/mfa.service";
import { base32Encode, codeAt, decryptSecret, encryptSecret, otpauthUri, verifyCode } from "../modules/auth/totp";

// Секрет из приложения B к RFC 6238 (SHA-1): ASCII «12345678901234567890».
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890"));

test("коды совпадают с эталонными значениями RFC 6238", () => {
  // Время T в секундах → шаг T / 30; в RFC — 8 цифр, приложения показывают последние 6.
  assert.equal(codeAt(RFC_SECRET, Math.floor(59 / 30)), "287082");
  assert.equal(codeAt(RFC_SECRET, Math.floor(1111111109 / 30)), "081804");
  assert.equal(codeAt(RFC_SECRET, Math.floor(1234567890 / 30)), "005924");
  assert.equal(codeAt(RFC_SECRET, Math.floor(2000000000 / 30)), "279037");
});

test("код принимается в пределах ±30 секунд и не принимается повторно", () => {
  const now = 1111111109 * 1000;
  const step = Math.floor(1111111109 / 30);
  assert.equal(verifyCode(RFC_SECRET, "081804", null, now), step);
  assert.equal(verifyCode(RFC_SECRET, "081 804", null, now), step);
  assert.equal(verifyCode(RFC_SECRET, "081804", step, now), null, "тот же код второй раз");
  assert.equal(verifyCode(RFC_SECRET, codeAt(RFC_SECRET, step - 1), null, now), step - 1);
  assert.equal(verifyCode(RFC_SECRET, codeAt(RFC_SECRET, step - 3), null, now), null, "код полутораминутной давности");
  assert.equal(verifyCode(RFC_SECRET, "12345", null, now), null);
});

test("секрет в базе зашифрован и расшифровывается только целым", () => {
  const stored = encryptSecret(RFC_SECRET);
  assert.ok(!stored.includes(RFC_SECRET));
  assert.equal(decryptSecret(stored), RFC_SECRET);
  const [v, iv, tag, data] = stored.split(".");
  const tampered = [v, iv, tag, data.slice(0, -2) + (data.endsWith("A") ? "BB" : "AA")].join(".");
  assert.throws(() => decryptSecret(tampered));
});

test("ссылка для приложения содержит секрет и название биржи", () => {
  const uri = otpauthUri("ABC", "admin@kse.kg");
  assert.match(uri, /^otpauth:\/\/totp\/KSE%3Aadmin%40kse\.kg\?secret=ABC&issuer=KSE/);
});

test("билет второго шага: истекает через 5 минут, подделка и подмена не проходят", () => {
  const now = Date.now();
  const ticket = issueTicket("user-1", now);
  assert.equal(readTicket(ticket, now + 60_000), "user-1");
  assert.equal(readTicket(ticket, now + 6 * 60_000), null);
  const [payload] = ticket.split(".");
  const forged = `${Buffer.from(JSON.stringify({ id: "user-admin", exp: now + 60_000 })).toString("base64url")}.${ticket.split(".")[1]}`;
  assert.equal(readTicket(forged, now), null);
  assert.equal(readTicket(`${payload}.x`, now), null);
  // Билет — не cookie сессии: подставленный в cookie, он не даёт входа.
  const asCookie = { cookies: { [config.cookieName]: ticket } } as unknown as Request;
  assert.equal(readSession(asCookie), null);
});
