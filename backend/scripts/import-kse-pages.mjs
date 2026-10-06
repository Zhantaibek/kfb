/**
 * Переносит тексты разделов с https://www.kse.kg в seed-файл shared/kse-pages-seed.ts.
 * Запуск: node backend/scripts/import-kse-pages.mjs
 *
 * Берётся блок <div class="page_text"> (или центральная колонка) каждой страницы на ru/ky/en.
 * Ссылки на разделы kse.kg переписываются на наши адреса, файлы остаются ссылками на kse.kg.
 * Страницы попадают в БД при старте backend (см. ensureKsePages в src/db/postgres.ts),
 * если по этому адресу ещё нет страницы — правки из админки не затираются.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ORIGIN = "https://www.kse.kg";
const langs = ["ru", "ky", "en"];

/** Раздел kse.kg → наш адрес. */
const sections = [
  ["Auctioneers", "/about/shareholders"],
  ["Revisory", "/about/auditor"],
  ["GoverInfo", "/about/governance"],
  ["History", "/about/history"],
  ["CommitteeListing", "/about/committees/listing"],
  ["CommitteeStrategicPlanning", "/about/committees/strategy"],
  ["CommitteeAudit", "/about/committees/audit"],
  ["OurStrategy", "/about/strategy"],
  ["Announcement", "/about/25-years"],
  ["MembersSTDM", "/members/stdm"],
  ["MembersCommoditySector", "/members/commodity"],
  ["MembersRating", "/members/rating"],
  ["MembersGSB", "/members/gcb"],
  ["Prices", "/tariffs"],
  ["Analytics", "/analytics"],
  ["FinMarket", "/finmarket"],
  ["KSENormatives", "/regulations/exchange"],
  ["DepoNormatives", "/regulations/depository"],
  ["OpenInformation", "/regulations/disclosure"],
  ["Sustainable", "/sustainable"],
  ["EduPlan", "/education/plan"],
];

/** Остальные разделы kse.kg, у которых на нашем сайте уже есть свои страницы. */
const knownRoutes = {
  MainPage: "/",
  GeneralInfo: "/about",
  Management: "/about/management",
  Members: "/members",
  Partners: "/about/partners",
  CorporateDocuments: "/documents",
  Contacts: "/contacts",
  Listing: "/listing",
  PublicInfo: "/disclosure",
  PressClub: "/news",
  Statistics: "/market",
  TradeResults: "/market",
  TradeArchive: "/market/archive",
  IndexAndCapitalization: "/market/index",
  Quotes: "/market/quotes",
  QuotesGold: "/market/metals",
  ScheduleGS: "/gcb",
  AuctionResult: "/gcb/results",
  VolumeGs: "/gcb/volume",
  MfaResult: "/gcb/deposits",
  Education: "/education",
};
const routeBySlug = { ...knownRoutes, ...Object.fromEntries(sections) };

const cache = new Map();
async function fetchHtml(url) {
  if (cache.has(url)) return cache.get(url);
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (KSE site migration)" } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const html = await response.text();
  cache.set(url, html);
  return html;
}

/** Внутренность <div class="page_text"> с учётом вложенных div; если его нет — центральная колонка. */
function pageText(html) {
  const marker = '<div class="page_text">';
  const open = html.indexOf(marker);
  if (open < 0) {
    const centerMarker = '<div class="center_big container">';
    const center = html.indexOf(centerMarker);
    const end = html.indexOf("<!--/center_big-->", center);
    if (center < 0 || end < 0) return "";
    return html.slice(center + centerMarker.length, end).replace(/^\s*<div class="fcc">\s*<\/div>/, "");
  }
  const start = open + marker.length;
  const tag = /<\/?div\b[^>]*>/gi;
  tag.lastIndex = start;
  let depth = 1;
  let match;
  while ((match = tag.exec(html))) {
    depth += match[0][1] === "/" ? -1 : 1;
    if (depth === 0) return html.slice(start, match.index);
  }
  return html.slice(start);
}

