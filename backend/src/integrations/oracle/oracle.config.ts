import { existsSync } from "node:fs";
import path from "node:path";
import "../../config";

/**
 * Настройки моста к торговой системе (Oracle 8i). Значения — из .env:
 *   ORACLE_DB_HOST, ORACLE_DB_PORT, ORACLE_DB_SID, ORACLE_DB_USER, ORACLE_DB_PASSWORD — подключение;
 *   ORACLE_SYNC=on        — включить синхронизацию (по умолчанию выключена: без Java и доступа к сети биржи
 *                           она бы только сыпала ошибками);
 *   ORACLE_SYNC_MINUTES   — период опроса, минут (по умолчанию 5);
 *   JAVA_BIN              — путь к java 8 (по умолчанию «java» из PATH);
 *   ORACLE_BRIDGE_DIR     — папка с oracle-query.js и jdbc/*.zip (по умолчанию ищется рядом с кодом).
 */

/** Папка моста: в исходниках — src/integrations/oracle/bridge, в Docker-образе — backend/oracle-bridge. */
function bridgeDir() {
  if (process.env.ORACLE_BRIDGE_DIR) return path.resolve(process.env.ORACLE_BRIDGE_DIR);
  const candidates = [
    path.resolve(__dirname, "bridge"),
    path.resolve(process.cwd(), "src/integrations/oracle/bridge"),
    path.resolve(process.cwd(), "backend/src/integrations/oracle/bridge"),
    path.resolve(process.cwd(), "oracle-bridge"),
  ];
  return candidates.find((dir) => existsSync(path.join(dir, "oracle-query.js"))) ?? candidates[0];
}

const dir = bridgeDir();

export const oracleConfig = {
  enabled: process.env.ORACLE_SYNC === "on",
  intervalMs: Math.max(1, Number(process.env.ORACLE_SYNC_MINUTES ?? 5)) * 60 * 1000,
  host: process.env.ORACLE_DB_HOST ?? "",
  port: process.env.ORACLE_DB_PORT ?? "1521",
  sid: process.env.ORACLE_DB_SID ?? "",
  user: process.env.ORACLE_DB_USER ?? "",
  password: process.env.ORACLE_DB_PASSWORD ?? "",
  javaBin: process.env.JAVA_BIN ?? "java",
  bridgeScript: path.join(dir, "oracle-query.js"),
  classPath: [path.join(dir, "jdbc", "classes12.zip"), path.join(dir, "jdbc", "nls_charset12.zip")].join(path.delimiter),
  /** Запрос к Oracle дольше минуты считаем зависшим. */
  timeoutMs: 60_000,
};

export function oracleConfigured() {
  return Boolean(oracleConfig.host && oracleConfig.sid && oracleConfig.user);
}
