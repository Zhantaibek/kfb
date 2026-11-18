import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { queryOracle, type OracleRow } from "./oracle.service";
import { decodeLongDate, encodeLongDate } from "./oracle.trades";

/**
 * Индекс KSE и капитализация по дням (index_values, code = KSE) — то, что старый сайт хранил в mod_cap_index.
 *
 * Запрос повторяет cron/update_index.php старого сайта (только чтение): ts.capitalisation, индекс округлён до 2 знаков
 * как там, капитализация — в сомах как есть. В ts.capitalisation у части дат строки повторяются (проверено: повторы
 * полностью одинаковые), поэтому берём DISTINCT — одна строка на дату. Изменение в % — к предыдущей дате.
 */
const INDEX_SQL = "SELECT DISTINCT DATE0, ROUND(IND, 2) AS IND, CAP FROM ts.capitalisation WHERE DATE0 >= ? ORDER BY DATE0";

export type IndexDay = { date: string; value: number; capitalization: number | null; changePercent: number | null };

/** Строки Oracle (по возрастанию даты) → значения индекса; изменение в % к предыдущей дате (2 знака). */
export function buildIndexDays(rows: OracleRow[], previous?: number): IndexDay[] {
  const days: IndexDay[] = [];
  let prev = previous;
  for (const row of rows) {
    const value = Number(row.IND ?? 0);
    const cap = row.CAP === null || row.CAP === undefined || row.CAP === "" ? null : Number(row.CAP);
    const changePercent = prev ? Math.round(((value - prev) / prev) * 10000) / 100 : null;
    days.push({ date: decodeLongDate(Number(row.DATE0)), value, capitalization: cap, changePercent });
    prev = value;
  }
  return days;
}

/** Загрузить индекс KSE начиная с from (ГГГГ-ММ-ДД; null — вся история) и записать без дублей (ключ code + date). */
export async function syncIndexValues(from: string | null) {
  const rows = await queryOracle(INDEX_SQL, [from ? encodeLongDate(from) : 0], 0, 5 * 60 * 1000);
  const before = from
    ? await prisma.indexValue.findFirst({ where: { code: "KSE", date: { lt: new Date(`${from}T00:00:00Z`) } }, orderBy: { date: "desc" } })
    : null;
  const days = buildIndexDays(rows, before ? Number(before.value) : undefined);

  for (let i = 0; i < days.length; i += 500) {
    await prisma.$transaction(
      days.slice(i, i + 500).map((day) => {
        const date = new Date(`${day.date}T00:00:00Z`);
        const data = {
          value: new Prisma.Decimal(day.value),
          capitalization: day.capitalization === null ? null : new Prisma.Decimal(day.capitalization),
          changePercent: day.changePercent === null ? null : new Prisma.Decimal(day.changePercent),
        };
        return prisma.indexValue.upsert({
          where: { code_date: { code: "KSE", date } },
          create: { id: randomUUID(), code: "KSE", date, ...data },
          update: data,
        });
      }),
    );
  }
  return { days: days.length, first: days[0]?.date ?? null, last: days.at(-1)?.date ?? null };
}

export type ChartPoint = { date: string; value: number };

/**
 * Точки для графиков индекса и капитализации — как на главной kse.kg (modules/FastChart/fastchart_handler.php):
 * за последние 12 месяцев в каждом месяце берётся максимальное значение и последняя дата, когда оно было.
 * Получается ~13 точек, по одной на месяц. Капитализация — в млн сом.
 */
export async function monthlyIndexChart() {
  const index = await prisma.$queryRaw<ChartPoint[]>`
    WITH recent AS (
      SELECT date, value FROM index_values WHERE code = 'KSE' AND date >= CURRENT_DATE - INTERVAL '12 months'
    ), best AS (
      SELECT date_trunc('month', date) AS month, MAX(value) AS value FROM recent GROUP BY 1
    )
    SELECT to_char(MAX(r.date), 'YYYY-MM-DD') AS date, best.value::float8 AS value
    FROM recent r JOIN best ON date_trunc('month', r.date) = best.month AND r.value = best.value
    GROUP BY best.month, best.value ORDER BY 1`;
  const capitalization = await prisma.$queryRaw<ChartPoint[]>`
    WITH recent AS (
      SELECT date, capitalization FROM index_values
      WHERE code = 'KSE' AND capitalization IS NOT NULL AND date >= CURRENT_DATE - INTERVAL '12 months'
    ), best AS (
      SELECT date_trunc('month', date) AS month, MAX(capitalization) AS value FROM recent GROUP BY 1
    )
    SELECT to_char(MAX(r.date), 'YYYY-MM-DD') AS date, ROUND(best.value / 1000000, 2)::float8 AS value
    FROM recent r JOIN best ON date_trunc('month', r.date) = best.month AND r.capitalization = best.value
    GROUP BY best.month, best.value ORDER BY 1`;
  // Для коротких периодов (день, неделя, месяц) — значения по дням за последние ~13 месяцев.
  const daily = await prisma.$queryRaw<ChartPoint[]>`
    SELECT to_char(date, 'YYYY-MM-DD') AS date, value::float8 AS value FROM index_values
    WHERE code = 'KSE' AND date >= CURRENT_DATE - INTERVAL '400 days' ORDER BY date`;
  // «Всё» — то же правило, что и за год (максимум за месяц), но за всю историю индекса.
  const allMonthly = await prisma.$queryRaw<ChartPoint[]>`
    WITH best AS (
      SELECT date_trunc('month', date) AS month, MAX(value) AS value FROM index_values WHERE code = 'KSE' GROUP BY 1
    )
    SELECT to_char(MAX(r.date), 'YYYY-MM-DD') AS date, best.value::float8 AS value
    FROM index_values r JOIN best ON r.code = 'KSE' AND date_trunc('month', r.date) = best.month AND r.value = best.value
    GROUP BY best.month, best.value ORDER BY 1`;
  // То же для капитализации (млн сом): по дням за ~13 месяцев и максимум за месяц за всю историю.
  const capDaily = await prisma.$queryRaw<ChartPoint[]>`
    SELECT to_char(date, 'YYYY-MM-DD') AS date, ROUND(capitalization / 1000000, 2)::float8 AS value FROM index_values
    WHERE code = 'KSE' AND capitalization IS NOT NULL AND date >= CURRENT_DATE - INTERVAL '400 days' ORDER BY date`;
  const capAllMonthly = await prisma.$queryRaw<ChartPoint[]>`
    WITH best AS (
      SELECT date_trunc('month', date) AS month, MAX(capitalization) AS value
      FROM index_values WHERE code = 'KSE' AND capitalization IS NOT NULL GROUP BY 1
    )
    SELECT to_char(MAX(r.date), 'YYYY-MM-DD') AS date, ROUND(best.value / 1000000, 2)::float8 AS value
    FROM index_values r JOIN best ON r.code = 'KSE' AND date_trunc('month', r.date) = best.month AND r.capitalization = best.value
    GROUP BY best.month, best.value ORDER BY 1`;
  return { index, capitalization, daily, allMonthly, capDaily, capAllMonthly };
}

/** Регулярное обновление (из oracle.sync): последние две недели; пустая история KSE — вся (запрос быстрый). */
export async function syncRecentIndexValues() {
  const latest = await prisma.indexValue.findFirst({ where: { code: "KSE", capitalization: { not: null } }, orderBy: { date: "desc" }, select: { date: true } });
  if (!latest) return syncIndexValues(null);
  return syncIndexValues(new Date(latest.date.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
}
