import { config as loadEnv } from "dotenv";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(scriptDir, "..");

loadEnv({ path: path.join(backendRoot, ".env") });
loadEnv({ path: path.join(backendRoot, "../.env") });

const args = process.argv.slice(2).join(" ");
execSync(`npx prisma ${args}`, {
  cwd: backendRoot,
  stdio: "inherit",
  env: process.env,
});
