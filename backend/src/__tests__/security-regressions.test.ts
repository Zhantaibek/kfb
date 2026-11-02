import assert from "node:assert/strict";
import { test } from "node:test";
import type { Request } from "express";
import { config } from "../config";
import { encodeSession, verifiedSession } from "../modules/auth/auth.service";
import { looksLikeImage } from "../modules/media/media.service";
import { menuItemSchema, userItemSchema } from "../validation/cms";

const editor = { id: "u-editor", email: "editor@kse.kg", name: "Редактор", role: "editor" as const };
const requestWith = (token: string) => ({ cookies: { [config.cookieName]: token } }) as unknown as Request;
const lookup = (row: { email: string; role: string } | null) => async () => row;

test("сессия удалённого сотрудника не действует, даже с верной подписью", async () => {
  assert.equal(await verifiedSession(requestWith(encodeSession(editor)), lookup(null)), null);
});

test("сессия сотрудника с изменённой ролью не действует (повышение и понижение)", async () => {
  assert.equal(await verifiedSession(requestWith(encodeSession(editor)), lookup({ email: "editor@kse.kg", role: "admin" })), null);
});

test("сессия действующего сотрудника принимается", async () => {
  assert.deepEqual(await verifiedSession(requestWith(encodeSession(editor)), lookup({ email: "Editor@KSE.kg", role: "editor" })), editor);
});

test("картинка проверяется по содержимому, а не только по заявленному типу", () => {
  const png = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");
  const jpeg = Buffer.from("ffd8ffe000104a4649460001", "hex");
  assert.equal(looksLikeImage(png, "image/png"), true);
  assert.equal(looksLikeImage(jpeg, "image/jpeg"), true);
  assert.equal(looksLikeImage(Buffer.from("<html><script>x</script>"), "image/png"), false);
  assert.equal(looksLikeImage(png, "image/jpeg"), false);
  assert.equal(looksLikeImage(Buffer.from("RIFF0000WEBP"), "image/webp"), true);
});

test("ссылки из админки: только пути сайта, http(s), mailto и tel", () => {
  const item = { label: "STRIX-TEST", group: "main" };
  for (const href of ["/about", "/", "#top", "https://kse.kg/ru", "mailto:info@kse.kg", "tel:+996 312 31-14-84"]) {
    assert.equal(menuItemSchema.safeParse({ ...item, href }).success, true, href);
  }
  for (const href of ["javascript:alert(1)", " JavaScript:void(0)", "data:text/html,x", "//evil.example", "vbscript:x"]) {
    assert.equal(menuItemSchema.safeParse({ ...item, href }).success, false, href);
  }
});

test("пароль сотрудника — от 12 символов; пустой при правке означает «не менять»", () => {
  const user = { name: "STRIX-TEST", email: "strix-test@example.invalid", role: "editor" };
  assert.equal(userItemSchema.safeParse({ ...user, password: "short1" }).success, false);
  assert.equal(userItemSchema.safeParse({ ...user, password: "twelve-chars" }).success, true);
  assert.equal(userItemSchema.safeParse({ ...user, password: "" }).success, true);
  assert.equal(userItemSchema.safeParse(user).success, true);
});
