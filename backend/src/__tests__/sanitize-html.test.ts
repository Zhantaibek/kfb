import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeRichHtml } from "../utils/sanitize-html";

test("скрипты из HTML новостей вырезаются", () => {
  const out = sanitizeRichHtml('<p>Текст</p><script>alert(1)</script>');
  assert.ok(out.includes("<p>Текст</p>"));
  assert.ok(!/script/i.test(out));
});

test("обработчики событий и javascript:-ссылки не проходят", () => {
  const out = sanitizeRichHtml('<img src="x.png" onerror="alert(1)"><a href="javascript:alert(1)">ссылка</a>');
  assert.ok(!/onerror/i.test(out));
  assert.ok(!/javascript:/i.test(out));
});

test("обычная разметка и таблицы сохраняются", () => {
  const out = sanitizeRichHtml("<h2>Тарифы</h2><table><tbody><tr><td>1</td></tr></tbody></table>");
  assert.ok(out.includes("<h2>Тарифы</h2>"));
  assert.ok(out.includes("<td>1</td>"));
});
