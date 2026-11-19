/**
 * Перенос «Участников торгов» из бэкапа старого сайта (HeidiSQL, таблица mod_bc_entries, group = Members) в business_catalog.
 *
 *   npx tsx scripts/import-legacy-members.ts <путь к дампу kse.sql>
 *
 * Дамп только читается. Старый сайт вёл этот список вручную (модуль BusinessCatalog): название компании и HTML-описание
 * с адресом, телефонами, почтой и пометкой «Доступ к торгам приостановлен …». Перед переносом прежние участники
 * (group = Members) удаляются — список заменяется целиком; пустые записи (без названия) пропускаются.
 */
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/db/prisma";

type LegacyEntry = { id: number; name: string; group: string; title: string; description: string; status: number; date: string };

/** Кортежи INSERT INTO `mod_bc_entries` … VALUES (…), (…); — строки в одинарных кавычках с \-экранированием. */
export function parseCatalogEntries(sql: string): LegacyEntry[] {
  const start = sql.indexOf("INSERT INTO `mod_bc_entries`");
  if (start < 0) return [];
  const body = sql.slice(sql.indexOf("VALUES", start) + 6);
  const rows: string[][] = [];
  let row: string[] | null = null;
  let value = "";
  let inString = false;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (inString) {
      if (c === "\\") {
        const next = body[++i];
        value += next === "n" ? "\n" : next === "r" ? "\r" : next === "t" ? "\t" : next;
      } else if (c === "'") inString = false;
      else value += c;
      continue;
    }
    if (c === "'") inString = true;
    else if (c === "(") (row = []), (value = "");
    else if (c === "," && row) row.push(value.trim()), (value = "");
    else if (c === ")" && row) row.push(value.trim()), rows.push(row), (row = null), (value = "");
    else if (c === ";" && !row) break;
    else if (row) value += c;
  }
  return rows.map(([id, name, group, title, description, status, date]) => ({
    id: Number(id),
    name: name ?? "",
    group: group ?? "",
    title: title ?? "",
    description: description ?? "",
    status: Number(status),
    date: date ?? "",
  }));
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Укажите путь к дампу: npx tsx scripts/import-legacy-members.ts <kse.sql>");
  const members = parseCatalogEntries(readFileSync(file, "utf8")).filter((row) => row.group === "Members" && row.name.trim());
  const removed = await prisma.catalogEntry.deleteMany({ where: { group: "Members" } });
  await prisma.catalogEntry.createMany({
    data: members.map((row) => ({
      id: randomUUID(),
      name: row.name.trim(),
      group: "Members",
      title: row.title.trim() || row.name.trim(),
      description: row.description,
      status: "published",
      date: /^\d{4}-\d{2}-\d{2}/.test(row.date) && !row.date.startsWith("0000") ? new Date(`${row.date.slice(0, 10)}T00:00:00Z`) : null,
      legacyId: row.id,
    })),
  });
  console.log(`Удалено прежних: ${removed.count}, перенесено участников: ${members.length}`);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
