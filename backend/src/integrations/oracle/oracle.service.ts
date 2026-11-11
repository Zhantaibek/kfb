import { execFile } from "node:child_process";
import { oracleConfig, oracleConfigured } from "./oracle.config";

/**
 * Запрос к Oracle 8i через мост bridge/oracle-query.js (Java 8 + старый JDBC-драйвер, см. комментарий в скрипте).
 * SQL — только из кода (запросы в oracle.trades.ts), значения — параметрами «?», поэтому инъекции исключены.
 * Учётные данные передаются переменными окружения дочернего процесса и в аргументы/логи не попадают.
 */

type BridgeOutput = { columns: string[]; rows: (string | null)[][] };

export type OracleRow = Record<string, string | null>;

export class OracleBridgeError extends Error {}

/** Первая осмысленная строка ошибки моста: «ORA-00942: …» или текст исключения без стека. */
export function bridgeErrorMessage(stderr: string) {
  const lines = stderr.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const ora = lines.find((line) => /ORA-\d{5}/.test(line));
  if (ora) return ora.slice(ora.indexOf("ORA-"));
  const cause = lines.find((line) => !line.startsWith("at ") && /\S/.test(line));
  return (cause ?? "неизвестная ошибка моста").replace(/^.*?Exception:\s*/, "").slice(0, 300);
}

/** Строки моста { columns, rows } → массив объектов по именам колонок. */
export function toObjects(output: BridgeOutput): OracleRow[] {
  return output.rows.map((row) => Object.fromEntries(output.columns.map((column, i) => [column, row[i] ?? null])));
}

export function queryOracle(sql: string, params: (string | number)[] = [], maxRows = 0): Promise<OracleRow[]> {
  if (!oracleConfigured()) return Promise.reject(new OracleBridgeError("Oracle не настроен: нет ORACLE_DB_HOST / SID / USER в .env"));
  const env = {
    ...process.env,
    ORACLE_URL: `jdbc:oracle:thin:@${oracleConfig.host}:${oracleConfig.port}:${oracleConfig.sid}`,
    ORACLE_USER: oracleConfig.user,
    ORACLE_PASSWORD: oracleConfig.password,
    ORACLE_SQL: sql,
    ORACLE_PARAMS: JSON.stringify(params.map(String)),
    ORACLE_MAX_ROWS: String(maxRows),
  };
  const args = ["-Dfile.encoding=UTF-8", "-cp", oracleConfig.classPath, "jdk.nashorn.tools.Shell", oracleConfig.bridgeScript];

  return new Promise((resolve, reject) => {
    execFile(
      oracleConfig.javaBin,
      args,
      { env, timeout: oracleConfig.timeoutMs, maxBuffer: 64 * 1024 * 1024, encoding: "utf8", windowsHide: true },
      (error, stdout, stderr) => {
        if (error) {
          const reason = (error as NodeJS.ErrnoException).code === "ENOENT" ? `не найдена Java (${oracleConfig.javaBin})` : bridgeErrorMessage(stderr || error.message);
          reject(new OracleBridgeError(reason));
          return;
        }
        try {
          resolve(toObjects(JSON.parse(stdout) as BridgeOutput));
        } catch {
          reject(new OracleBridgeError("мост вернул не JSON"));
        }
      },
    );
  });
}
