import { queryOracle, type OracleRow } from "./oracle.service";

/**
 * Итоги торгов из торговой системы (Oracle 8i, схемы TS и ARCTS).
 *
 * Как устроены данные (проверено на базе биржи):
 *  - TS.DEAL — текущие сделки, ARCTS.DEAL — архив; колонки одинаковые. Одна сделка — две строки (по стороне
 *    покупателя и продавца) с общим SERIAL, поэтому сделки берутся без повторов по SERIAL;
 *  - DATE0 — дата в формате функции TS.MAKELONGDATE: год × 65536 + месяц × 256 + день;
 *  - бумага — TS.CURRINSTRUMENT, связь ci.DEALS_ID = deal.OWNID; EXTCODE — ISIN, SHORTNAME — тикер,
 *    NAMERUS — название; VOLUME — количество бумаг, VOLCONTR — сумма сделки в валюте инструмента.
 */

/** «2026-11-11» → 132778763 (как TS.MAKELONGDATE). */
export function encodeLongDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return year * 65536 + month * 256 + day;
}

/** 132778763 → «2026-11-11». */
export function decodeLongDate(value: number) {
  const year = Math.floor(value / 65536);
  const month = Math.floor((value % 65536) / 256);
  const day = value % 256;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Сегодняшняя дата по времени Бишкека (торговый день биржи), «ГГГГ-ММ-ДД». */
export function bishkekToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bishkek" }).format(now);
}

export type OracleTrade = {
  isin: string;
  symbol: string;
  name: string;
  /** Число сделок. */
  deals: number;
  /** Количество бумаг. */
  count: number;
  /** Сумма сделок в валюте инструмента. */
  volume: number;
  minPrice: number;
  maxPrice: number;
  openPrice: number;
  lastPrice: number;
};

export type OracleTradesSnapshot = {
  date: string;
  trades: OracleTrade[];
  totals: { deals: number; count: number; volume: number };
};

const num = (value: string | null | undefined) => (value === null || value === undefined || value === "" ? 0 : Number(value));
// Суммы с плавающей точкой из Oracle (FLOAT) округляем до тыйына.
const round = (value: number) => Math.round(value * 100) / 100;

/** Сделки дня (строки моста) → итоги по бумагам, по убыванию суммы. Повторы по SERIAL отбрасываются. */
export function aggregateTrades(date: string, rows: OracleRow[]): OracleTradesSnapshot {
  const bySerial = new Map<string, OracleRow>();
  for (const row of rows) if (row.SERIAL && !bySerial.has(row.SERIAL)) bySerial.set(row.SERIAL, row);

  const groups = new Map<string, { trade: OracleTrade; firstSerial: number; lastSerial: number }>();
  for (const row of bySerial.values()) {
    const key = row.OWNID ?? "";
    const serial = num(row.SERIAL);
    const price = num(row.PRICE);
    const group = groups.get(key);
    if (!group) {
      groups.set(key, {
        trade: {
          isin: (row.EXTCODE ?? "").trim(),
          symbol: (row.SHORTNAME ?? "").trim(),
          name: (row.NAMERUS ?? "").trim() || `Инструмент ${key}`,
          deals: 1,
          count: num(row.VOLUME),
          volume: num(row.VOLCONTR),
          minPrice: price,
          maxPrice: price,
          openPrice: price,
          lastPrice: price,
        },
        firstSerial: serial,
        lastSerial: serial,
      });
      continue;
    }
    const trade = group.trade;
    trade.deals += 1;
    trade.count += num(row.VOLUME);
    trade.volume += num(row.VOLCONTR);
    trade.minPrice = Math.min(trade.minPrice, price);
    trade.maxPrice = Math.max(trade.maxPrice, price);
    if (serial < group.firstSerial) {
      group.firstSerial = serial;
      trade.openPrice = price;
    }
    if (serial > group.lastSerial) {
      group.lastSerial = serial;
      trade.lastPrice = price;
    }
  }

  const trades = [...groups.values()]
    .map(({ trade }) => ({
      ...trade,
      volume: round(trade.volume),
      minPrice: round(trade.minPrice),
      maxPrice: round(trade.maxPrice),
      openPrice: round(trade.openPrice),
      lastPrice: round(trade.lastPrice),
    }))
    .sort((a, b) => b.volume - a.volume);
  return {
    date,
    trades,
    totals: {
      deals: trades.reduce((sum, trade) => sum + trade.deals, 0),
      count: trades.reduce((sum, trade) => sum + trade.count, 0),
      volume: round(trades.reduce((sum, trade) => sum + trade.volume, 0)),
    },
  };
}

/** Последний день со сделками не позже указанной даты (сегодня торгов может ещё не быть). */
export async function lastTradingDay(onOrBefore: string) {
  const code = encodeLongDate(onOrBefore);
  const [row] = await queryOracle(
    "SELECT MAX(DATE0) AS LAST_DAY FROM (SELECT DATE0 FROM TS.DEAL WHERE DATE0 <= ? UNION ALL SELECT DATE0 FROM ARCTS.DEAL WHERE DATE0 <= ?)",
    [code, code],
  );
  return row?.LAST_DAY ? decodeLongDate(Number(row.LAST_DAY)) : null;
}

/** Итоги торгов за день: сделки из текущей и архивной таблиц (без повторов по SERIAL) с названиями бумаг. */
export async function loadDayTrades(date: string) {
  const code = encodeLongDate(date);
  const rows = await queryOracle(
    "SELECT t.SERIAL, t.OWNID, t.PRICE, t.VOLUME, t.VOLCONTR, ci.EXTCODE, ci.SHORTNAME, ci.NAMERUS " +
      "FROM (SELECT DISTINCT SERIAL, OWNID, PRICE, VOLUME, VOLCONTR FROM TS.DEAL WHERE DATE0 = ? " +
      "UNION SELECT DISTINCT SERIAL, OWNID, PRICE, VOLUME, VOLCONTR FROM ARCTS.DEAL WHERE DATE0 = ?) t, TS.CURRINSTRUMENT ci " +
      "WHERE ci.DEALS_ID (+) = t.OWNID",
    [code, code],
  );
  return aggregateTrades(date, rows);
}
