import { createApp } from "./app";
import { config } from "./config";
import { initDb } from "./db/postgres";
import { ensureAuthAccounts } from "./modules/auth/auth.service";

async function main() {
  await initDb();
  await ensureAuthAccounts();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`KSE API http://localhost:${config.port}`);
  });
}

main().catch((error) => {
  console.error("Не удалось запустить API. Поднимите PostgreSQL: npm run db:up");
  console.error(error);
  process.exit(1);
});
