import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeRichHtml } from "../utils/sanitize-html";
import { newsItemSchema } from "../validation/cms";

const base = { slug: "test", date: "23.10.2026", tag: "Биржа", kind: "exchange", title: "Заголовок", body: "<p>Текст новости на русском языке.</p>" };

test("видео YouTube и Vimeo проходят, другие сайты — нет", () => {
  const ok = sanitizeRichHtml('<div class="rte-video" data-video=""><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"></iframe></div>');
  assert.match(ok, /<iframe[^>]+src="https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ"/);
  assert.match(sanitizeRichHtml('<iframe src="https://player.vimeo.com/video/123456789"></iframe>'), /player\.vimeo\.com/);
  assert.doesNotMatch(sanitizeRichHtml('<iframe src="https://evil.example/embed"></iframe>'), /evil\.example/);
  assert.doesNotMatch(sanitizeRichHtml('<iframe src="http://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>'), /src="http:/);
});

test("у плеера только наши атрибуты: обработчики и srcdoc вырезаются", () => {
  const out = sanitizeRichHtml('<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" onload="alert(1)" srcdoc="<script>alert(1)</script>"></iframe>');
  assert.doesNotMatch(out, /onload|srcdoc/);
  assert.match(out, /allowfullscreen/);
});

test("ссылки data: и javascript: не проходят, внешние открываются безопасно", () => {
  assert.doesNotMatch(sanitizeRichHtml('<a href="data:text/html,<script>alert(1)</script>">x</a>'), /data:/);
  assert.doesNotMatch(sanitizeRichHtml('<a href="javascript:alert(1)">x</a>'), /javascript:/);
  const external = sanitizeRichHtml('<a href="https://example.kg/page">x</a>');
  assert.match(external, /target="_blank"/);
  assert.match(external, /rel="noopener noreferrer"/);
  assert.doesNotMatch(sanitizeRichHtml('<a href="/market">x</a>'), /target=/);
});

test("форматирование редактора сохраняется: цитата, списки, выравнивание, зачёркивание", () => {
  const out = sanitizeRichHtml('<blockquote><p>Цитата</p></blockquote><ul><li><p>Пункт</p></li></ul><p style="text-align: center">Центр</p><p><s>Старое</s></p><hr>');
  for (const part of ["<blockquote>", "<ul>", "text-align:center", "<s>", "<hr />"]) assert.ok(out.includes(part), `нет ${part}: ${out}`);
});

test("черновик сохраняется без перевода, публикация требует переводы", () => {
  assert.equal(newsItemSchema.safeParse({ ...base, status: "draft" }).success, true);
  const published = newsItemSchema.safeParse({ ...base, status: "published" });
  assert.equal(published.success, false);
});

test("пустой текст нельзя опубликовать, черновик — можно", () => {
  assert.equal(newsItemSchema.safeParse({ ...base, body: "", status: "draft" }).success, true);
  const r = newsItemSchema.safeParse({ ...base, body: "", status: "published" });
  assert.equal(r.success, false);
});

test("документы: только загруженные файлы разрешённых форматов", () => {
  const doc = { name: "Отчёт", url: "/uploads/1b2c3d4e-0000-4000-8000-000000000000.pdf", ext: "pdf", size: 1000 };
  assert.equal(newsItemSchema.safeParse({ ...base, status: "draft", attachments: [doc] }).success, true);
  for (const url of ["https://evil.example/x.pdf", "/uploads/../../etc/passwd", "/uploads/a.exe", "javascript:alert(1)"]) {
    assert.equal(newsItemSchema.safeParse({ ...base, status: "draft", attachments: [{ ...doc, url }] }).success, false, url);
  }
  assert.equal(newsItemSchema.safeParse({ ...base, status: "draft", attachments: [{ ...doc, name: " " }] }).success, false);
});
