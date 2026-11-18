import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { queryOracle, type OracleRow } from "./oracle.service";
import { decodeLongDate, encodeLongDate } from "./oracle.trades";

/**
 * Итоги торгов по дням (таблица trade_days) — то, что старый сайт хранил в mod_tradestat.
 *
 * Запрос повторяет cron/tradestat_update.php старого сайта (только чтение): сделки — sys.deal2 (каждая сделка там
 * записана дважды, поэтому сумма делится на 2), первичный рынок и листинг — как функции www.srazm / www.slist
 * (см. DAYS_SQL); суммы в млн сом. Вторичный рынок = всего − первичный, нелистинг = всего − листинг. Изменение в % — к предыдущему
 * торговому дню, как функции www.prev* старого сайта (проверено: 11.11.2026 даёт те же +453 %).
 */

/**
 * Функции www.srazm / www.slist старого сайта считают по таблице ts.f1a_q2 сумму total за день (делённую на 2):
 *   srazm — строки с code LIKE '1-33%' (первичный рынок), slist — sector LIKE 'Листингов%' или 'ГЦБ%'.
 * Здесь то же самое одним запросом с группировкой по дням: функции вызывались для каждого дня и год грузился
 * ~150 с, этот запрос — ~4 с; результаты сверены за 2025 год — совпали все 238 дней.
 * Кириллица в базе хранится байтами Windows-1251, поэтому образцы собраны через CHR() (Л=203, и=232, …; Г=195, Ц=214, Б=193).
 */
const LISTING_SECTOR = "CHR(203)||CHR(232)||CHR(241)||CHR(242)||CHR(232)||CHR(237)||CHR(227)||CHR(238)||CHR(226)||'%'";
const GCB_SECTOR = "CHR(195)||CHR(214)||CHR(193)||'%'";
const DAYS_SQL =
  "SELECT t.DATE0, ROUND(SUM(t.PRICE * t.VOLUME) / 2000000, 4) AS TOTAL, " +
  "ROUND(NVL(MAX(p.V), 0) / 2000000, 4) AS PRIMARY_VOL, ROUND(NVL(MAX(l.V), 0) / 2000000, 4) AS LISTING_VOL " +
  "FROM sys.deal2 t, " +
  "(SELECT DATE0, SUM(TOTAL) AS V FROM ts.f1a_q2 WHERE CODE LIKE '1-33%' GROUP BY DATE0) p, " +
  `(SELECT DATE0, SUM(TOTAL) AS V FROM ts.f1a_q2 WHERE SECTOR LIKE ${LISTING_SECTOR} OR SECTOR LIKE ${GCB_SECTOR} GROUP BY DATE0) l ` +
  "WHERE t.DATE0 = p.DATE0 (+) AND t.DATE0 = l.DATE0 (+) AND t.DATE0 >= ? AND t.DATE0 < ? " +
  "GROUP BY t.DATE0 ORDER BY t.DATE0";

export type TradeDayRow = {
  date: string;
  total: number;
  primary: number;
  secondary: number;
  listing: number;
  nonListing: number;
  totalChange: number | null;
  primaryChange: number | null;
  secondaryChange: number | null;
  listingChange: number | null;
  nonListingChange: number | null;
};

const round4 = (value: number) => Math.round(value * 10000) / 10000;

