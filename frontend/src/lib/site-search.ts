import { sectionPages } from "@/data/site-nav";

/**
 * Поиск по сайту. Всё, что в базе (страницы, новости, эмитенты, листинг, документы, руководство, курсы),
 * ищет бэкенд: GET /api/public/search. Здесь — то, что пока живёт в коде фронтенда
 * (партнёры, встроенные разделы), и склейка обоих ответов. Котировки и участники торгов — живые данные kse.kg, их ищет бэкенд.
 */

export type SearchItem = { title: string; href: string; meta?: string; snippet?: string };
export type SearchGroup = { kind: string; label: string; total: number; items: SearchItem[] };
export type SearchResult = { query: string; total: number; groups: SearchGroup[] };

/** Порядок групп в выдаче. */
const ORDER = ["pages", "instruments", "issuers", "listing", "news", "documents", "people", "members", "partners", "courses"];

/** Как на бэкенде: регистр, «ё», кавычки и лишние пробелы не важны. */
export function normalizeQuery(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[«»"'`„“”]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type StaticDoc = { kind: string; title: string; href: string; meta?: string; text: string };

const LABELS: Record<string, string> = {
  pages: "Разделы и страницы",
};

const staticDocs: StaticDoc[] = [
  ...Object.entries(sectionPages).map(([href, page]) => ({
    kind: "pages",
    title: page.title,
    href,
    text: [page.title, page.lead, ...page.body, ...(page.links ?? []).map((link) => link.label)].join(" "),
  })),
].map((item) => ({ ...item, text: normalizeQuery(item.text) }));

export function searchStatic(query: string, perKind: number): SearchResult {
  const words = normalizeQuery(query).split(" ").filter(Boolean);
  if (!words.length) return { query, total: 0, groups: [] };
  const hits = staticDocs.filter((item) => words.every((word) => item.text.includes(word)));
  const groups = Object.keys(LABELS)
    .map((kind) => {
      const all = hits.filter((item) => item.kind === kind);
      return {
        kind,
        label: LABELS[kind],
        total: all.length,
        items: all.slice(0, perKind).map(({ title, href, meta }) => ({ title, href, meta })),
      };
    })
    .filter((group) => group.total > 0);
  return { query, total: hits.length, groups };
}

/** Ответ бэкенда + данные из кода; одинаковые разделы (по адресу) не повторяются. */
export function mergeResults(remote: SearchResult | null, local: SearchResult, perKind: number): SearchResult {
  const byKind = new Map<string, SearchGroup>();
  for (const group of [...(remote?.groups ?? []), ...local.groups]) {
    const current = byKind.get(group.kind);
    if (!current) {
      byKind.set(group.kind, { ...group, items: [...group.items] });
      continue;
    }
    const known = new Set(current.items.map((item) => item.href));
    const fresh = group.items.filter((item) => !known.has(item.href));
    current.items = [...current.items, ...fresh].slice(0, perKind);
    current.total += fresh.length;
  }
  const groups = [...byKind.values()].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
  return { query: local.query, total: groups.reduce((sum, group) => sum + group.total, 0), groups };
}

/** Документы листинга — внешние PDF; остальное — страницы сайта. */
export function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}
