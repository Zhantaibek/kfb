import { prisma } from "../../db/prisma";
import { parseListingDocuments } from "../../../../shared/cms";

/**
 * Поиск по всему сайту: страницы, новости, эмитенты, листинг и его документы, руководство,
 * пункты меню, блоки главной и курсы учебного центра. Ищем во всех языках (ru + i18n ky/en).
 * Данных немного (сотни записей), поэтому индекс собираем в памяти и держим 60 секунд.
 */

export type SearchKind = "pages" | "instruments" | "members" | "partners" | "news" | "issuers" | "listing" | "documents" | "people";

type Doc = {
  kind: SearchKind;
  title: string;
  href: string;
  /** Подпись под заголовком: код бумаги, должность, дата… */
  meta?: string;
  /** Нормализованный заголовок — совпадение в нём важнее. */
  titleKey: string;
  /** Нормализованный текст для поиска (заголовок + всё остальное). */
  key: string;
  /** Чистый текст для фрагмента с совпадением (русский). */
  plain: string;
  /** Переводы (ky/en) — ищем и в них; фрагмент из перевода — только если в русском тексте совпадения нет. */
  translated: string;
};

export const kindLabels: Record<SearchKind, string> = {
  pages: "Разделы и страницы",
  instruments: "Инструменты",
  members: "Участники торгов",
  partners: "Партнёры",
  news: "Новости",
  issuers: "Эмитенты",
  listing: "Листинг",
  documents: "Документы",
  people: "Руководство",
};

const ENTITIES: Record<string, string> = { nbsp: " ", laquo: "«", raquo: "»", mdash: "—", ndash: "–", quot: '"', amp: "&", lt: "<", gt: ">" };

/** HTML → текст. */
function plainText(value: unknown): string {
  return String(value ?? "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#\d+|[a-z]+);/gi, (m, code: string) =>
      code.startsWith("#") ? String.fromCharCode(Number(code.slice(1))) : (ENTITIES[code.toLowerCase()] ?? " "),
    )
    .replace(/\s+/g, " ")
    .trim();
}

/** Для сравнения: регистр, «ё», кавычки и лишние пробелы не важны. */
export function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[«»"'`„“”]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Все переводы записи одной строкой (ky/en поля из i18n). */
function i18nText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  return Object.values(value as Record<string, unknown>)
    .flatMap((pack) => (pack && typeof pack === "object" ? Object.values(pack as Record<string, unknown>) : []))
    .map(plainText)
    .join(" ");
}

function doc(kind: SearchKind, title: string, href: string, parts: unknown[], meta?: string, i18n?: unknown): Doc {
  const plain = parts.map(plainText).filter(Boolean).join(" · ");
  const translated = i18nText(i18n);
  const cleanTitle = plainText(title);
  return {
    kind,
    title: cleanTitle,
    href,
    meta,
    titleKey: normalize(cleanTitle),
    key: normalize(`${cleanTitle} ${plain} ${translated}`),
    plain,
    translated,
  };
}

