/**
 * Перенос мировых индексов из старой базы сайта kse.kg (таблица mod_indeces) в index_values.
 *
 *   npx tsx scripts/import-legacy-indices.ts <путь к дампу kse.sql>
 *
 * Дамп только читается. Старый сайт собирал эти значения со страниц rbc.ru (cron/new_index_update.php), в Oracle их
 * нет, а с августа 2020 сбор отключён — поэтому источник один: сама таблица. Переносятся только непустые значения;
 * разные написания одного индекса сводятся к одному коду (SP500 / S_P500 / SnP500 → SP500); числа «4432,9» → 4432.9.
 * Повторный запуск не плодит дубли: ключ — (code, date), существующая строка обновляется.
 */
import { createReadStream } from "node:fs";
import { randomUUID } from "node:crypto";
import readline from "node:readline";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/db/prisma";

const CODE_ALIASES: Record<string, string> = { S_P500: "SP500", SNP500: "SP500", SP500: "SP500" };

/** «4 432,90» → 4432.9; пусто или не число → null. */
export function legacyNumber(raw: string) {
  const value = raw.replace(/\s/g, "").replace(",", ".");
  return value === "" || Number.isNaN(Number(value)) ? null : Number(value);
}

type Row = { legacyId: number; code: string; date: string; value: number; changePercent: number | null };

/** Строка дампа «\t(id, 'name', 'index', 'percent', change, 'date')» → значение индекса или null, если оно пустое. */
export function parseIndexTuple(line: string): Row | null {
  const m = line.match(/^\t\((\d+), '([^']*)', '([^']*)', '([^']*)', -?\d+, '(\d{4}-\d{2}-\d{2})/);
  if (!m) return null;
  const value = legacyNumber(m[3]);
  if (value === null) return null;
  const name = m[2].trim().toUpperCase();
  return { legacyId: Number(m[1]), code: CODE_ALIASES[name] ?? name, date: m[5], value, changePercent: legacyNumber(m[4]) };
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Укажите путь к дампу: npx tsx scripts/import-legacy-indices.ts <kse.sql>");

  // По (code, date) оставляем последнюю строку старой таблицы — в ней бывали повторы за один день.
  const rows = new Map<string, Row>();
  let inTable = false;
  let read = 0;
  for await (const line of readline.createInterface({ input: createReadStream(file, { encoding: "utf8" }), crlfDelay: Infinity })) {
    if (line.startsWith("INSERT INTO `mod_indeces`")) inTable = true;
    else if (inTable && !line.startsWith("\t(")) inTable = false;
    if (!inTable) continue;
    read++;
    const row = parseIndexTuple(line);
    if (row) rows.set(`${row.code}|${row.date}`, row);
  }

  const list = [...rows.values()];
  for (let i = 0; i < list.length; i += 500) {
    await prisma.$transaction(
      list.slice(i, i + 500).map((row) => {
        const date = new Date(`${row.date}T00:00:00Z`);
        const data = {
          value: new Prisma.Decimal(row.value),
          changePercent: row.changePercent === null ? null : new Prisma.Decimal(row.changePercent),
          legacyId: row.legacyId,
        };
        return prisma.indexValue.upsert({
          where: { code_date: { code: row.code, date } },
          create: { id: randomUUID(), code: row.code, date, ...data },
          update: data,
        });
      }),
    );
  }

  const byCode = new Map<string, { n: number; from: string; to: string }>();
  for (const row of list) {
    const s = byCode.get(row.code) ?? { n: 0, from: row.date, to: row.date };
    s.n++;
    if (row.date < s.from) s.from = row.date;
    if (row.date > s.to) s.to = row.date;
    byCode.set(row.code, s);
  }
  console.log(`Строк в mod_indeces: ${read}, перенесено значений: ${list.length} (пустые пропущены)`);
  for (const [code, s] of [...byCode].sort()) console.log(`  ${code.padEnd(6)} ${String(s.n).padStart(5)}  ${s.from} … ${s.to}`);
}

if (process.argv[1]?.includes("import-legacy-indices")) {
  main()
    .catch((error) => {
      console.error("FAIL", error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
