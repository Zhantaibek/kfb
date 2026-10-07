import { createApp } from "./app";
import { config } from "./config";
import { initDb } from "./db/postgres";
import { ensureAuthAccounts } from "./modules/auth/auth.service";
import { startKseSync } from "./modules/kse-sync/sync";

async function main() {
  await initDb();
  await ensureAuthAccounts();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`KSE API http://localhost:${config.port}`);
  });
  // Живые данные торгов с kse.kg — в фоне, раз в 15 минут.
  startKseSync();
}

main().catch((error) => {
  console.error("Не удалось запустить API. Поднимите PostgreSQL: npm run db:up");
  console.error(error);
  process.exit(1);
});
