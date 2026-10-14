// Модульные тесты: без сервера и базы. Запуск: npm test (в backend).
import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeRichHtml } from "../src/utils/sanitize-html";
import { clampFigureOffset, figureLayoutStyle } from "../src/utils/figure-layout";
import { languageError } from "../../shared/lang-check";

test("sanitize: опасные ссылки вырезаются, обычные остаются", () => {
  const html = sanitizeRichHtml(
    '<p><a href="javascript:alert(1)">x</a> <a href="data:text/html,1">d</a> <a href="https://kse.kg" target="_blank">s</a> <a href="/about">a</a> <a href="mailto:info@kse.kg">m</a></p>',
  );
  assert.ok(!html.includes("javascript:"), "javascript: должен быть удалён");
  assert.ok(!html.includes("data:text/html"), "data: в ссылке должен быть удалён");
  assert.ok(html.includes('href="https://kse.kg"'));
  assert.ok(html.includes('rel="noopener noreferrer"'), "у ссылки в новой вкладке должен быть rel");
  assert.ok(html.includes('href="/about"'));
  assert.ok(html.includes('href="mailto:info@kse.kg"'));
});

test("sanitize: скрипты, обработчики и iframe не проходят", () => {
  const html = sanitizeRichHtml('<p onclick="x()">t</p><script>alert(1)</script><iframe src="https://evil"></iframe><img src="x" onerror="y()">');
  assert.ok(!/onclick|onerror|<script|<iframe/i.test(html), html);
});

test("sanitize: стиль фигуры собирается из data-атрибутов, а не из присланного style", () => {
  const html = sanitizeRichHtml('<figure data-align="left" data-width="40" data-ox="30" data-oy="-50" style="position:fixed;top:0"><img src="/uploads/a.png"></figure>');
  assert.ok(!html.includes("position"), "произвольный CSS не должен проходить");
  assert.ok(html.includes("width:40%"));
  assert.ok(html.includes("margin-left:30px"));
  assert.ok(!html.includes("margin-top"), "сдвиг вверх (oy<0) отбрасывается — фото не закрывает текст");
});

test("figure-layout: фото не уходит вверх и в сторону текста", () => {
  assert.deepEqual(clampFigureOffset("left", -20, -30), { x: 0, y: 0 });
  assert.deepEqual(clampFigureOffset("right", 20, 15), { x: 0, y: 15 });
  assert.deepEqual(clampFigureOffset("center", -20, 10), { x: -20, y: 10 });
  assert.equal(figureLayoutStyle("center", 50, 0, 0), "width:50%");
});

test("lang-check: язык вкладок определяется верно", () => {
  assert.equal(languageError("Биржа проводит торги ценными бумагами", "ru"), null);
  assert.ok(languageError("The exchange runs trading", "ru"));
  assert.equal(languageError("The exchange runs trading sessions", "en"), null);
  assert.ok(languageError("Биржа проводит торги", "en"));
  assert.equal(languageError("Биржа баалуу кагаздар менен соода жүргүзөт", "ky"), null);
});
