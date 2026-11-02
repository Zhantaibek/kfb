import assert from "node:assert/strict";
import { test } from "node:test";
import { parseDisclosure } from "../modules/disclosure/disclosure.service";
import { disclosureItemSchema } from "../validation/cms";

// Фрагмент страницы https://www.kse.kg/ru/PublicInfo/<slug> (вкладка «Новости компании») — разметка как на сайте.
const PAGE = `
<div class="item" id="content-3">
  <h3>Новости компании</h3>
  <table class="class1 newtable" width="100%">
    <tr><td>
      <!-- START OI_SYSTEM - CHANGED HERE  -->
        <strong>2026-08-21</strong> <a href="https://oi.kse.kg/report/22/19/6206" target="_blank">ОАО &quot;Орта Азия Инвестмент Холдинг&quot; : Решения, принятые общим собранием акционеров</a>
      <!-- END OI_SYSTEM - CHANGED HERE  -->
    </td></tr>
    <tr><td>
        <strong>2026-03-10</strong> <a href="http://oi.kse.kg/report/3/3/4884" target="_blank">ОАО "Орта Азия Инвестмент Холдинг" : Изменение в составе Исполнительного органа</a>
    </td></tr>
    <tr><td><strong>2026-01-01</strong> <a href="https://example.com/x">Чужая ссылка : не берём</a></td></tr>
  </table>
</div>`;

test("события эмитента разбираются со страницы kse.kg: дата, суть без названия компании, ссылка", () => {
  assert.deepEqual(parseDisclosure(PAGE), [
    { date: "2026-08-21", title: "Решения, принятые общим собранием акционеров", url: "https://oi.kse.kg/report/22/19/6206" },
    { date: "2026-03-10", title: "Изменение в составе Исполнительного органа", url: "https://oi.kse.kg/report/3/3/4884" },
  ]);
});

test("страница без событий даёт пустой список", () => {
  assert.deepEqual(parseDisclosure("<html><body><h3>Новости компании</h3><table></table></body></html>"), []);
});

test("событие из админки: дата ГГГГ-ММ-ДД и ссылка только https", () => {
  const event = { issuerSlug: "ALA-ARCHA", date: "2026-10-26", title: "STRIX-TEST событие", url: "https://oi.kse.kg/report/1/1/1" };
  assert.equal(disclosureItemSchema.safeParse(event).success, true);
  assert.equal(disclosureItemSchema.safeParse({ ...event, date: "26.10.2026" }).success, false);
  assert.equal(disclosureItemSchema.safeParse({ ...event, url: "javascript:alert(1)" }).success, false);
  assert.equal(disclosureItemSchema.safeParse({ ...event, url: "http://oi.kse.kg/report/1" }).success, false);
  assert.equal(disclosureItemSchema.safeParse({ ...event, title: " " }).success, false);
});
