import sql from "mssql";
import { readOnlyProblem as baseReadOnlyProblem } from "../oracle/oracle.service";
import { quikConfig, quikConfigured } from "./quik.config";

/**
 * Запросы к базе QUIK Reports (MS SQL Server). Драйвер mssql (tedious) — чистый JavaScript, Java не нужна.
 * SQL — только из кода, значения — именованными параметрами @p0, @p1…, поэтому инъекции исключены.
 * Пароль не попадает ни в логи, ни в тексты ошибок.
 *
 * ТОЛЬКО ЧТЕНИЕ. Мост не может изменить данные — защита в два слоя, как у моста к Oracle:
 *  1. Текст запроса: ровно один SELECT без «;» и комментариев, без слов, которыми что-то меняют или запускают
 *     (общий список из oracle.service.ts + T-SQL: EXEC, xp_/sp_-процедуры, OPENROWSET, BULK, WAITFOR, DBCC и т. п.).
 *  2. Транзакция: каждый запрос выполняется внутри неё, в конце всегда ROLLBACK — COMMIT не вызывается.
 *     Логину на сервере достаточно роли db_datareader — тогда запись невозможна и на уровне прав.
 */

export type QuikRow = Record<string, unknown>;

export class QuikReportsError extends Error {}

const TSQL_FORBIDDEN =
  /\b(exec|execute|sp_\w+|xp_\w+|openrowset|opendatasource|openquery|openxml|bulk|waitfor|shutdown|kill|dbcc|use|backup|restore|reconfigure|into|output)\b/i;

/** Почему запрос не только для чтения; null — запрос допустим. */
export function readOnlyProblem(query: string): string | null {
  const base = baseReadOnlyProblem(query);
  if (base) return base;
  const bare = query.replace(/'(?:[^']|'')*'/g, " STR ");
  const word = bare.match(TSQL_FORBIDDEN);
  return word ? `запрещённое слово в запросе: ${word[1].toUpperCase()}` : null;
}

/** Короткая причина ошибки без стека и без учётных данных. */
export function quikErrorMessage(error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  const clean = quikConfig.password ? text.split(quikConfig.password).join("***") : text;
  return clean.replace(/\s+/g, " ").trim().slice(0, 300) || "неизвестная ошибка";
}

let poolPromise: Promise<sql.ConnectionPool> | null = null;

function connect() {
  poolPromise ??= new sql.ConnectionPool({
    server: quikConfig.host,
    port: quikConfig.instance ? undefined : quikConfig.port,
    database: quikConfig.database,
    user: quikConfig.user,
    password: quikConfig.password,
    connectionTimeout: 20_000,
    requestTimeout: quikConfig.timeoutMs,
    pool: { max: 2, min: 0, idleTimeoutMillis: 60_000 },
    options: {
      instanceName: quikConfig.instance || undefined,
      encrypt: quikConfig.encrypt,
      trustServerCertificate: true,
      readOnlyIntent: true,
      ...(quikConfig.tdsVersion ? { tdsVersion: quikConfig.tdsVersion } : {}),
    },
  })
    .connect()
    .catch((error: unknown) => {
      // Следующий запрос попробует подключиться заново.
      poolPromise = null;
      throw error;
    });
  return poolPromise;
}

/** Один SELECT; параметры подставляются как @p0, @p1… */
export async function queryReports(query: string, params: (string | number | null)[] = []): Promise<QuikRow[]> {
  const problem = readOnlyProblem(query);
  if (problem) throw new QuikReportsError(`Только чтение: ${problem}`);
  if (!quikConfigured()) throw new QuikReportsError("QUIK Reports не настроен: нет QUIK_REPORTS_HOST / DB / USER в .env");

  let transaction: sql.Transaction | null = null;
  try {
    const pool = await connect();
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    const request = new sql.Request(transaction);
    params.forEach((value, index) => request.input(`p${index}`, value));
    const result = await request.query(query);
    return result.recordset as QuikRow[];
  } catch (error) {
    throw new QuikReportsError(quikErrorMessage(error));
  } finally {
    // Всегда откат: даже если бы запрос что-то изменил, изменение не сохранится.
    await transaction?.rollback().catch(() => undefined);
  }
}

/** Закрыть соединение (для разовых скриптов). */
export async function closeReports() {
  const pool = await poolPromise?.catch(() => null);
  poolPromise = null;
  await pool?.close();
}
