import assert from "node:assert/strict";
import { test } from "node:test";
import { presentFields, safeUrl, validRows } from "../modules/issuers-sync/sync";
import { issuerItemSchema, listingItemSchema } from "../validation/cms";

test("неверные записи из API пропускаются, верные проходят", (t) => {
  t.mock.method(console, "warn", () => {});
  const rows = validRows(
    [{ slug: "CJSC_Bank", name: "Банк" }, { slug: "плохой slug!", name: "X" }, { slug: "OK", name: "" }],
    issuerItemSchema,
    "test",
    (row) => row.slug,
  );
  assert.deepEqual(rows.map((row) => row.item.slug), ["CJSC_Bank"]);
});

test("категория листинга проверяется", (t) => {
  t.mock.method(console, "warn", () => {});
  const rows = validRows([{ code: "AAA1", category: "Z", name: "X" }], listingItemSchema, "test", (row) => row.code);
  assert.equal(rows.length, 0);
});

test("в обновление попадают только присланные API поля", () => {
  const data = { name: "Банк", address: "", sortOrder: 3, updatedAt: new Date() };
  assert.deepEqual(Object.keys(presentFields({ name: "Банк" }, data)), ["name"]);
  assert.deepEqual(Object.keys(presentFields({ name: "Банк", order: 3 }, data)), ["name", "sortOrder"]);
});

test("ссылки на документы — только http(s) и пути сайта", () => {
  assert.equal(safeUrl("https://oi.kse.kg/report.pdf"), "https://oi.kse.kg/report.pdf");
  assert.equal(safeUrl("/uploads/a.pdf"), "/uploads/a.pdf");
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl("//evil.example/x"), "");
});
