// Сквозные тесты API на запущенном сервере (npm run dev). Если сервер не отвечает — тесты пропускаются.
// Адрес и вход: TEST_API_URL (по умолчанию http://localhost:4000), TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD (по умолчанию демо-админ разработки).
import { before, test } from "node:test";
import assert from "node:assert/strict";

const API = process.env.TEST_API_URL ?? "http://localhost:4000";
const ADMIN = { email: process.env.TEST_ADMIN_EMAIL ?? "admin@kse.kg", password: process.env.TEST_ADMIN_PASSWORD ?? "admin" };
let online = false;

before(async () => {
  online = await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(3000) })
    .then((r) => r.ok)
    .catch(() => false);
});

/** Запрос с cookie-сессией; cookie хранится в объекте jar. */
async function call(jar: { cookie?: string }, path: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(jar.cookie ? { cookie: jar.cookie } : {}), ...(init.headers ?? {}) },
  });
  const set = response.headers.getSetCookie?.() ?? [];
  if (set.length) jar.cookie = set.map((c) => c.split(";")[0]).join("; ");
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body: body as Record<string, any> };
}

async function login(email: string, password: string) {
  const jar: { cookie?: string } = {};
  const res = await call(jar, "/api/admin/session", { method: "POST", body: JSON.stringify({ email, password }) });
  return { jar, res };
}

test("вход: неверный пароль — 401 без подсказок, верный — сессия", async (t) => {
  if (!online) return t.skip("API не запущен");
  const bad = await login(ADMIN.email, "wrong-password");
  assert.equal(bad.res.status, 401);
  assert.ok(!JSON.stringify(bad.res.body).includes("admin"), "в ошибке не должно быть демо-логинов");
  const ok = await login(ADMIN.email, ADMIN.password);
  assert.equal(ok.res.status, 200);
  const session = await call(ok.jar, "/api/admin/session");
  assert.equal(session.status, 200);
});

test("новость: черновик не виден на сайте, после публикации — виден", async (t) => {
  if (!online) return t.skip("API не запущен");
  const { jar } = await login(ADMIN.email, ADMIN.password);
  const slug = `test-news-${Date.now()}`;
  const item = { slug, date: "2026-10-14", tag: "Тест", kind: "exchange", status: "draft", title: "Тестовая новость биржи", excerpt: "Проверка публикации", body: "<p>Текст тестовой новости.</p>" };
  const created = await call(jar, "/api/admin/data", { method: "POST", body: JSON.stringify({ op: "create", collection: "news", item }) });
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const id = (created.body.news as { id: string; slug: string }[]).find((n) => n.slug === slug)?.id;
  assert.ok(id, "новость должна появиться в админке");
  try {
    const hidden = await call({}, "/api/public/content");
    assert.ok(!(hidden.body.news as { slug: string }[]).some((n) => n.slug === slug), "черновик не должен быть на сайте");
    const published = await call(jar, "/api/admin/data", { method: "POST", body: JSON.stringify({ op: "update", collection: "news", id, item: { ...item, status: "published" } }) });
    assert.equal(published.status, 200, JSON.stringify(published.body));
    const visible = await call({}, "/api/public/content");
    assert.ok((visible.body.news as { slug: string }[]).some((n) => n.slug === slug), "опубликованная новость должна быть на сайте");
    const duplicate = await call(jar, "/api/admin/data", { method: "POST", body: JSON.stringify({ op: "create", collection: "news", item }) });
    assert.equal(duplicate.status, 409, "повтор адреса — понятная ошибка, а не 500");
  } finally {
    await call(jar, `/api/admin/news/${id}`, { method: "DELETE" });
  }
});

test("заявка с сайта сохраняется и видна в админке", async (t) => {
  if (!online) return t.skip("API не запущен");
  const marker = `Тест ${Date.now()}`;
  const sent = await call({}, "/api/public/request", { method: "POST", body: JSON.stringify({ source: "Автотест", payload: { name: marker, phone: "+996 000 000" } }) });
  assert.equal(sent.status, 200, JSON.stringify(sent.body));
  const { jar } = await login(ADMIN.email, ADMIN.password);
  const data = await call(jar, "/api/admin/data");
  const request = (data.body.requests as { id: string; payload: Record<string, string> }[]).find((r) => r.payload?.name === marker);
  assert.ok(request, "заявка должна быть в админке");
  await call(jar, `/api/admin/requests/${request.id}`, { method: "DELETE" });
});

test("удалённый пользователь сразу теряет доступ; последнего админа удалить нельзя", async (t) => {
  if (!online) return t.skip("API не запущен");
  const { jar } = await login(ADMIN.email, ADMIN.password);
  const email = `autotest-${Date.now()}@kse.kg`;
  const created = await call(jar, "/api/admin/data", { method: "POST", body: JSON.stringify({ op: "create", collection: "users", item: { name: "Автотест", email, role: "editor", password: "secret-123" } }) });
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const user = (created.body.users as { id: string; email: string }[]).find((u) => u.email === email);
  assert.ok(user);
  const editor = await login(email, "secret-123");
  assert.equal(editor.res.status, 200);
  await call(jar, `/api/admin/users/${user.id}`, { method: "DELETE" });
  const after = await call(editor.jar, "/api/admin/session");
  assert.equal(after.status, 401, "cookie удалённого пользователя должна перестать работать");
  const admins = (await call(jar, "/api/admin/data")).body.users as { id: string; role: string }[];
  if (admins.filter((u) => u.role === "admin").length === 1) {
    const last = await call(jar, `/api/admin/users/${admins.find((u) => u.role === "admin")!.id}`, { method: "DELETE" });
    assert.equal(last.status, 400);
  }
});
