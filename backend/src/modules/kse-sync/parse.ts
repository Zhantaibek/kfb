/**
 * Разбор страниц kse.kg в структурированные данные. Страницы собираются на их сервере:
 * часть данных — обычные HTML-таблицы, часть — JSON-массивы в <script> (let X = [...]).
 */

export const KSE_ORIGIN = "https://www.kse.kg";

const ENTITIES: Record<string, string> = {
  nbsp: " ",
  laquo: "«",
  raquo: "»",
  mdash: "—",
  ndash: "–",
  quot: '"',
  amp: "&",
  lt: "<",
  gt: ">",
  "#9650": "▲",
  "#9660": "▼",
};

export function text(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#\d+|[a-z]+);/gi, (m, code: string) =>
      ENTITIES[code.toLowerCase()] ?? (code.startsWith("#") ? String.fromCharCode(Number(code.slice(1))) : " "),
    )
    .replace(/\s+/g, " ")
    .trim();
}

/** Абсолютная ссылка (у kse.kg встречаются http:// и относительные адреса). */
export function absolute(url: string) {
  const clean = url.trim().replace(/&amp;/g, "&");
  if (!clean || clean.startsWith("#") || clean.startsWith("javascript:")) return "";
  if (clean.startsWith("//")) return `https:${clean}`;
  if (clean.startsWith("/")) return `${KSE_ORIGIN}${clean}`;
  return clean.replace(/^http:\/\/(www\.)?kse\.kg/i, KSE_ORIGIN);
}

export type Cell = { text: string; href?: string };
export type Table = { head: string[]; rows: Cell[][] };

/** Таблица → шапка (строки из <th>) и строки ячеек; у ячейки с одной ссылкой сохраняем адрес. */
export function parseTable(html: string): Table {
  const head: string[] = [];
  const rows: Cell[][] = [];
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<(t[hd])\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)];
    if (!cells.length) continue;
    if (cells.every((cell) => cell[1].toLowerCase() === "th")) {
      if (!head.length) head.push(...cells.map((cell) => text(cell[2])));
      continue;
    }
    const parsed = cells.map((cell) => {
      const links = [...cell[2].matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)];
      const href = links.length === 1 ? absolute(links[0][1]) : "";
      return href ? { text: text(cell[2]), href } : { text: text(cell[2]) };
    });
    if (parsed.some((cell) => cell.text)) rows.push(parsed);
  }
  return { head, rows };
}

export function tables(html: string) {
  return [...html.matchAll(/<table\b[\s\S]*?<\/table>/gi)].map((m) => parseTable(m[0]));
}

/** Центральная колонка страницы (без левого меню и подвала). */
export function centerBlock(html: string) {
  const start = html.indexOf('class="center_big');
  if (start < 0) throw new Error("на странице нет центрального блока");
  const end = html.indexOf("<!--/center_big-->", start);
  return html.slice(start, end > 0 ? end : undefined).replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
}

export function headings(html: string) {
  return [...html.matchAll(/<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/gi)].map((m) => text(m[1])).filter(Boolean);
}

