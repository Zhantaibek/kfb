import { createApp } from "./app";
import { config } from "./config";
import { initDb } from "./db/postgres";
import { ensureAuthAccounts } from "./modules/auth/auth.service";
import { startIssuersSync } from "./modules/issuers-sync/sync";
import { startKseSync } from "./modules/kse-sync/sync";
import { pruneOldAudit } from "./db/repositories/cms.repository";

async function main() {
  await initDb();
  await ensureAuthAccounts();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`KSE API http://localhost:${config.port}`);
  });
  // Живые данные торгов с kse.kg — в фоне, раз в 15 минут.
  startKseSync();
  // Эмитенты и листинг — из внешнего API (ISSUERS_API_URL / LISTING_API_URL), если адреса заданы.
  startIssuersSync();
  // Журнал аудита — записи старше года удаляем раз в сутки.
  const pruneAudit = () => void pruneOldAudit().catch((error) => console.warn("audit prune:", error));
  pruneAudit();
  setInterval(pruneAudit, 24 * 60 * 60 * 1000).unref();
}

main().catch((error) => {
  console.error("Не удалось запустить API. Поднимите PostgreSQL: npm run db:up");
  console.error(error);
  process.exit(1);
});
