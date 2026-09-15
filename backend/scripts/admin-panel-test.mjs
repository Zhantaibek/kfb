const web = "http://localhost:3000";
const api = "http://localhost:4000";

const results = [];
const created = { news: null, page: null, menu: null, slide: null, user: null, request: null, media: null };

function pass(name, detail = "") {
  results.push({ ok: true, name, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, detail) {
  results.push({ ok: false, name, detail: String(detail) });
  console.log(`FAIL  ${name} — ${detail}`);
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function absorbCookies(jar, headers) {
  const raw = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
  for (const line of raw) {
    const part = line.split(";")[0];
    const eq = part.indexOf("=");
    if (eq > 0) jar.set(part.slice(0, eq), part.slice(eq + 1));
  }
}

async function req(origin, path, { method = "GET", body, jar, headers = {}, form } = {}) {
  const h = { ...headers };
  if (jar) h.cookie = cookieHeader(jar);
  let payload = body;
  if (form) {
    payload = form;
  } else if (body && typeof body === "object") {
    h["content-type"] = h["content-type"] ?? "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(origin + path, { method, headers: h, body: payload, redirect: "manual" });
  if (jar) absorbCookies(jar, res.headers);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text, location: res.headers.get("location"), headers: res.headers };
}

function assertStatus(name, res, expected) {
  const ok = Array.isArray(expected) ? expected.includes(res.status) : res.status === expected;
  if (ok) pass(name, `HTTP ${res.status}`);
  else fail(name, `expected ${expected}, got ${res.status} ${JSON.stringify(res.json ?? res.text.slice(0, 180))}`);
  return ok;
}

async function main() {
  const adminJar = new Map();
  const editorJar = new Map();
  const emptyJar = new Map();

  // --- pages ---
  for (const path of ["/admin", "/admin/login", "/admin/dashboard", "/admin/news", "/admin/pages", "/admin/menu", "/admin/slider", "/admin/media", "/admin/requests", "/admin/users", "/admin/visits", "/admin/audit", "/admin/api", "/admin/profile"]) {
    const res = await req(web, path);
    if (path === "/admin") {
      assertStatus(`GET ${path} redirects`, res, [307, 308]);
      if (res.location && !res.location.includes("/admin/dashboard")) fail("admin index location", res.location);
      else if (res.location) pass("admin index → dashboard", res.location);
    } else {
      assertStatus(`GET ${path}`, res, 200);
      if (res.status === 200 && res.text.includes("Application error")) fail(`${path} render`, "Application error in HTML");
    }
  }

  // --- unauthenticated API ---
  assertStatus("GET /api/admin/session guest", await req(web, "/api/admin/session"), 401);
  assertStatus("GET /api/admin/data guest", await req(web, "/api/admin/data"), 401);
  assertStatus("POST /api/admin/data guest", await req(web, "/api/admin/data", { method: "POST", body: { op: "create", collection: "news", item: {} } }), 401);

  // --- bad login ---
  assertStatus("admin login wrong password", await req(web, "/api/admin/session", { method: "POST", body: { email: "admin@kse.kg", password: "nope" }, jar: emptyJar }), 401);
  assertStatus("investor cannot use admin login", await req(web, "/api/admin/session", { method: "POST", body: { email: "investor@kse.kg", password: "kse" } }), 401);
  assertStatus("admin login invalid email", await req(web, "/api/admin/session", { method: "POST", body: { email: "not-an-email", password: "admin" } }), 400);

  // --- admin login ---
  const login = await req(web, "/api/admin/session", { method: "POST", body: { email: "admin@kse.kg", password: "admin" }, jar: adminJar });
  if (assertStatus("admin login", login, 200) && login.json?.user?.email !== "admin@kse.kg") {
    fail("admin login user", JSON.stringify(login.json));
  }
  if (!adminJar.has("kse-admin")) fail("admin cookie set", [...adminJar.keys()].join(",") || "no cookies");
  else pass("admin cookie kse-admin", "set");

  const session = await req(web, "/api/admin/session", { jar: adminJar });
  assertStatus("GET /api/admin/session authed", session, 200);
  if (session.json?.user?.role !== "admin") fail("session role", JSON.stringify(session.json));
  else pass("session role admin", session.json.user.name);

  const data = await req(web, "/api/admin/data", { jar: adminJar });
  if (!assertStatus("GET /api/admin/data", data, 200)) return;
  const store = data.json;
  for (const key of ["news", "slides", "pages", "menu", "media", "requests", "users", "visits", "audit"]) {
    if (Array.isArray(store[key])) pass(`store.${key}`, `${store[key].length} items`);
    else fail(`store.${key}`, "missing array");
  }
  if (store.users?.some((u) => u.password)) fail("users passwords stripped", "password leaked");
  else pass("users passwords stripped");

  // --- pages with cookie (shell should still 200) ---
  for (const path of ["/admin/dashboard", "/admin/news", "/admin/users", "/admin/api", "/admin/profile"]) {
    assertStatus(`authed GET ${path}`, await req(web, path, { jar: adminJar }), 200);
  }

  // --- health / docs ---
  assertStatus("GET /api/health", await req(web, "/api/health"), 200);
  const docs = await req(api, "/docs/");
  assertStatus("GET API /docs/", docs, 200);
  const xfo = docs.headers.get("x-frame-options");
  if (xfo) fail("docs X-Frame-Options", xfo);
  else pass("docs X-Frame-Options", "absent");
  const csp = docs.headers.get("content-security-policy") ?? "";
  if (csp.includes("http://localhost:3000")) pass("docs frame-ancestors", csp);
  else fail("docs frame-ancestors", csp || "missing");

  // --- news CRUD ---
  const newsCreate = await req(web, "/api/admin/data", {
    method: "POST",
    jar: adminJar,
    body: {
      op: "create",
      collection: "news",
      item: {
        slug: "admin-test-news",
        date: "04.09.2026",
        tag: "Тест",
        kind: "exchange",
        status: "published",
        title: "Тестовая новость админки",
        excerpt: "Проверка CMS",
        body: "<p>Текст <script>alert(1)</script>новости</p>",
        photo: "/carousel/city.jpg",
      },
    },
  });
  if (assertStatus("create news", newsCreate, 200)) {
    const item = newsCreate.json.news.find((n) => n.slug === "admin-test-news");
    if (!item) fail("news created in store", "not found");
    else {
      created.news = item.id;
      pass("news created", item.id);
      if (String(item.body).includes("<script>")) fail("news HTML sanitize", item.body);
      else pass("news HTML sanitize");
    }
  }

  if (created.news) {
    const newsUpdate = await req(web, "/api/admin/data", {
      method: "POST",
      jar: adminJar,
      body: {
        op: "update",
        collection: "news",
        id: created.news,
        item: { title: "Тестовая новость обновлена", slug: "admin-test-news", date: "04.09.2026", tag: "Тест", kind: "urgent", status: "draft", excerpt: "upd", body: "<p>ok</p>", photo: "" },
      },
    });
    if (assertStatus("update news", newsUpdate, 200)) {
      const item = newsUpdate.json.news.find((n) => n.id === created.news);
      if (item?.title === "Тестовая новость обновлена" && item.kind === "urgent" && item.status === "draft") pass("news fields updated");
      else fail("news fields updated", JSON.stringify(item));
    }
  }

  // --- pages CRUD ---
  const pageCreate = await req(web, "/api/admin/data", {
    method: "POST",
    jar: adminJar,
    body: {
      op: "create",
      collection: "pages",
      item: { path: "/p/admin-test", title: "Тестовая страница", lead: "Лид", body: "<p>Тело</p>", status: "published" },
    },
  });
  if (assertStatus("create page", pageCreate, 200)) {
    const item = pageCreate.json.pages.find((p) => p.path === "/p/admin-test");
    if (!item) fail("page created", "not found");
    else {
      created.page = item.id;
      pass("page created", item.id);
    }
  }

  // --- menu CRUD ---
  const menuCreate = await req(web, "/api/admin/data", {
    method: "POST",
    jar: adminJar,
    body: { op: "create", collection: "menu", item: { label: "Тест-меню", href: "/p/admin-test", group: "header", order: 99 } },
  });
  if (assertStatus("create menu", menuCreate, 200)) {
    const item = menuCreate.json.menu.find((m) => m.label === "Тест-меню");
    created.menu = item?.id ?? null;
    if (created.menu) pass("menu created", created.menu);
    else fail("menu created", "not found");
  }

  if (created.menu) {
    const childCreate = await req(web, "/api/admin/data", {
      method: "POST",
      jar: adminJar,
      body: {
        op: "create",
        collection: "menu",
        item: { label: "Тест-подпункт", href: "/p/admin-test-child", group: "header", order: 1, parentId: created.menu },
      },
    });
    if (assertStatus("create menu child", childCreate, 200)) {
      const child = childCreate.json.menu.find((m) => m.label === "Тест-подпункт");
      if (child?.parentId === created.menu) pass("menu child parentId", child.id);
      else fail("menu child parentId", child ? `parent=${child.parentId}` : "not found");
    }
  }

  // --- slider CRUD ---
  const slideCreate = await req(web, "/api/admin/data", {
    method: "POST",
    jar: adminJar,
    body: { op: "create", collection: "slides", item: { title: "Тест-слайд", text: "описание", href: "/market", value: "TEST", photo: "/carousel/trading.jpg", order: 9 } },
  });
  if (assertStatus("create slide", slideCreate, 200)) {
    const item = slideCreate.json.slides.find((s) => s.title === "Тест-слайд");
    created.slide = item?.id ?? null;
    if (created.slide) pass("slide created", created.slide);
    else fail("slide created", "not found");
  }

  // --- public request → admin requests ---
  const pubReq = await req(web, "/api/public/request", {
    method: "POST",
    body: { source: "admin-test", payload: { name: "Тестер", email: "test@kse.kg", message: "Проверка заявок" } },
  });
  assertStatus("public request", pubReq, 200);
  const afterReq = await req(web, "/api/admin/data", { jar: adminJar });
  const requestItem = afterReq.json?.requests?.find((r) => r.source === "admin-test");
  if (requestItem) {
    created.request = requestItem.id;
    pass("request visible in admin", requestItem.id);
    const close = await req(web, "/api/admin/data", {
      method: "POST",
      jar: adminJar,
      body: { op: "update", collection: "requests", id: requestItem.id, item: { ...requestItem, status: "done" } },
    });
    if (assertStatus("close request", close, 200)) {
      const updated = close.json.requests.find((r) => r.id === requestItem.id);
      if (updated?.status === "done") pass("request marked done");
      else fail("request marked done", JSON.stringify(updated));
    }
  } else fail("request visible in admin", "not found");

  // --- users CRUD ---
  const userCreate = await req(web, "/api/admin/data", {
    method: "POST",
    jar: adminJar,
    body: { op: "create", collection: "users", item: { name: "Тест редактор", email: "admin-test-editor@kse.kg", role: "editor", password: "testpass" } },
  });
  if (assertStatus("create user", userCreate, 200)) {
    const item = userCreate.json.users.find((u) => u.email === "admin-test-editor@kse.kg");
    created.user = item?.id ?? null;
    if (created.user) pass("user created", created.user);
    else fail("user created", "not found");
    if (item?.password) fail("created user password hidden", "leaked");
    else pass("created user password hidden");
  }

  assertStatus(
    "create user without password",
    await req(web, "/api/admin/data", {
      method: "POST",
      jar: adminJar,
      body: { op: "create", collection: "users", item: { name: "No Pass", email: "nopass@kse.kg", role: "editor" } },
    }),
    400,
  );

  // --- upload ---
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const form = new FormData();
  form.append("file", new Blob([png], { type: "image/png" }), "admin-test.png");
  const upload = await req(web, "/api/admin/upload", { method: "POST", jar: adminJar, form });
  if (assertStatus("upload media", upload, 200)) {
    created.media = upload.json?.id ?? null;
    if (upload.json?.url) {
      pass("upload url", upload.json.url);
      const file = await req(web, upload.json.url);
      assertStatus("GET uploaded file via /uploads", file, 200);
    } else fail("upload url", JSON.stringify(upload.json));
  }

  assertStatus("upload without file", await req(web, "/api/admin/upload", { method: "POST", jar: adminJar, form: new FormData() }), 400);

  // --- visits + audit ---
  await req(web, "/api/public/visit", { method: "POST", body: { path: "/market" } });
  const logs = await req(web, "/api/admin/data", { jar: adminJar });
  if (logs.json?.visits?.some((v) => v.path === "/market")) pass("visit logged");
  else fail("visit logged", `count=${logs.json?.visits?.length}`);
  if (logs.json?.audit?.some((a) => a.actor === "admin@kse.kg")) pass("audit has admin actions");
  else fail("audit has admin actions", `count=${logs.json?.audit?.length}`);
  assertStatus("admin visit ignored", await req(web, "/api/public/visit", { method: "POST", body: { path: "/admin/news" } }), 200);

  // --- editor role ---
  const editorLogin = await req(web, "/api/admin/session", { method: "POST", body: { email: "editor@kse.kg", password: "editor" }, jar: editorJar });
  assertStatus("editor login", editorLogin, 200);
  assertStatus(
    "editor cannot manage users",
    await req(web, "/api/admin/data", {
      method: "POST",
      jar: editorJar,
      body: { op: "create", collection: "users", item: { name: "X", email: "x@kse.kg", role: "editor", password: "xxxx" } },
    }),
    403,
  );
  const editorNews = await req(web, "/api/admin/data", {
    method: "POST",
    jar: editorJar,
    body: {
      op: "create",
      collection: "news",
      item: { slug: "editor-can-write", date: "04.09.2026", tag: "Тест", kind: "exchange", status: "draft", title: "Редактор пишет", excerpt: "", body: "<p>ok</p>", photo: "" },
    },
  });
  if (assertStatus("editor can create news", editorNews, 200)) {
    const item = editorNews.json.news.find((n) => n.slug === "editor-can-write");
    if (item) {
      await req(web, "/api/admin/data", { method: "POST", jar: adminJar, body: { op: "delete", collection: "news", id: item.id } });
      pass("editor news cleaned");
    }
  }

  // --- REST collection aliases ---
  if (created.news) {
    assertStatus(
      "PATCH /api/admin/news/:id",
      await req(web, `/api/admin/news/${created.news}`, {
        method: "PATCH",
        jar: adminJar,
        body: { title: "REST patch", slug: "admin-test-news", date: "04.09.2026", tag: "Тест", kind: "exchange", status: "draft", excerpt: "", body: "<p>r</p>", photo: "" },
      }),
      200,
    );
  }

  // --- validation ---
  assertStatus(
    "invalid news rejected",
    await req(web, "/api/admin/data", { method: "POST", jar: adminJar, body: { op: "create", collection: "news", item: { title: "" } } }),
    400,
  );

  // --- public content reflects CMS ---
  const pub = await req(web, "/api/public/content");
  assertStatus("public content", pub, 200);
  if (pub.json?.news && pub.json?.slides) pass("public content shape", `news=${pub.json.news.length} slides=${pub.json.slides.length}`);
  else fail("public content shape", "missing");

  // --- cleanup ---
  const cleanup = [
    ["news", created.news],
    ["pages", created.page],
    ["menu", created.menu],
    ["slides", created.slide],
    ["users", created.user],
    ["requests", created.request],
    ["media", created.media],
  ];
  for (const [collection, id] of cleanup) {
    if (!id) continue;
    const del = await req(web, "/api/admin/data", { method: "POST", jar: adminJar, body: { op: "delete", collection, id } });
    assertStatus(`delete ${collection}`, del, 200);
  }

  const logout = await req(web, "/api/admin/session", { method: "DELETE", jar: adminJar });
  assertStatus("admin logout", logout, 200);
  assertStatus("session after logout", await req(web, "/api/admin/session", { jar: adminJar }), 401);

  const failed = results.filter((r) => !r.ok);
  console.log("\n---");
  console.log(`${results.filter((r) => r.ok).length} passed, ${failed.length} failed, ${results.length} total`);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