/** Изменение к предыдущему дню, % (1 знак, как на старом сайте); нет базы для сравнения — null. */
export function changePercent(current: number, previous: number | undefined) {
  if (previous === undefined || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Строки Oracle (по дням, по возрастанию даты) → итоги дня с разбивкой и изменением к предыдущему дню. */
export function buildTradeDays(rows: OracleRow[]): TradeDayRow[] {
  const days: TradeDayRow[] = [];
  for (const row of rows) {
    const total = Number(row.TOTAL ?? 0);
    const primary = Number(row.PRIMARY_VOL ?? 0);
    const listing = Number(row.LISTING_VOL ?? 0);
    const prev = days.at(-1);
    const day: TradeDayRow = {
      date: decodeLongDate(Number(row.DATE0)),
      total,
      primary,
      secondary: round4(total - primary),
      listing,
      nonListing: round4(total - listing),
      totalChange: null,
      primaryChange: null,
      secondaryChange: null,
      listingChange: null,
      nonListingChange: null,
    };
    day.totalChange = changePercent(day.total, prev?.total);
    day.primaryChange = changePercent(day.primary, prev?.primary);
    day.secondaryChange = changePercent(day.secondary, prev?.secondary);
    day.listingChange = changePercent(day.listing, prev?.listing);
    day.nonListingChange = changePercent(day.nonListing, prev?.nonListing);
    days.push(day);
  }
  return days;
}

const decimal = (value: number | null) => (value === null ? null : new Prisma.Decimal(value));

/**
 * Загрузить итоги по дням в диапазоне [from, to) (ГГГГ-ММ-ДД) и записать в trade_days: новая дата — добавляется,
 * уже записанная — обновляется (повторный запуск не создаёт дублей). Процент изменения первого дня диапазона
 * считается от последнего уже записанного дня до from, поэтому историю можно грузить кусками по годам.
 */
export async function syncTradeDays(from: string, to = "9999-12-31") {
  const rows = await queryOracle(DAYS_SQL, [encodeLongDate(from), encodeLongDate(to)], 0, 10 * 60 * 1000);
  const before = await prisma.tradeDay.findFirst({ where: { date: { lt: new Date(`${from}T00:00:00Z`) } }, orderBy: { date: "desc" } });
  // Последний день до диапазона — база для процента первого дня диапазона (сам он не перезаписывается).
  const base: OracleRow[] = before
    ? [{ DATE0: String(encodeLongDate(before.date.toISOString().slice(0, 10))), TOTAL: String(before.totalVolume), PRIMARY_VOL: String(before.primaryVolume), LISTING_VOL: String(before.listingVolume) }]
    : [];
  const days = buildTradeDays([...base, ...rows]).slice(base.length);

  const BATCH = 500;
  for (let i = 0; i < days.length; i += BATCH) {
    await prisma.$transaction(
      days.slice(i, i + BATCH).map((day) => {
        const data = {
          totalVolume: new Prisma.Decimal(day.total),
          primaryVolume: new Prisma.Decimal(day.primary),
          secondaryVolume: new Prisma.Decimal(day.secondary),
          listingVolume: new Prisma.Decimal(day.listing),
          nonListingVolume: new Prisma.Decimal(day.nonListing),
          totalChangePercent: decimal(day.totalChange),
          primaryChangePercent: decimal(day.primaryChange),
          secondaryChangePercent: decimal(day.secondaryChange),
          listingChangePercent: decimal(day.listingChange),
          nonListingChangePercent: decimal(day.nonListingChange),
          source: "oracle",
        };
        const date = new Date(`${day.date}T00:00:00Z`);
        return prisma.tradeDay.upsert({ where: { date }, create: { id: randomUUID(), date, ...data }, update: data });
      }),
    );
  }
  return { days: days.length, first: days[0]?.date ?? null, last: days.at(-1)?.date ?? null };
}

const daysAgo = (date: Date, days: number) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

/**
 * Регулярное обновление (из oracle.sync): последняя неделя от последней записанной даты; пустая таблица — последние
 * 30 дней. Всю историю регулярная синхронизация не грузит никогда — это разовая загрузка backfillTradeDays.
 */
export async function syncRecentTradeDays() {
  const latest = await prisma.tradeDay.findFirst({ orderBy: { date: "desc" }, select: { date: true } });
  return syncTradeDays(daysAgo(latest?.date ?? new Date(), latest ? 7 : 30));
}

/** Разовая загрузка всей истории по годам (по очереди, чтобы не нагружать торговую систему). */
export async function backfillTradeDays(fromYear: number, toYear: number, log: (line: string) => void = console.log) {
  for (let year = fromYear; year <= toYear; year++) {
    const started = Date.now();
    const result = await syncTradeDays(`${year}-01-01`, `${year + 1}-01-01`);
    log(`${year}: ${result.days} дн. за ${Math.round((Date.now() - started) / 1000)} с`);
  }
}
