import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { queryOracle } from "./oracle.service";

/**
 * Котировки по ценным бумагам — лучшие заявки на покупку и продажу (то, что старый сайт хранил в mod_quotes).
 *
 * Запрос повторяет cron/quotes_update.php старого сайта (только чтение): бумаги — ts.ts_currinstrument_arcts,
 * заявки — ts.orders; учитываются заявки от 1000 сом (volume × price). Покупка — максимальная цена и объём по ней,
 * продажа — минимальная цена и остаток объёма по ней. Бумаги без заявок не попадают.
 * ГЦБ старый сайт брал не из Oracle, а из ATS (ats.kse.kg) — здесь их нет; вид бумаги определяется по названию.
 */
const QUOTES_SQL = `select * from (
 select tc.shortname as name, tc.namerus, tc.extcode as isin,
  (select max(to_number(ts.makeb(www.dot(round(price,4)), direct))) from ts.orders t where t.ownid=tc.ords_id and t.volume*t.price >= 1000) as b,
  (select sum(volume) from ts.orders t where t.ownid=tc.ords_id and t.volume*t.price >= 1000 and t.price=(select max(to_number(ts.makeb(price, direct))) from ts.orders t where t.ownid=tc.ords_id and t.volume*t.price >= 1000)) as bv,
  (select min(to_number(ts.makes(www.dot(round(price,4)), direct))) from ts.orders t where t.ownid=tc.ords_id and t.volume*t.price >= 1000) as s,
  (select sum(volrest) from ts.orders t where t.ownid=tc.ords_id and t.volume*t.price >= 1000 and t.price=(select min(to_number(ts.makes(price, direct))) from ts.orders t where t.ownid=tc.ords_id and t.volume*t.price >= 1000)) as sv
 from ts.ts_currinstrument_arcts tc)
where b is not null or s is not null`;

export const ORACLE_QUOTES_KEY = "oracle-quotes";

export type QuoteKind = "stock" | "bond" | "gcb";

export type OracleQuote = {
  symbol: string;
  isin: string;
  /** «ОАО Аэропорты Кыргызстана, акция простая» — как в торговой системе. */
  name: string;
  kind: QuoteKind;
  buyAmount: number | null;
  buyPrice: number | null;
  sellAmount: number | null;
  sellPrice: number | null;
};

export type OracleQuotesSnapshot = { date: string; rows: OracleQuote[] };

/** Вид бумаги по названию и коду: облигации, ГЦБ (ГКО/ГКВ/ноты) или акции. */
export function quoteKind(symbol: string, name: string): QuoteKind {
  const text = name.toLowerCase();
  if (/гцб|гко|гкв|казначейск|\bнот[аы]\b/.test(text) || /^(gko|gkv|gba|gd)/i.test(symbol)) return "gcb";
  if (/облигац/.test(text)) return "bond";
  return "stock";
}

const num = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export async function loadQuotes(): Promise<OracleQuote[]> {
  const rows = await queryOracle(QUOTES_SQL, [], 0, 2 * 60 * 1000);
  return rows
    .map((row) => {
      const symbol = String(row.NAME ?? "").trim();
      const name = String(row.NAMERUS ?? "").trim();
      return {
        symbol,
        isin: String(row.ISIN ?? "").trim(),
        name,
        kind: quoteKind(symbol, name),
        buyAmount: num(row.BV),
        buyPrice: num(row.B),
        sellAmount: num(row.SV),
        sellPrice: num(row.S),
      };
    })
    .filter((row) => row.symbol)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

const decimal = (value: number | null) => (value === null ? null : new Prisma.Decimal(value));

/**
 * Забрать котировки и сохранить: таблица quotes (по бумаге, ключ — symbol; бумаги без заявок удаляются, как в старом
 * mod_quotes) и снимок kse_snapshots (key = oracle-quotes) с названиями и видом бумаги — его читает страница котировок.
 */
export async function syncQuotes(now = new Date()) {
  const rows = await loadQuotes();
  const snapshot: OracleQuotesSnapshot = { date: now.toISOString(), rows };
  await prisma.$transaction([
    prisma.quote.deleteMany({ where: { symbol: { notIn: rows.map((row) => row.symbol) } } }),
    ...rows.map((row) => {
      const data = {
        isin: row.isin,
        buyAmount: decimal(row.buyAmount),
        buyPrice: decimal(row.buyPrice),
        sellAmount: decimal(row.sellAmount),
        sellPrice: decimal(row.sellPrice),
        updatedAt: now,
      };
      return prisma.quote.upsert({ where: { symbol: row.symbol }, create: { id: randomUUID(), symbol: row.symbol, ...data }, update: data });
    }),
    prisma.kseSnapshot.upsert({
      where: { key: ORACLE_QUOTES_KEY },
      create: { key: ORACLE_QUOTES_KEY, data: snapshot, sourceUrl: "oracle://TS.ORDERS", fetchedAt: now, checkedAt: now, error: null },
      update: { data: snapshot, sourceUrl: "oracle://TS.ORDERS", fetchedAt: now, checkedAt: now, error: null },
    }),
  ]);
  return { quotes: rows.length };
}

export async function readOracleQuotes() {
  const row = await prisma.kseSnapshot.findUnique({ where: { key: ORACLE_QUOTES_KEY } });
  if (!row) return null;
  return { data: row.data as OracleQuotesSnapshot, fetchedAt: row.fetchedAt.toISOString(), error: row.error };
}
