/**
 * Разведка базы QUIK Reports (MS SQL Server): какие там таблицы и колонки и где лежат эмитенты и их бумаги.
 *
 *   npm run quik:schema              (из папки backend; настройки — QUIK_REPORTS_* в .env)
 *   npm run quik:schema -- --no-samples   без примеров строк, только структура
 *
 * Только чтение: все запросы идут через мост quik.service.ts (один SELECT, транзакция с откатом).
 * Результат — файл quik-schema.json в текущей папке:
 *   version     — версия SQL Server;
 *   tables      — [{ schema, name, type, rows, columns: [{ name, type }] }];
 *   candidates  — таблицы, похожие на эмитентов/бумаги (по имени таблицы или колонок);
 *   samples     — по 3 строки из каждого кандидата (не больше 40 таблиц). Сделки и счета клиентов не выбираются.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { closeReports, queryReports, quikErrorMessage, type QuikRow } from "../src/integrations/quik-reports/quik.service";

const withSamples = !process.argv.includes("--no-samples");

/** Похоже на эмитента или бумагу. */
const CANDIDATE = /emit|issuer|firm|compan|secur|sec_?code|class|instr|isin|ticker|symbol|paper|bumag|cb_/i;
/** Сделки, заявки, счета, клиенты — примеры строк из них не берём (там данные участников). */
const PRIVATE = /trade|deal|order|client|account|acc_|money|limit|position|user|login|pass/i;

type Column = { name: string; type: string };
type Table = { schema: string; name: string; type: string; rows: number | null; columns: Column[] };

const text = (value: unknown) => (value === null || value === undefined ? "" : String(value));

function plain(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return `0x${value.subarray(0, 16).toString("hex")}${value.length > 16 ? "…" : ""}`;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string" && value.length > 200) return `${value.slice(0, 200)}…`;
  return value;
}

/** [схема].[таблица] с экранированием «]». */
const quoteName = (schema: string, name: string) => `[${schema.replace(/]/g, "]]")}].[${name.replace(/]/g, "]]")}]`;

async function rowCounts(): Promise<Map<string, number>> {
  const key = (schema: unknown, name: unknown) => `${text(schema)}.${text(name)}`;
  try {
    const rows = await queryReports(
      "SELECT s.name AS sch, o.name AS tbl, SUM(p.rows) AS cnt FROM sys.partitions p JOIN sys.objects o ON o.object_id = p.object_id JOIN sys.schemas s ON s.schema_id = o.schema_id WHERE p.index_id IN (0, 1) AND o.type = 'U' GROUP BY s.name, o.name",
    );
    return new Map(rows.map((row): [string, number] => [key(row.sch, row.tbl), Number(row.cnt)]));
  } catch {
    // SQL Server 2000: sys.partitions ещё нет.
    const rows = await queryReports(
      "SELECT USER_NAME(o.uid) AS sch, o.name AS tbl, i.rows AS cnt FROM sysobjects o JOIN sysindexes i ON i.id = o.id WHERE o.xtype = 'U' AND i.indid IN (0, 1)",
    ).catch((): QuikRow[] => []);
    return new Map(rows.map((row): [string, number] => [key(row.sch, row.tbl), Number(row.cnt)]));
  }
}

async function main() {
  const [{ version } = { version: "" }] = await queryReports("SELECT @@VERSION AS version");
  console.log(text(version).split("\n")[0]);

  const columns = await queryReports(
    "SELECT c.TABLE_SCHEMA AS sch, c.TABLE_NAME AS tbl, t.TABLE_TYPE AS kind, c.COLUMN_NAME AS col, c.DATA_TYPE AS dtype FROM INFORMATION_SCHEMA.COLUMNS c JOIN INFORMATION_SCHEMA.TABLES t ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME ORDER BY c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION",
  );
  const counts = await rowCounts();

  const tables = new Map<string, Table>();
  for (const row of columns) {
    const key = `${text(row.sch)}.${text(row.tbl)}`;
    let table = tables.get(key);
    if (!table) {
      table = { schema: text(row.sch), name: text(row.tbl), type: text(row.kind) === "VIEW" ? "view" : "table", rows: counts.get(key) ?? null, columns: [] };
      tables.set(key, table);
    }
    table.columns.push({ name: text(row.col), type: text(row.dtype) });
  }
  const all = [...tables.values()];
  console.log(`таблиц и представлений: ${all.length}`);

  const candidates = all.filter((table) => CANDIDATE.test(table.name) || table.columns.some((column) => CANDIDATE.test(column.name)));
  console.log(`похожи на эмитентов/бумаги: ${candidates.length}`);

  const samples: Record<string, unknown> = {};
  if (withSamples) {
    for (const table of candidates.filter((item) => !PRIVATE.test(item.name)).slice(0, 40)) {
      const name = `${table.schema}.${table.name}`;
      try {
        const rows = await queryReports(`SELECT TOP 3 * FROM ${quoteName(table.schema, table.name)}`);
        samples[name] = rows.map((row) => Object.fromEntries(Object.entries(row).map(([column, value]) => [column, plain(value)])));
      } catch (error) {
        samples[name] = { error: quikErrorMessage(error) };
      }
    }
  }

  const file = path.resolve(process.cwd(), "quik-schema.json");
  writeFileSync(
    file,
    JSON.stringify({ createdAt: new Date().toISOString(), version: text(version), tables: all, candidates: candidates.map((t) => `${t.schema}.${t.name}`), samples }, null, 2),
  );
  console.log(`готово: ${file}`);
}

main()
  .catch((error: unknown) => {
    console.error(`QUIK Reports: ${quikErrorMessage(error)}`);
    process.exitCode = 1;
  })
  .finally(() => closeReports());
