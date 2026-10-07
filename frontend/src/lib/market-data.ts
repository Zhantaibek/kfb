import * as demo from "@/data/catalog";
import type { Instrument, InstrumentType } from "@/data/catalog";
import { loadSnapshot, type IndexData, type Quotes, type TablesPage, type TradeResults } from "@/lib/kse-live";

/**
 * Данные рынка для главной, бегущей строки и подвала. Собираются на сервере из снимков kse.kg
 * в тех же формах, что и демо-каталог (data/catalog.ts), — поэтому блоки сайта почти не меняются.
 * Нет снимков (kse.kg ещё не синхронизирован или недоступен) — отдаём демо-каталог.
 */

export type TradeRow = { ticker: string; name: string; price: number; volume: number; deals: number };
export type Auction = { date: string; type: string; volume: string; status: string };

export type MarketData = {
  /** true — настоящие данные kse.kg, false — демо. */
  live: boolean;
  fetchedAt?: string;
  sessionDate: string;
  sessionHours: string;
  index: { value: number; change: number; capitalization: number };
  /** date — «дд-мм-гггг», cap — млрд сом. */
  indexHistory: { date: string; index: number; cap: number }[];
  tradingRows: { label: string; value: number; change: number }[];
  stats: { volumeMln: number; volumeChange: number; trades: number };
  instruments: Instrument[];
  auctions: Auction[];
  /** Сделки последней сессии и лидеры недели по объёму (только в живых данных). */
  lastTrades: TradeRow[];
  weekLeaders: TradeRow[];
};

export const demoMarket: MarketData = {
  live: false,
  sessionDate: demo.sessionDate,
  sessionHours: demo.sessionHours,
  index: demo.indexKse,
  indexHistory: demo.indexHistory,
  tradingRows: demo.tradingRows.map((row) => ({ ...row })),
  stats: { volumeMln: demo.stats.volumeMln, volumeChange: demo.stats.volumeChange, trades: demo.stats.trades },
  instruments: demo.instruments,
  auctions: demo.auctions,
  lastTrades: [],
  weekLeaders: [],
};

/** Вид бумаги по названию из котировок kse.kg. */
function typeOf(symbol: string, name: string): InstrumentType {
  const text = name.toLowerCase();
  if (/^(gkv|gko|gd|gba|gcb)/i.test(symbol) || /гкв|гко|казначейск/.test(text)) return "gcb";
  if (/золот|серебр|металл/.test(text)) return "metal";
  if (/облигац/.test(text)) return "bond";
  return "stock";
}

/** «ОАО Аэропорты Кыргызстана, акция простая» → компания и вид бумаги. */
function splitName(full: string) {
  const at = full.lastIndexOf(",");
  return at > 0 ? { company: full.slice(0, at).trim(), kind: full.slice(at + 1).trim() } : { company: full, kind: "" };
}

/** «06.10.2026» / «2026-10-06» → «06-10-2026» (формат demo.indexHistory). */
function dashDate(value: string) {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;
  return value.replace(/\./g, "-");
}

function toTradeRows(trades: TradeResults["periods"][number]["trades"]): TradeRow[] {
  return trades.map((row) => ({
    ticker: row.symbol,
    name: splitName(row.name).company,
    price: row.maxPrice ?? 0,
    volume: row.volume ?? 0,
    deals: row.deals ?? 0,
  }));
}

export async function loadMarketData(): Promise<MarketData> {
  const [trades, index, quotes, schedule] = await Promise.all([
    loadSnapshot<TradeResults>("trade-results"),
    loadSnapshot<IndexData>("index"),
    loadSnapshot<Quotes>("quotes"),
    loadSnapshot<TablesPage>("auction-schedule"),
  ]);
  if (!trades || !index || !quotes) return demoMarket;

  const last = trades.data.periods.find((period) => period.id === "last") ?? trades.data.periods[0];
  const week = trades.data.periods.find((period) => period.id === "week");
  const summary = (label: RegExp) => last?.summary.find((row) => label.test(row.label));
  const volume = summary(/Объем|Объём/i);

  // Индекс: последнее значение и изменение к предыдущей точке ряда.
  const series = index.data.indexSeries;
  const prev = series.at(-2)?.value;
  const value = index.data.index ?? series.at(-1)?.value ?? 0;
  const capByDate = new Map(index.data.capSeries.map((row) => [row.date, row.value]));
  const capMlrd = (index.data.capitalization ?? 0) / 1000;

  // Цена бумаги: последняя сделка за неделю, иначе — лучшая заявка на продажу или покупку.
  const traded = new Map<string, { price: number; volume: number }>();
  for (const row of week?.trades ?? []) {
    const known = traded.get(row.symbol);
    traded.set(row.symbol, { price: known?.price ?? row.maxPrice ?? 0, volume: (known?.volume ?? 0) + (row.volume ?? 0) });
  }
  const instruments: Instrument[] = quotes.data.rows.map((row) => {
    const { company, kind } = splitName(row.name);
    const deal = traded.get(row.symbol);
    return {
      ticker: row.symbol,
      name: company,
      issuer: company,
      type: typeOf(row.symbol, row.name),
      price: deal?.price || row.sellPrice || row.buyPrice || 0,
      change: 0, // kse.kg не публикует изменение цены по бумаге
      volume: deal?.volume ?? 0,
      listing: "B",
      description: kind,
    };
  });

  const auctions: Auction[] = (schedule?.data.tables[0]?.rows ?? [])
    .filter((row) => /\d{2}\s*\.\d{2}\.\d{4}/.test(row[0]?.text ?? ""))
    .map((row) => ({
      date: (row[0]?.text ?? "").replace(/\s+/g, ""),
      type: row[2]?.text ?? "",
      volume: `${row[4]?.text ?? ""} млн сом`,
      status: "Планируется",
    }));

  return {
    live: true,
    fetchedAt: trades.fetchedAt,
    sessionDate: (last?.title.match(/\d{2}\.\d{2}\.\d{4}/)?.[0] ?? demo.sessionDate),
    sessionHours: demo.sessionHours,
    index: { value, change: prev ? ((value - prev) / prev) * 100 : 0, capitalization: Math.round(capMlrd * 10) / 10 },
    indexHistory: series.map((row) => ({
      date: dashDate(row.date),
      index: row.value,
      cap: Math.round(((capByDate.get(row.date) ?? index.data.capitalization ?? 0) / 1000) * 10) / 10,
    })),
    tradingRows: (last?.summary ?? []).map((row) => ({ label: row.label, value: row.value ?? 0, change: row.change ?? 0 })),
    stats: {
      volumeMln: volume?.value ?? 0,
      volumeChange: volume?.change ?? 0,
      trades: (last?.trades ?? []).reduce((sum, row) => sum + (row.deals ?? 0), 0),
    },
    instruments,
    auctions,
    lastTrades: toTradeRows(last?.trades ?? []),
    weekLeaders: toTradeRows(week?.trades ?? []).sort((a, b) => b.volume - a.volume).slice(0, 5),
  };
}

/** Куда ведёт тикер: для живых данных — котировки с поиском по нему, для демо — демо-страница бумаги. */
export function instrumentHref(market: Pick<MarketData, "live">, ticker: string) {
  return market.live ? `/market/quotes?q=${encodeURIComponent(ticker)}` : `/market/${ticker}`;
}