/** JSON-массив из `let|var|const NAME = [...]` (допускаем висячие запятые, как в chartData). */
export function scriptArray<T = Record<string, unknown>>(html: string, name: string): T[] {
  const at = html.search(new RegExp(`(?:var|let|const)\\s+${name}\\s*=\\s*\\[`));
  if (at < 0) return [];
  const open = html.indexOf("[", at);
  let depth = 0;
  let inString: string | null = null;
  for (let i = open; i < html.length; i += 1) {
    const ch = html[i];
    if (inString) {
      if (ch === "\\") i += 1;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'") inString = ch;
    else if (ch === "[") depth += 1;
    else if (ch === "]" && --depth === 0) {
      const raw = html.slice(open, i + 1).replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(raw) as T[];
    }
  }
  return [];
}

/** «1 310 703» / «0.04» / «-99.7» → число; пусто или «-» → null. */
export function num(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  const clean = String(value ?? "").replace(/\s|&nbsp;/g, "").replace(",", ".");
  if (!clean || clean === "-") return null;
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : null;
}

/** «24/09/2026» → «2026-09-24». */
export function isoDate(value: string) {
  const m = value.match(/(\d{2})[./](\d{2})[./](\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : value;
}

/* ───────────── Разделы ───────────── */

/** Итоги торгов: за последний день, неделю, месяц и год — сводка по рынкам и список сделок. */
export function parseTradeResults(html: string) {
  const periods = [...html.matchAll(/<div id="tradestat_(\w+)"[^>]*>([\s\S]*?)(?=<div id="tradestat_|<!--\/center_big-->)/g)].map((m) => {
    const [summary, trades] = tables(m[2]);
    return {
      id: m[1],
      title: headings(m[2])[0] ?? "",
      summary: (summary?.rows ?? []).map((row) => ({
        label: row[0]?.text ?? "",
        value: num(row[1]?.text),
        change: num(row[2]?.text),
        direction: row[3]?.text === "▲" ? "up" : row[3]?.text === "▼" ? "down" : null,
      })),
      trades: (trades?.rows ?? []).map((row) => ({
        name: row[0]?.text ?? "",
        isin: row[1]?.text ?? "",
        symbol: row[2]?.text ?? "",
        maxPrice: num(row[3]?.text),
        minPrice: num(row[4]?.text),
        volume: num(row[5]?.text),
        deals: num(row[6]?.text),
        count: num(row[7]?.text),
      })),
    };
  });
  if (!periods.length) throw new Error("не найдены таблицы итогов торгов");
  const chart = scriptArray<{ date: string; latitude: number }>(html, "chartData").map((row) => ({ date: row.date, value: row.latitude }));
  return { periods, volumeSeries: chart };
}

/** Архив торгов: по месяцам текущего и прошлого года и по годам с 2001. */
export function parseTradeArchive(html: string) {
  const block = centerBlock(html);
  // Подразделы архива («За текущий год», «За прошлый год», «По годам») — заголовки h4.
  const parts = block.split(/<h4\b[^>]*>/i).slice(1);
  const sections = parts
    .map((part) => ({ title: text(part.split(/<\/h4>/i)[0]), table: tables(part)[0] }))
    .filter((section) => section.table?.rows.length);
  if (!sections.length) throw new Error("архив торгов пуст");
  return { sections };
}

/** Индекс KSE и капитализация: последние значения и ряды для графиков. */
export function parseIndex(html: string) {
  const block = centerBlock(html);
  const [table] = tables(block);
  const date = (table?.head[0] ?? "").match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
  const value = (label: RegExp) => num(table?.rows.find((row) => label.test(row[0]?.text ?? ""))?.[1]?.text);
  // Индекс — JSON с полем latitude; капитализация — { x: new Date(d3.timeParse('…')), y: … }.
  const scripts = html.slice(html.indexOf('class="center_big'));
  const indexSeries = scriptArray<{ date: string; latitude: number }>(scripts.slice(scripts.search(/"latitude"/) - 400), "data").map((row) => ({
    date: row.date,
    value: row.latitude,
  }));
  const capSeen = new Set<string>();
  const capSeries = [...scripts.matchAll(/d3\.timeParse\('(\d{4}-\d{2}-\d{2})'\)\)\s*,\s*y:\s*([\d.]+)/g)]
    .map((m) => ({ date: m[1], value: Math.round(Number(m[2]) / 1e4) / 100 })) // сом → млн сом
    .filter((row) => !capSeen.has(row.date) && capSeen.add(row.date))
    .reverse();
  if (value(/Индекс/i) === null) throw new Error("нет значения индекса");
  return { date, index: value(/Индекс/i), capitalization: value(/Капитализ/i), indexSeries, capSeries };
}

/** Котировки: заявки на покупку и продажу по бумагам. */
export function parseQuotes(html: string) {
  const date = headings(centerBlock(html)).find((h) => /Котировки/i.test(h))?.match(/\d{2}\.\d{2}\.\d{4}/)?.[0] ?? "";
  const rows = scriptArray<Record<string, string>>(html, "quotesData").map((row) => ({
    symbol: row.short_name,
    isin: row.isin,
    name: row.full_name,
    buyAmount: num(row.buy_amount),
    buyPrice: num(row.buy_price),
    sellAmount: num(row.sell_amount),
    sellPrice: num(row.sell_price),
  }));
  if (!rows.length) throw new Error("нет котировок");
  return { date, rows };
}

/** Простой раздел: заголовок и таблицы как есть (драгметаллы, расписание аукционов, «Финансовый рынок KG»). */
export function parseTablesPage(html: string) {
  const block = centerBlock(html);
  const found = tables(block).filter((table) => table.rows.length || table.head.length);
  if (!found.length) throw new Error("на странице нет таблиц");
  return { title: headings(block)[0] ?? "", tables: found };
}

/** Результаты аукционов ГЦБ. */
export function parseAuctionResults(html: string) {
  const rows = scriptArray<Record<string, string>>(html, "AuctionResult").map((row) => ({
    date: isoDate(row.date0),
    code: row.shortname,
    offer: num(row.pred),
    demand: num(row.s_volume),
    sold: num(row.ud_volume),
    minYield: num(row.min_profit),
    maxYield: num(row.max_profit),
    avgYield: num(row.avg_profit),
    coupon: num(row.cupontax),
  }));
  if (!rows.length) throw new Error("нет результатов аукционов");
  return { rows };
}

/** Объём ГЦБ в обращении: ГКВ и ГКО по неделям. */
export function parseVolumeGs(html: string) {
  const map = (name: string) =>
    scriptArray<{ date: string; volume: number }>(html, name).map((row) => ({ date: isoDate(row.date), volume: row.volume }));
  const gkv = map("VolumeGkv");
  const gko = map("VolumeGko");
  if (!gkv.length && !gko.length) throw new Error("нет данных об объёме ГЦБ");
  return { gkv, gko };
}

/** Аукционы по размещению средств в депозиты (JSON с их прокси). */
export function parseMfa(json: string) {
  const data = JSON.parse(json) as Array<Record<string, unknown>>;
  if (!Array.isArray(data)) throw new Error("ответ не массив");
  return {
    rows: data.map((row) => ({
      date: String(row.date ?? "").slice(0, 10),
      asset: String(row.asset ?? "").trim(),
      currency: String(row.currency ?? ""),
      termMonths: Number(row.term_month) || null,
      declared: num(row.declared_volume as number),
      demand: num(row.demand_volume as number),
      placed: num(row.placement_volume as number),
      minRate: num(row.min_rate as number),
      maxRate: num(row.max_rate as number),
      avgRate: num(row.weighted_avg_rate as number),
    })),
  };
}

/** Рейтинг участников за год. */
export function parseRating(html: string, year: number) {
  const [table] = tables(centerBlock(html));
  return { year, head: table?.head ?? [], rows: table?.rows ?? [] };
}

const SUSPENDED = /\(?\s*-?\s*\(?\s*Доступ к торгам приостановлен[^)]*\)?/i;

/** Участники торгов: брокеры и дилеры — название, контакты и пометка о приостановленном доступе. */
export function parseMembers(html: string) {
  // Адрес и телефоны лежат в скрытом блоке «Описание» внутри той же ячейки — берём ячейку целиком.
  const [table] = tables(centerBlock(html));
  const rows = (table?.rows ?? [])
    .map((row) => row[0]?.text ?? "")
    .filter(Boolean)
    .map((full) => {
      const suspended = full.match(SUSPENDED)?.[0].replace(/^[\s(-]+|[\s)]+$/g, "") ?? "";
      const rest = full.replace(SUSPENDED, " ");
      // Название — до первого признака контактов: «- », «Адрес», страна, город или индекс.
      const cut = rest.search(/\s(?:-\s|Адрес|Кыргызская Республика|КР,|г\.\s?Бишкек|\d{6})/);
      const name = (cut > 0 ? rest.slice(0, cut) : rest).replace(/[\s-]+$/, "").trim();
      const details = (cut > 0 ? rest.slice(cut) : "").replace(/^\s*-\s*/, "").replace(/\s+/g, " ").trim();
      return { name, details, suspended };
    });
  if (!rows.length) throw new Error("нет списка участников");
  return { rows };
}
