import "../../config";

/**
 * Настройки моста к базе QUIK Reports (MS SQL Server). Значения — из .env:
 *   QUIK_REPORTS_HOST, QUIK_REPORTS_PORT (1433), QUIK_REPORTS_INSTANCE (именованный экземпляр, необязательно),
 *   QUIK_REPORTS_DB, QUIK_REPORTS_USER, QUIK_REPORTS_PASSWORD — подключение;
 *   QUIK_REPORTS_ENCRYPT=on    — шифровать соединение (по умолчанию выключено: старые серверы SQL его не поддерживают);
 *   QUIK_REPORTS_TDS           — версия протокола для старого сервера: 7_1 (SQL 2000), 7_2 (2005), 7_3_A/7_3_B (2008);
 *                                пусто — новейшая;
 *   QUIK_REPORTS_SYNC=on       — включить синхронизацию эмитентов (по умолчанию выключена);
 *   QUIK_REPORTS_SYNC_MINUTES  — период опроса, минут (по умолчанию 15).
 *
 * Логину в SQL Server достаточно роли db_datareader: мост только читает.
 */
export const quikConfig = {
  enabled: process.env.QUIK_REPORTS_SYNC === "on",
  intervalMs: Math.max(1, Number(process.env.QUIK_REPORTS_SYNC_MINUTES ?? 15)) * 60 * 1000,
  host: process.env.QUIK_REPORTS_HOST?.trim() ?? "",
  port: Number(process.env.QUIK_REPORTS_PORT ?? 1433) || 1433,
  instance: process.env.QUIK_REPORTS_INSTANCE?.trim() ?? "",
  database: process.env.QUIK_REPORTS_DB?.trim() ?? "",
  user: process.env.QUIK_REPORTS_USER?.trim() ?? "",
  password: process.env.QUIK_REPORTS_PASSWORD ?? "",
  encrypt: process.env.QUIK_REPORTS_ENCRYPT === "on",
  tdsVersion: process.env.QUIK_REPORTS_TDS?.trim() ?? "",
  /** Запрос дольше минуты считаем зависшим. */
  timeoutMs: 60_000,
};

export function quikConfigured() {
  return Boolean(quikConfig.host && quikConfig.database && quikConfig.user);
}
