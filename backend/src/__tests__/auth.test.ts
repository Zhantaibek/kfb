import assert from "node:assert/strict";
import { test } from "node:test";
import type { Request } from "express";
import { config } from "../config";
import { encodeSession, readCookieSession, readSession } from "../modules/auth/auth.service";

const admin = { id: "u1", email: "admin@kse.kg", name: "Админ", role: "admin" as const };
const requestWith = (token: string) => ({ cookies: { [config.cookieName]: token } }) as unknown as Request;

test("подписанная сессия читается обратно", () => {
  const session = readSession(requestWith(encodeSession(admin)));
  assert.deepEqual(session, admin);
});

test("подделанная подпись отклоняется", () => {
  const [payload] = encodeSession(admin).split(".");
  assert.equal(readCookieSession(requestWith(`${payload}.forged`), config.cookieName), null);
});

test("изменённые данные с прежней подписью отклоняются", () => {
  const [, signature] = encodeSession({ ...admin, role: "editor" }).split(".");
  const forged = Buffer.from(JSON.stringify({ ...admin, exp: Date.now() + 60_000 })).toString("base64url");
  assert.equal(readCookieSession(requestWith(`${forged}.${signature}`), config.cookieName), null);
});

test("истёкшая сессия отклоняется", (t) => {
  const token = encodeSession(admin);
  t.mock.method(Date, "now", () => Date.parse("2999-01-01"));
  assert.equal(readCookieSession(requestWith(token), config.cookieName), null);
});

test("сессия не сотрудника не даёт доступа в админку", () => {
  const visitor = { ...admin, role: "investor" } as unknown as typeof admin;
  assert.equal(readSession(requestWith(encodeSession(visitor))), null);
});
