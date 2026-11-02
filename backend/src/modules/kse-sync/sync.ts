import { prisma } from "../../db/prisma";
import {
  KSE_ORIGIN,
  parseAuctionResults,
  parseIndex,
  parseMembers,
  parseMfa,
  parseQuotes,
  parseRating,
  parseTablesPage,
  parseTradeArchive,
  parseTradeResults,
  parseVolumeGs,
} from "./parse";

/**
 * Живые данные с kse.kg: раз в 15 минут забираем разделы, разбираем и кладём в kse_snapshots.
 * Если kse.kg недоступен или страница поменялась — оставляем прежний снимок и пишем ошибку.
 */

const INTERVAL_MS = 15 * 60 * 1000;
const TIMEOUT_MS = 25_000;

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (KSE site sync)" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

type Source = { key: string; url: string; load: () => Promise<unknown> };

const page = (slug: string) => `${KSE_ORIGIN}/ru/${slug}`;

export const sources: Source[] = [
  { key: "trade-results", url: page("TradeResults"), load: async () => parseTradeResults(await fetchText(page("TradeResults"))) },
  { key: "trade-archive", url: page("TradeArchive"), load: async () => parseTradeArchive(await fetchText(page("TradeArchive"))) },
  { key: "index", url: page("IndexAndCapitalization"), load: async () => parseIndex(await fetchText(page("IndexAndCapitalization"))) },
  { key: "quotes", url: page("Quotes"), load: async () => parseQuotes(await fetchText(page("Quotes"))) },
  { key: "quotes-metals", url: page("QuotesGold"), load: async () => parseTablesPage(await fetchText(page("QuotesGold"))) },
  { key: "auction-schedule", url: page("ScheduleGS"), load: async () => parseTablesPage(await fetchText(page("ScheduleGS"))) },
  { key: "auction-results", url: page("AuctionResult"), load: async () => parseAuctionResults(await fetchText(page("AuctionResult"))) },
  { key: "volume-gs", url: page("VolumeGs"), load: async () => parseVolumeGs(await fetchText(page("VolumeGs"))) },
  {
    key: "deposit-auctions",
    url: page("MfaResult"),
    load: async () => parseMfa(await fetchText(`${KSE_ORIGIN}/views/kse/templates/modules/MfaResult/mfa_proxy.php`)),
  },
  {
    key: "members-rating",
    url: page("MembersRating"),
    // Рейтинг за текущий год обычно пуст до конца года — берём последний год, где он есть.
    load: async () => {
      const now = new Date().getFullYear();
      for (let year = now; year >= now - 5; year -= 1) {
        const rating = parseRating(await fetchText(year === now ? page("MembersRating") : `${page("MembersRating")}/${year}`), year);
        if (rating.rows.length) return rating;
      }
      throw new Error("рейтинг пуст за последние годы");
    },
  },
  { key: "finmarket", url: page("FinMarket"), load: async () => parseTablesPage(await fetchText(page("FinMarket"))) },
  { key: "members", url: page("Members"), load: async () => parseMembers(await fetchText(page("Members"))) },
];

export const snapshotKeys = sources.map((source) => source.key);

async function syncOne(source: Source) {
  const now = new Date();
  try {
    const data = (await source.load()) as object;
    await prisma.kseSnapshot.upsert({
      where: { key: source.key },
      create: { key: source.key, data, sourceUrl: source.url, fetchedAt: now, checkedAt: now, error: null },
      update: { data, sourceUrl: source.url, fetchedAt: now, checkedAt: now, error: null },
    });
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Данные не трогаем — только отмечаем неудачную попытку.
    await prisma.kseSnapshot.updateMany({ where: { key: source.key }, data: { checkedAt: now, error: message.slice(0, 300) } });
    return `${source.key}: ${message}`;
  }
}

let running = false;

export async function syncAll() {
  if (running) return;
  running = true;
  try {
    // По очереди, чтобы не нагружать kse.kg параллельными запросами.
    const errors: string[] = [];
    for (const source of sources) {
      const error = await syncOne(source);
      if (error) errors.push(error);
    }
    if (errors.length) console.warn(`kse.kg sync: ${errors.length} ошибок — ${errors.join("; ")}`);
  } finally {
    running = false;
  }
}

/** Запуск при старте бэкенда и далее раз в 15 минут. KSE_SYNC=off — выключить (например, без интернета). */
export function startKseSync() {
  if (process.env.KSE_SYNC === "off") return;
  setTimeout(() => void syncAll(), 3_000);
  setInterval(() => void syncAll(), INTERVAL_MS).unref();
}

/** Снимок считается устаревшим, если 2 часа (8 циклов подряд) не удаётся его обновить. */
const STALE_MS = 2 * 60 * 60 * 1000;

/**
 * Свежесть данных торгов для мониторинга (/api/health/market): при поломке парсера или недоступности kse.kg
 * снимки перестают обновляться, а сайт продолжает показывать последние — без этой проверки никто не заметит.
 */
export async function marketDataHealth() {
  if (process.env.KSE_SYNC === "off") return { status: "off" as const, stale: [] };
  const rows = await prisma.kseSnapshot.findMany({ select: { key: true, fetchedAt: true, error: true } });
  const now = Date.now();
  const stale = snapshotKeys
    .map((key) => {
      const row = rows.find((item) => item.key === key);
      if (!row) return { key, fetchedAt: null, error: "снимка нет" };
      if (now - row.fetchedAt.getTime() > STALE_MS) return { key, fetchedAt: row.fetchedAt.toISOString(), error: row.error };
      return null;
    })
    .filter((item) => item !== null);
  // Раскрытие информации обходится раз в 6 часов: устаревшим считаем после двух пропущенных прогонов.
  // Строки ещё нет — первый прогон не закончился (идёт ~4 минуты после старта), это не сбой.
  const disclosure = rows.find((item) => item.key === "disclosure");
  if (process.env.DISCLOSURE_SYNC !== "off" && disclosure && now - disclosure.fetchedAt.getTime() > DISCLOSURE_STALE_MS) {
    stale.push({ key: "disclosure", fetchedAt: disclosure.fetchedAt.toISOString(), error: disclosure.error });
  }
  return { status: stale.length ? ("stale" as const) : ("ok" as const), stale };
}

const DISCLOSURE_STALE_MS = 13 * 60 * 60 * 1000;

export async function readSnapshot(key: string) {
  return prisma.kseSnapshot.findUnique({ where: { key } });
}
