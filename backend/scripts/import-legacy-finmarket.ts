/**
 * Перенос журнала «Финансовый рынок.KG» из бэкапа старого сайта: таблица mod_fin_market (HeidiSQL-дамп kse.sql)
 * → fin_market_issues, PDF-файлы из копии старого сайта (папка FinMarket) → uploads/finmarket.
 *
 *   npx tsx scripts/import-legacy-finmarket.ts <путь к kse.sql> <папка www.kse.kg/FinMarket>
 *
 * Дамп и папка старого сайта только читаются. Файлы копируются под теми же именами (уже скопированный файл того же
 * размера пропускается). Повторный запуск не плодит дубли: ключ — legacy_id (fin_market_id старой таблицы).
 * Файла нет в папке — выпуск всё равно переносится, но без ссылки на файл, и об этом пишется в журнал.
 */
import { copyFile, mkdir, stat } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "../src/config";
import { prisma } from "../src/db/prisma";

type LegacyIssue = { id: number; filepath: string; filesize: number; title: string; description: string; date: string };

/** Кортежи INSERT INTO `mod_fin_market` … VALUES (…), (…); — строки в одинарных кавычках с \-экранированием. */
export function parseFinMarket(sql: string): LegacyIssue[] {
  const start = sql.indexOf("INSERT INTO `mod_fin_market`");
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
  return rows.map(([id, filepath, filesize, title, description, date]) => ({
    id: Number(id),
    filepath: (filepath ?? "").trim(),
    filesize: Number(filesize) || 0,
    title: (title ?? "").trim(),
    description: (description ?? "").trim(),
    date: date ?? "",
  }));
}

async function main() {
  const [dump, sourceDir] = process.argv.slice(2);
  if (!dump || !sourceDir) throw new Error("Укажите: npx tsx scripts/import-legacy-finmarket.ts <kse.sql> <www.kse.kg/FinMarket>");
  const issues = parseFinMarket(readFileSync(dump, "utf8")).filter((row) => row.title && /^\d{4}-\d{2}-\d{2}/.test(row.date));
  const targetDir = path.join(config.uploadsDir, "finmarket");
  await mkdir(targetDir, { recursive: true });

  let copied = 0;
  const missing: string[] = [];
  for (const issue of issues) {
    // Только имя файла — без путей из базы (защита от «../»).
    const name = path.basename(issue.filepath);
    const from = path.join(sourceDir, name);
    const to = path.join(targetDir, name);
    const source = await stat(from).catch(() => null);
    if (!source) {
      missing.push(name);
      continue;
    }
    const existing = await stat(to).catch(() => null);
    if (!existing || existing.size !== source.size) {
      await copyFile(from, to);
      copied++;
    }
  }

  for (const issue of issues) {
    const name = path.basename(issue.filepath);
    const data = {
      title: issue.title,
      description: issue.description,
      date: new Date(`${issue.date.slice(0, 10)}T00:00:00Z`),
      fileUrl: missing.includes(name) ? "" : `/uploads/finmarket/${encodeURIComponent(name)}`,
      fileSize: issue.filesize || null,
    };
    await prisma.finMarketIssue.upsert({ where: { legacyId: issue.id }, create: { id: randomUUID(), legacyId: issue.id, ...data }, update: data });
  }
  console.log(`Выпусков: ${issues.length}, скопировано файлов: ${copied}, нет файла: ${missing.length ? missing.join(", ") : "—"}`);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
