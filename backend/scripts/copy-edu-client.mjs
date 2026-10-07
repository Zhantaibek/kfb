// tsc не копирует JS: сгенерированный Prisma-клиент учебного центра переносим в dist сами.
import { cpSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
cpSync(path.join(backendRoot, "src/edu/prisma-client"), path.join(backendRoot, "dist/backend/src/edu/prisma-client"), {
  recursive: true,
});