async function buildIndex(): Promise<Doc[]> {
  const [pages, news, issuers, listing, people, menu, hubs, slides, quotes, members, partners] = await Promise.all([
    prisma.page.findMany({ where: { status: "published" } }),
    prisma.news.findMany({ where: { status: "published" } }),
    prisma.issuer.findMany(),
    prisma.listingEntry.findMany(),
    prisma.managementPerson.findMany({ where: { status: "published" } }),
    prisma.menuItem.findMany(),
    prisma.homeHub.findMany(),
    prisma.slide.findMany(),
    // Котировки — живые данные с kse.kg (modules/kse-sync).
    prisma.kseSnapshot.findUnique({ where: { key: "quotes" } }),
    prisma.kseSnapshot.findUnique({ where: { key: "members" } }),
    prisma.partner.findMany({ where: { status: "published" } }),
  ]);

  const docs: Doc[] = [];
  const seenHref = new Set<string>();

  for (const row of pages) {
    docs.push(doc("pages", row.title, row.path, [row.lead, row.body], undefined, row.i18n));
    seenHref.add(row.path);
  }
  // Пункты меню (шапка, бургер, подвал) — разделы, у которых нет своей страницы в админке.
  for (const row of menu) {
    if (!row.href || row.href === "#" || seenHref.has(row.href)) continue;
    seenHref.add(row.href);
    docs.push(doc("pages", row.label, row.href, [], undefined, row.i18n));
  }
  for (const row of [...hubs, ...slides]) {
    if (!row.href || seenHref.has(row.href)) continue;
    seenHref.add(row.href);
    docs.push(doc("pages", row.title, row.href, [row.text], undefined, row.i18n));
  }
  for (const row of news) {
    docs.push(doc("news", row.title, `/news/${row.slug}`, [row.excerpt, row.body, row.tag], row.date, row.i18n));
  }
  for (const row of issuers) {
    docs.push(
      doc("issuers", row.name, `/disclosure/${row.slug}`, [row.slug, row.activity, row.director, row.address, row.security, row.registrar], row.status || undefined),
    );
  }
  for (const row of listing) {
    const href = row.issuerSlug ? `/disclosure/${row.issuerSlug}` : "/listing";
    docs.push(
      doc("listing", `${row.code} — ${row.name}`, href, [row.security, row.symbols, row.industry, row.activity, row.auditor, row.registrar], `Категория ${row.category === "delisted" ? "делистинг" : row.category}`),
    );
    for (const file of parseListingDocuments(row.documents)) {
      if (!file.url) continue;
      docs.push(doc("documents", file.name || "Документ", file.url, [row.code, row.name], `${row.code} · ${row.name}`));
    }
  }
  for (const row of people) {
    docs.push(doc("people", row.name, "/about/management", [row.role, row.bio, row.education], row.role, row.i18n));
  }
  const quoteRows = ((quotes?.data as { rows?: { symbol: string; isin: string; name: string; sellPrice: number | null; buyPrice: number | null }[] } | null)?.rows ?? []);
  for (const row of quoteRows) {
    const price = row.sellPrice ?? row.buyPrice;
    docs.push(
      doc("instruments", `${row.symbol} — ${row.name}`, `/market/quotes?q=${encodeURIComponent(row.symbol)}`, [row.isin], price ? `${price} сом` : undefined),
    );
  }
  const memberRows = ((members?.data as { rows?: { name: string; details: string; suspended: string }[] } | null)?.rows ?? []);
  for (const row of memberRows) {
    docs.push(doc("members", row.name, "/members", [row.details], row.suspended ? "Доступ к торгам приостановлен" : "Участник торгов"));
  }
  for (const row of partners) {
    docs.push(doc("partners", row.name || row.caption, `/about/partners/${row.slug}`, [row.mark, row.caption, row.kind, row.lead, row.body], row.caption, row.i18n));
  }
  return docs;
}

let cache: { at: number; docs: Doc[] } | null = null;

async function index() {
  if (!cache || Date.now() - cache.at > 60_000) cache = { at: Date.now(), docs: await buildIndex() };
  return cache.docs;
}

/** Фрагмент текста вокруг первого совпадения: сначала в русском тексте, иначе — в переводе. */
function snippet(item: Doc, words: string[]) {
  const hit = (text: string) => Math.min(...words.map((word) => normalize(text).indexOf(word)).filter((i) => i >= 0));
  const plain = Number.isFinite(hit(item.plain)) || !item.translated ? item.plain : item.translated;
  const at = hit(plain);
  if (!Number.isFinite(at)) return plain.slice(0, 140) || undefined;
  const start = Math.max(0, at - 60);
  const text = plain.slice(start, start + 180).trim();
  return `${start > 0 ? "…" : ""}${text}${start + 180 < plain.length ? "…" : ""}`;
}

export async function search(query: string, perKind: number) {
  const words = normalize(query).split(" ").filter(Boolean);
  if (!words.length) return { query, total: 0, groups: [] };

  const hits = (await index())
    .filter((item) => words.every((word) => item.key.includes(word)))
    // Документ — только если запрос задел его название («аудиторский MAIR4»), иначе «банк» выдал бы сотню отчётов банков.
    .filter((item) => item.kind !== "documents" || words.some((word) => item.titleKey.includes(word)))
    .map((item) => {
      // Выше — где совпало в заголовке, ещё выше — заголовок начинается с запроса.
      let score = words.filter((word) => item.titleKey.includes(word)).length * 10;
      if (item.titleKey.startsWith(words[0])) score += 5;
      if (item.titleKey === words.join(" ")) score += 20;
      // Совпало только в переводе (ky/en) — ниже совпадений в русском тексте.
      const ruKey = `${item.titleKey} ${normalize(item.plain)}`;
      if (!words.every((word) => ruKey.includes(word))) score -= 5;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, "ru"));

  const order: SearchKind[] = ["pages", "instruments", "members", "partners", "issuers", "listing", "news", "documents", "people"];
  const groups = order
    .map((kind) => {
      const all = hits.filter((hit) => hit.item.kind === kind);
      return {
        kind,
        label: kindLabels[kind],
        total: all.length,
        items: all.slice(0, perKind).map(({ item }) => ({
          title: item.title,
          href: item.href,
          meta: item.meta,
          snippet: item.titleKey.includes(words[0]) && item.plain.length < 40 ? undefined : snippet(item, words),
        })),
      };
    })
    .filter((group) => group.total > 0);

  return { query, total: hits.length, groups };
}
