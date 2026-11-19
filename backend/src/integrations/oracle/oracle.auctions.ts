import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { queryOracle } from "./oracle.service";
import { decodeLongDate, encodeLongDate } from "./oracle.trades";

/**
 * Результаты аукционов ГЦБ (таблица gcb_auctions, бывшая mod_auction_result) — из аукционной системы в Oracle, только чтение:
 *   LS.AUCTION_ISSUE  — выпуск на аукционе: дата, бумага (CURR_ID), объявленный объём (PRED), купон;
 *   LS.AUCTION_ORDERS — заявки: спрос = сумма объёмов без отклонённых (CONF = 2);
 *   LS.AUCTION_DEALS  — сделки: продано = сумма объёмов, доходность min / max / средневзвешенная по объёму;
 *   TS.TS_CURRINSTRUMENT_ARCTS — код выпуска (GD052270712…) и номинал, текущие и архивные бумаги.
 * Объёмы — в тыс. сом: штуки × номинал / 1000, дробная часть отбрасывается (как на kse.kg).
 * Сверено с kse.kg/ru/AuctionResult: из 103 общих аукционов (05.2023–07.2026) совпали 101 по всем полям; у двух
 * последних (17.07 и 23.07.2026) итоги в Oracle не записаны — они подводились уже в новой системе (qauct.kse.kg).
 * Выпуски, у которых бумаги нет в справочнике инструментов (нет кода), не переносятся — их и kse.kg не показывал.
 */
const AUCTIONS_SQL = `select i.date0, ci.shortname as code, ci.nominal, i.volume, i.pred, i.coupon_annual_rate as coupon,
 (select sum(o.volume) from ls.auction_orders o where o.curr_id=i.curr_id and o.date0=i.date0 and nvl(o.conf,1) <> 2) as ov,
 (select sum(d.volume) from ls.auction_deals d where d.curr_id=i.curr_id and d.date0=i.date0) as dv,
 (select min(d.profit) from ls.auction_deals d where d.curr_id=i.curr_id and d.date0=i.date0) as ymin,
 (select max(d.profit) from ls.auction_deals d where d.curr_id=i.curr_id and d.date0=i.date0) as ymax,
 (select sum(d.profit*d.volume)/sum(d.volume) from ls.auction_deals d where d.curr_id=i.curr_id and d.date0=i.date0) as yavg
from ls.auction_issue i, ts.ts_currinstrument_arcts ci
where ci.id = i.curr_id and i.date0 >= ?
order by i.date0`;

export type GcbAuctionRow = {
  date: string;
  code: string;
  offer: number | null;
  demand: number | null;
  sold: number | null;
  minYield: number | null;
  maxYield: number | null;
  avgYield: number | null;
  coupon: number | null;
};

const num = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Строка Oracle → аукцион в тыс. сом (штуки × номинал / 1000; нет номинала — 100 сом, как у всех ГЦБ). */
export function toAuction(row: Record<string, unknown>): GcbAuctionRow {
  const nominal = num(row.NOMINAL) ?? 100;
  const thousands = (pieces: number | null) => (pieces === null ? 0 : Math.floor((pieces * nominal) / 1000));
  const offer = num(row.PRED) ?? num(row.VOLUME);
  const avg = num(row.YAVG);
  return {
    date: decodeLongDate(Number(row.DATE0)),
    code: String(row.CODE ?? "").trim(),
    offer: offer === null ? null : offer / 1000,
    demand: thousands(num(row.OV)),
    sold: thousands(num(row.DV)),
    minYield: num(row.YMIN),
    maxYield: num(row.YMAX),
    avgYield: avg === null ? null : Math.round(avg * 100) / 100,
    coupon: num(row.COUPON),
  };
}

const decimal = (value: number | null) => (value === null ? null : new Prisma.Decimal(value));

/** Загрузить аукционы с даты from (ГГГГ-ММ-ДД; null — вся история) и записать без дублей (ключ — дата + код выпуска). */
export async function syncGcbAuctions(from: string | null) {
  const rows = (await queryOracle(AUCTIONS_SQL, [from ? encodeLongDate(from) : 0], 0, 5 * 60 * 1000))
    .map(toAuction)
    .filter((row) => row.code);
  for (let i = 0; i < rows.length; i += 200) {
    await prisma.$transaction(
      rows.slice(i, i + 200).map((row) => {
        const date = new Date(`${row.date}T00:00:00Z`);
        const data = {
          supply: decimal(row.offer),
          demand: decimal(row.demand),
          satisfied: decimal(row.sold),
          minYield: decimal(row.minYield),
          maxYield: decimal(row.maxYield),
          avgYield: decimal(row.avgYield),
          couponRate: decimal(row.coupon),
        };
        return prisma.gcbAuction.upsert({
          where: { date_securityCode: { date, securityCode: row.code } },
          create: { id: randomUUID(), date, securityCode: row.code, ...data },
          update: data,
        });
      }),
    );
  }
  return { auctions: rows.length, first: rows[0]?.date ?? null, last: rows.at(-1)?.date ?? null };
}

/** Регулярное обновление: пустая таблица — вся история, иначе последние 60 дней (итоги могли дописать задним числом). */
export async function syncRecentGcbAuctions() {
  const latest = await prisma.gcbAuction.findFirst({ orderBy: { date: "desc" }, select: { date: true } });
  if (!latest) return syncGcbAuctions(null);
  return syncGcbAuctions(new Date(latest.date.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
}

/** Все аукционы для сайта, новые сверху. */
export async function readGcbAuctions(): Promise<GcbAuctionRow[]> {
  const rows = await prisma.gcbAuction.findMany({ orderBy: [{ date: "desc" }, { securityCode: "asc" }] });
  const n = (value: Prisma.Decimal | null) => (value === null ? null : Number(value));
  return rows.map((row) => ({
    date: row.date.toISOString().slice(0, 10),
    code: row.securityCode,
    offer: n(row.supply),
    demand: n(row.demand),
    sold: n(row.satisfied),
    minYield: n(row.minYield),
    maxYield: n(row.maxYield),
    avgYield: n(row.avgYield),
    coupon: n(row.couponRate),
  }));
}
