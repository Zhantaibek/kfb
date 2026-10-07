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

/** «2026-09-24» → «24.09.2026». */
export function fmtDate(iso: string) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}
