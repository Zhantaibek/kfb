/**
 * Живые данные с kse.kg — бэкенд забирает их раз в 15 минут (modules/kse-sync) и отдаёт снимками:
 * GET /api/public/market/:key. Здесь — загрузка на сервере Next и типы разделов.
 */

const apiUrl = process.env.API_URL ?? "http://localhost:4000";

export type Snapshot<T> = { key: string; data: T; fetchedAt: string; sourceUrl: string; stale: boolean };

export async function loadSnapshot<T>(key: string): Promise<Snapshot<T> | null> {
  try {
    const response = await fetch(`${apiUrl}/api/public/market/${key}`, { cache: "no-store" });
    return response.ok ? ((await response.json()) as Snapshot<T>) : null;
  } catch {
    return null;
  }
}

export type Cell = { text: string; href?: string };
export type Table = { head: string[]; rows: Cell[][] };

export type TradePeriod = {
  id: string;
  title: string;
  summary: { label: string; value: number | null; change: number | null; direction: "up" | "down" | null }[];
  trades: {
    name: string;
    isin: string;
    symbol: string;
    maxPrice: number | null;
    minPrice: number | null;
    volume: number | null;
    deals: number | null;
    count: number | null;
  }[];
};
export type TradeResults = { periods: TradePeriod[]; volumeSeries: { date: string; value: number }[] };
export type TradeArchive = { sections: { title: string; table: Table }[] };
export type IndexData = {
  date: string;
  index: number | null;
  capitalization: number | null;
  indexSeries: { date: string; value: number }[];
  capSeries: { date: string; value: number }[];
};
export type Quotes = {
  date: string;
  rows: {
    symbol: string;
    isin: string;
    name: string;
    /** Вид бумаги (в котировках из торговой системы): акции, облигации, ГЦБ. */
    kind?: "stock" | "bond" | "gcb";
    buyAmount: number | null;
    buyPrice: number | null;
    sellAmount: number | null;
    sellPrice: number | null;
  }[];
};
export type TablesPage = { title: string; tables: Table[] };
export type AuctionResults = {
  rows: {
    date: string;
    code: string;
    offer: number | null;
    demand: number | null;
    sold: number | null;
    minYield: number | null;
    maxYield: number | null;
    avgYield: number | null;
    coupon: number | null;
  }[];
};
export type VolumeGs = { gkv: { date: string; volume: number }[]; gko: { date: string; volume: number }[] };
export type DepositAuctions = {
  rows: {
    date: string;
    asset: string;
    currency: string;
    termMonths: number | null;
    declared: number | null;
    demand: number | null;
    placed: number | null;
    minRate: number | null;
    maxRate: number | null;
    avgRate: number | null;
  }[];
};
export type MembersRating = { year: number; head: string[]; rows: Cell[][] };
export type Members = { rows: { name: string; details: string; suspended: string }[] };

const numberFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

/** 1234567.5 → «1 234 567,5»; пусто → «—». */
export function fmt(value: number | null | undefined, digits?: number) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return digits === undefined
    ? numberFormat.format(value)
    : value.toLocaleString("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

type ChartPoint = { date: string; value: number };
/** index / capitalization — 12 месяцев, максимум за месяц; daily — по дням за ~13 месяцев; allMonthly — максимум за месяц за всю историю. Даты — ГГГГ-ММ-ДД. */
export type IndexChart = {
  index: ChartPoint[];
  capitalization: ChartPoint[];
  daily?: ChartPoint[];
  allMonthly?: ChartPoint[];
  /** Капитализация, млн сом: по дням и максимум за месяц за всю историю. */
  capDaily?: ChartPoint[];
  capAllMonthly?: ChartPoint[];
};

/**
 * Точки графиков индекса и капитализации за 12 месяцев — максимум за каждый месяц, как на главной kse.kg.
 * Считаются по нашей базе (история из торговой системы); недоступно — null, страница покажет снимок kse.kg.
 */
export async function loadIndexChart(): Promise<IndexChart | null> {
  try {
    const response = await fetch(`${apiUrl}/api/public/oracle/index-chart`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as IndexChart;
    return data.index.length > 1 ? data : null;
  } catch {
    return null;
  }
}

/**
 * Котировки по ценным бумагам из торговой системы (Oracle, обновляются синхронизацией моста) — лучшие заявки
 * на покупку и продажу с видом бумаги. Нет данных или API недоступен — null.
 */
export async function loadOracleQuotes(): Promise<{ data: Quotes; fetchedAt: string } | null> {
  try {
    const response = await fetch(`${apiUrl}/api/public/oracle/quotes`, { cache: "no-store" });
    return response.ok ? ((await response.json()) as { data: Quotes; fetchedAt: string }) : null;
  } catch {
    return null;
  }
}

/** Участники торгов из нашей базы (business_catalog — перенесено из бэкапа старого сайта). Недоступно — null. */
export async function loadMembers(): Promise<Members | null> {
  try {
    const response = await fetch(`${apiUrl}/api/public/members`, { cache: "no-store" });
    return response.ok ? ((await response.json()) as Members) : null;
  } catch {
    return null;
  }
}

/** Результаты аукционов ГЦБ из нашей базы (заполняется мостом из аукционной системы Oracle). Недоступно — null. */
export async function loadGcbAuctions(): Promise<AuctionResults | null> {
  try {
    const response = await fetch(`${apiUrl}/api/public/oracle/auctions`, { cache: "no-store" });
    return response.ok ? ((await response.json()) as AuctionResults) : null;
  } catch {
    return null;
  }
}

/** Архивная новость старого сайта для главной: открывается по url на kse.kg. Дата — ГГГГ-ММ-ДД. */
export type ArchiveNews = { slug: string; date: string; title: string; tag: string; url: string; company: string };
export type ArchiveLatest = Record<"ru" | "ky" | "en", { exchange: ArchiveNews[]; company: ArchiveNews[]; urgent: ArchiveNews[] }>;

/**
 * Свежие новости архива старого сайта на всех языках сайта — для главной, где они смешиваются по дате
 * с новостями из админки. Недоступно — пустые списки (на главной останутся новости из админки).
 */
export async function loadArchiveLatest(): Promise<ArchiveLatest> {
  const get = async (lang: string, kind: "exchange" | "company" | "urgent") => {
    try {
      const response = await fetch(`${apiUrl}/api/public/news/archive/latest?lang=${lang}&kind=${kind}&limit=7`, { cache: "no-store" });
      return response.ok ? ((await response.json()) as ArchiveNews[]) : [];
    } catch {
      return [];
    }
  };
  const langs = ["ru", "ky", "en"] as const;
  const lists = await Promise.all(langs.flatMap((lang) => [get(lang, "exchange"), get(lang, "company"), get(lang, "urgent")]));
  return Object.fromEntries(
    langs.map((lang, i) => [lang, { exchange: lists[i * 3], company: lists[i * 3 + 1], urgent: lists[i * 3 + 2] }]),
  ) as ArchiveLatest;
}

/** Объём торгов в млн сом — как в источнике, до 4 знаков (0,0676, а не 0,07). */
export function fmtVolume(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("ru-RU", { maximumFractionDigits: 4 });
}

/** «2026-09-24» → «24.09.2026». */
export function fmtDate(iso: string) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}