function rewriteUrl(raw) {
  const url = raw.trim().replace(/&amp;/g, "&");
  if (!url || url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:")) return url;
  const absolute = url.startsWith("//") ? `https:${url}` : url.startsWith("/") ? `${ORIGIN}${url}` : url;
  const page = absolute.match(/^https?:\/\/(?:www\.)?kse\.kg\/(?:ru|ky|en)\/([A-Za-z]+)\/?(?:[?#].*)?$/);
  if (page && routeBySlug[page[1]]) return routeBySlug[page[1]];
  return absolute.replace(/^http:\/\/(www\.)?kse\.kg/, ORIGIN);
}

function clean(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\?php[\s\S]*?\?>/g, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<i class="material-icons">[^<]*<\/i>/gi, "")
    .replace(/​/g, "")
    .replace(/\b(href|src)=(["'])(.*?)\2/gi, (_, attr, quote, url) => `${attr}=${quote}${rewriteUrl(url)}${quote}`)
    .replace(/<p>\s*(&nbsp;|\s)*\s*<\/p>/gi, "")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function textOf(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}

/** Первый заголовок h1–h3 в начале блока убираем из тела — заголовок страницы выводится отдельно. */
function splitTitle(html) {
  const match = html.match(/^\s*(?:<br\s*\/?>\s*)*<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
  if (!match) return { title: "", body: html };
  return { title: textOf(match[1]), body: html.slice(match[0].length).replace(/^(\s*<br\s*\/?>)+/i, "").trim() };
}

/** Подписи разделов из меню kse.kg на каждом языке: slug → текст ссылки (первое вхождение). */
async function menuLabels(lang) {
  const labels = {};
  for (const page of ["MainPage", "GeneralInfo"]) {
    const html = await fetchHtml(`${ORIGIN}/${lang}/${page}`);
    const links = /<a\b[^>]*href="https?:\/\/www\.kse\.kg\/(?:ru|ky|en)\/([A-Za-z]+)\/?"[^>]*>([\s\S]*?)<\/a>/g;
    for (const match of html.matchAll(links)) {
      const text = textOf(match[2].replace(/<i class="material-icons">[^<]*<\/i>/g, ""));
      if (text && !labels[match[1]]) labels[match[1]] = text;
    }
  }
  return labels;
}

const labels = Object.fromEntries(await Promise.all(langs.map(async (lang) => [lang, await menuLabels(lang)])));

const pages = [];
for (const [slug, route] of sections) {
  const byLang = {};
  for (const lang of langs) {
    const { title, body } = splitTitle(clean(pageText(await fetchHtml(`${ORIGIN}/${lang}/${slug}`))));
    byLang[lang] = { title: labels[lang][slug] || title, body };
  }
  const ru = byLang.ru;
  if (!textOf(ru.body)) {
    console.warn(`пропущено: ${slug} — пустая страница`);
    continue;
  }
  const i18n = {};
  for (const lang of ["ky", "en"]) {
    const pack = byLang[lang];
    i18n[lang] = { title: pack.title || ru.title, lead: "", body: textOf(pack.body) ? pack.body : ru.body };
  }
  pages.push({ path: route, source: `${ORIGIN}/ru/${slug}`, title: ru.title || slug, lead: "", body: ru.body, i18n });
  console.log(
    `${slug} → ${route}: «${ru.title}» / «${byLang.ky.title}» / «${byLang.en.title}»; ${ru.body.length} симв.`,
  );
}

// Лендинг https://www.kse.kg/gsb.html свёрстан отдельно от остальных разделов — переносим его текст вручную.
// Перевода на kse.kg нет, поэтому ky/en пока совпадают с русским (переведите в админке).
const gsbBody = `<p>Государственные ценные бумаги — один из самых надёжных инструментов инвестирования: их выпускает само государство в лице Министерства финансов КР.</p>
<p>На торговой площадке Кыргызской фондовой биржи можно купить ГЦБ двух видов:</p>
<ul>
<li>государственные казначейские векселя сроком обращения 12 месяцев (ГКВ-12);</li>
<li>государственные казначейские облигации сроком обращения 2 года (ГКО-2).</li>
</ul>
<p><a href="https://www.kse.kg/Gsb/files/Инвестиции в государственные ценные бумаги (2).docx">Скачать документацию</a></p>
<h2>Зачем государство выпускает ГКВ и ГКО?</h2>
<p>Государственные ценные бумаги выпускаются для финансирования национальных проектов, дефицита бюджета и рефинансирования госдолга, по которому наступает срок платежей. Фактически это публичные долговые обязательства государства.</p>
<h2>Преимущества</h2>
<ul>
<li><strong>Высокая доходность.</strong> Покупая ГЦБ, инвестор изначально знает, сколько он получит в итоге: государство делает схему расчёта процентного дохода прозрачной.</li>
<li><strong>Слабая зависимость от рынка акций.</strong> Если популярные акции падают, это не значит, что снизятся выплаты по ГЦБ. Грамотно подобранные активы делают портфель стабильнее.</li>
<li><strong>Низкий уровень риска.</strong> Колебания стоимости ГЦБ меньше, чем у акций, поэтому они подходят инвесторам, которые не любят рисковать.</li>
<li><strong>Возможность продать в любой момент.</strong> Это делает ГЦБ удобнее банковского депозита.</li>
<li><strong>Гарантированная выплата.</strong> Выплаты по ГЦБ предусмотрены в государственном бюджете и всегда производятся в срок — государство выступает гарантом надёжности инвестиций.</li>
<li><strong>РЕПО-операции.</strong> ГЦБ можно использовать в сделках РЕПО — продаже ценных бумаг с обязательством выкупить их в определённый срок по заранее оговорённой цене.</li>
</ul>
<h2>Как на этом можно заработать?</h2>
<p>ГКВ выпускают на 12 месяцев и погашают по номиналу 100 сомов. Бумаги продают с дисконтом, например по 86–87 сомов. Купив их за 86–87 сомов, через год вы получите от Минфина КР 100 сомов — эти 13–14 сомов и есть ваш доход.</p>
<p>ГКО — купонные ценные бумаги, их тоже продают чуть дешевле номинала. Сейчас у двухлетних ГКО купонный доход — 5% годовых: каждые полгода вы получаете 2,5% купонного дохода, а через два года вам возвращают основную сумму по номиналу, а не по цене покупки.</p>
<h2>Листинг на КФБ</h2>
<p>ГКО-2 и ГКВ-12 включены в листинг Кыргызской фондовой биржи по наивысшей категории «А». Согласно Налоговому кодексу Кыргызской Республики, проценты и доход от прироста стоимости ценных бумаг из категории листинга «А» не облагаются подоходным налогом и налогом на прибыль.</p>
<h2>Как купить ГКВ-12 и ГКО-2?</h2>
<p>Купить ГКВ-12 и ГКО-2 может каждый желающий, в том числе иностранный инвестор, через участников торгов ГЦБ — брокерскую компанию или коммерческий банк по выбору клиента, с которыми заключается договор на покупку.</p>
<p><a href="/members/gcb">Участники торгов ГЦБ</a> · <a href="/gcb">Расписание аукционов по ГЦБ</a> · <a href="/gcb/results">Результаты аукционов ГЦБ</a></p>`;
pages.push({
  path: "/gcb/invest",
  source: `${ORIGIN}/gsb.html`,
  title: "Инвестиции в ГЦБ",
  lead: "Государственные ценные бумаги Кыргызской Республики на торговой площадке КФБ",
  body: gsbBody,
  i18n: {
    ky: { title: "Инвестиции в ГЦБ", lead: "Государственные ценные бумаги Кыргызской Республики на торговой площадке КФБ", body: gsbBody },
    en: { title: "Investing in government securities", lead: "Government securities of the Kyrgyz Republic on the KSE trading floor", body: gsbBody },
  },
});

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "../../shared/kse-pages-seed.ts");
writeFileSync(
  out,
  `// Сгенерировано backend/scripts/import-kse-pages.mjs ${new Date().toISOString().slice(0, 10)} — тексты разделов kse.kg.
// Не править руками: страницы редактируются в админке («Меню и страницы»), этот файл — только начальное заполнение.
import type { CmsI18n } from "./cms";

export type KsePageSeed = { path: string; source: string; title: string; lead: string; body: string; i18n: CmsI18n };

export const ksePageSeed: KsePageSeed[] = ${JSON.stringify(pages, null, 2)};
`,
);
console.log(`\nГотово: ${pages.length} страниц → ${path.relative(process.cwd(), out)}`);
