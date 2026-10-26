import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanPastedHtml, formatFileSize, normalizeLinkUrl, plainTextToHtml, videoEmbedUrl } from "../news-content";

test("ссылки: безопасные схемы, домен без https, пути сайта, e-mail", () => {
  assert.equal(normalizeLinkUrl("https://kse.kg/news"), "https://kse.kg/news");
  assert.equal(normalizeLinkUrl("kse.kg/listing"), "https://kse.kg/listing");
  assert.equal(normalizeLinkUrl("/market"), "/market");
  assert.equal(normalizeLinkUrl("office@kse.kg"), "mailto:office@kse.kg");
  assert.equal(normalizeLinkUrl("tel:+996312311484"), "tel:+996312311484");
  for (const bad of ["javascript:alert(1)", "data:text/html,x", "//evil.example", "просто текст", "", "vbscript:x"]) {
    assert.equal(normalizeLinkUrl(bad), null, bad);
  }
});

test("видео: YouTube и Vimeo в любом виде, остальное — нет", () => {
  const yt = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ";
  for (const url of ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "youtu.be/dQw4w9WgXcQ", "https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=10", "https://youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ"]) {
    assert.equal(videoEmbedUrl(url), yt, url);
  }
  assert.equal(videoEmbedUrl("https://vimeo.com/123456789"), "https://player.vimeo.com/video/123456789");
  for (const bad of ["https://evil.example/watch?v=dQw4w9WgXcQ", "https://youtube.com/watch?v=short", "javascript:alert(1)", ""]) {
    assert.equal(videoEmbedUrl(bad), null, bad);
  }
});

test("вставка из Word и Google Docs: служебная разметка убирается", () => {
  const word = '<!--[if gte mso 9]><xml></xml><![endif]--><p class="MsoNormal">Текст<o:p></o:p></p>';
  assert.equal(cleanPastedHtml(word), "<p>Текст</p>");
  const docs = '<b style="font-weight:normal;" id="docs-internal-guid-123"><p>Абзац</p></b>';
  assert.equal(cleanPastedHtml(docs), "<p>Абзац</p>");
});

test("старый текст без разметки становится абзацами, HTML не трогаем", () => {
  assert.equal(plainTextToHtml("Строка 1\nСтрока <2>"), "<p>Строка 1</p><p>Строка &lt;2&gt;</p>");
  assert.equal(plainTextToHtml("<p>уже HTML</p>"), "<p>уже HTML</p>");
});

test("размер файла", () => {
  assert.equal(formatFileSize(500), "1 КБ");
  assert.equal(formatFileSize(2.5 * 1024 * 1024), "2,5 МБ");
});
