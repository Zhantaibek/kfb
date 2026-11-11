import { prisma } from "../../db/prisma";
import { oracleConfig, oracleConfigured } from "./oracle.config";
import { bishkekToday, lastTradingDay, loadDayTrades, type OracleTradesSnapshot } from "./oracle.trades";

/**
 * Синхронизация с торговой системой: раз в ORACLE_SYNC_MINUTES минут берём итоги последнего торгового дня
 * и кладём снимок в kse_snapshots (key = oracle-trades) — ту же таблицу, что и данные kse.kg, без новых моделей.
 * Если Oracle недоступна — прежний снимок остаётся, в строку пишется ошибка (как в kse-sync).
 */

export const ORACLE_TRADES_KEY = "oracle-trades";
const SOURCE_URL = "oracle://TS.DEAL";

let running: Promise<SyncResult> | null = null;

export type SyncResult = { ok: true; date: string; trades: number; deals: number } | { ok: false; error: string };

async function syncOnce(): Promise<SyncResult> {
  const now = new Date();
  try {
    const day = await lastTradingDay(bishkekToday(now));
    if (!day) throw new Error("в торговой системе нет сделок");
    const snapshot = await loadDayTrades(day);
    await prisma.kseSnapshot.upsert({
      where: { key: ORACLE_TRADES_KEY },
      create: { key: ORACLE_TRADES_KEY, data: snapshot, sourceUrl: SOURCE_URL, fetchedAt: now, checkedAt: now, error: null },
      update: { data: snapshot, sourceUrl: SOURCE_URL, fetchedAt: now, checkedAt: now, error: null },
    });
    return { ok: true, date: day, trades: snapshot.trades.length, deals: snapshot.totals.deals };
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).slice(0, 300);
    // Данные не трогаем — только отмечаем неудачную попытку.
    await prisma.kseSnapshot.updateMany({ where: { key: ORACLE_TRADES_KEY }, data: { checkedAt: now, error: message } });
    return { ok: false, error: message };
  }
}

/** Одна синхронизация; повторный вызов во время работы ждёт текущую, а не запускает вторую. */
export function syncOracleTrades() {
  running ??= syncOnce().finally(() => {
    running = null;
  });
  return running;
}

export async function readOracleTrades() {
  const row = await prisma.kseSnapshot.findUnique({ where: { key: ORACLE_TRADES_KEY } });
  if (!row) return null;
  return {
    data: row.data as OracleTradesSnapshot,
    fetchedAt: row.fetchedAt.toISOString(),
    checkedAt: row.checkedAt.toISOString(),
    error: row.error,
  };
}

export function oracleSyncStatus() {
  return { enabled: oracleConfig.enabled, configured: oracleConfigured(), intervalMinutes: oracleConfig.intervalMs / 60_000 };
}

/** Запуск при старте бэкенда, если ORACLE_SYNC=on, и далее по расписанию. */
export function startOracleSync() {
  if (!oracleConfig.enabled) return;
  if (!oracleConfigured()) {
    console.warn("Oracle sync: ORACLE_SYNC=on, но в .env нет ORACLE_DB_HOST / SID / USER — синхронизация не запущена");
    return;
  }
  const run = () =>
    void syncOracleTrades().then((result) => {
      if (!result.ok) console.warn(`Oracle sync: ${result.error}`);
    });
  setTimeout(run, 5_000);
  setInterval(run, oracleConfig.intervalMs).unref();
}
