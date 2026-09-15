import { readFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { config } from "../config";
import { createSeedStore } from "../data/seed";
import { flattenNavSeed } from "../../../shared/nav-seed";
import { defaultHomeHubs, defaultSiteSettings } from "../../../shared/site-defaults";
import { managementSeed } from "../../../shared/management-seed";
import type { CmsStore } from "../../../shared/cms";
import { prisma } from "./prisma";
import { seedDatabase } from "./seed";

function resolveBackendRoot() {
  const fromSource = path.resolve(__dirname, "../..");
  if (existsSync(path.join(fromSource, "prisma", "schema.prisma"))) return fromSource;
  return path.resolve(__dirname, "../../../..");
}

async function waitForDb() {
  const started = Date.now();
  let lastError: unknown;
  while (Date.now() - started < 20_000) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw lastError;
}

function runMigrations() {
  try {
    execSync("npx prisma migrate deploy", {
      cwd: resolveBackendRoot(),
      stdio: "pipe",
      env: { ...process.env, DATABASE_URL: config.databaseUrl },
    });
  } catch (error) {
    const output = String(error instanceof Error ? error.message : error);
    if (output.includes("P3005")) {
      execSync("npx prisma migrate resolve --applied 20250820100000_init", {
        cwd: resolveBackendRoot(),
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: config.databaseUrl },
      });
      execSync("npx prisma migrate deploy", {
        cwd: resolveBackendRoot(),
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: config.databaseUrl },
      });
      return;
    }
    throw error;
  }
}

async function maybeImportJson(): Promise<CmsStore | null> {
  try {
    const raw = await readFile(config.dataFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<CmsStore>;
    const seed = createSeedStore();
    return {
      news: parsed.news ?? seed.news,
      slides: parsed.slides ?? seed.slides,
      media: parsed.media ?? seed.media,
      pages: parsed.pages ?? seed.pages,
      menu: parsed.menu ?? seed.menu,
      hubs: parsed.hubs ?? seed.hubs,
      management: parsed.management ?? seed.management,
      settings: parsed.settings ?? seed.settings,
      requests: parsed.requests ?? seed.requests,
      users: parsed.users ?? seed.users,
      visits: parsed.visits ?? [],
      audit: parsed.audit ?? [],
    };
  } catch {
    return null;
  }
}

export async function initDb() {
  await waitForDb();
  runMigrations();

  const count = await prisma.user.count();
  if (count === 0) {
    const imported = await maybeImportJson();
    await seedDatabase(imported ?? createSeedStore());
    console.log(imported ? "Prisma: импортированы данные из cms.json" : "Prisma: загружен начальный seed");
  }

  await ensureDefaultMenu();
  await ensureDefaultSettings();
  await ensureDefaultHubs();
  await ensureDefaultManagement();
}

const legacyHeaderLabels = new Set(["Частным лицам", "Бизнесу", "Исламские финансы", "О бирже"]);

async function ensureDefaultMenu() {
  const existing = await prisma.menuItem.findMany({ select: { id: true, label: true } });
  const ids = new Set(existing.map((item) => item.id));
  const seed = flattenNavSeed();

  for (const item of seed) {
    if (ids.has(item.id)) continue;
    await prisma.menuItem.create({
      data: {
        id: item.id,
        label: item.label,
        href: item.href,
        menuGroup: item.group,
        sortOrder: item.order,
        parentId: item.parentId,
      },
    });
  }

  for (const item of seed.filter((node) => !node.parentId)) {
    const row = existing.find((node) => node.id === item.id);
    if (!row || !legacyHeaderLabels.has(row.label)) continue;
    await prisma.menuItem.update({
      where: { id: item.id },
      data: {
        label: item.label,
        href: item.href,
        menuGroup: item.group,
        sortOrder: item.order,
      },
    });
  }
}

async function ensureDefaultSettings() {
  const count = await prisma.siteSettings.count();
  if (count > 0) return;
  const item = defaultSiteSettings;
  await prisma.siteSettings.create({
    data: {
      id: item.id,
      tagline: item.tagline,
      address: item.address,
      phones: item.phones,
      emails: item.emails,
      fax: item.fax,
      license: item.license,
      copyright: item.copyright,
      eduUrl: item.eduUrl,
      disclosurePhone: item.disclosurePhone,
      eduPhone: item.eduPhone,
      updatedAt: new Date(item.updatedAt),
    },
  });
}

async function ensureDefaultHubs() {
  const count = await prisma.homeHub.count();
  if (count > 0) return;
  for (const item of defaultHomeHubs) {
    await prisma.homeHub.create({
      data: {
        id: item.id,
        href: item.href,
        title: item.title,
        text: item.text,
        photo: item.photo,
        sortOrder: item.order,
      },
    });
  }
}

async function ensureDefaultManagement() {
  const existing = await prisma.managementPerson.findMany({ select: { id: true, i18n: true } });
  const ids = new Set(existing.map((item) => item.id));

  // Записи первого сева легли без i18n — дозаполняем, иначе их нельзя сохранить из админки.
  for (const row of existing) {
    if (Object.keys((row.i18n ?? {}) as object).length) continue;
    const seed = managementSeed.find((item) => item.id === row.id);
    if (seed) await prisma.managementPerson.update({ where: { id: row.id }, data: { i18n: seed.i18n ?? {} } });
  }

  for (const item of managementSeed) {
    if (ids.has(item.id)) continue;
    await prisma.managementPerson.create({
      data: {
        id: item.id,
        slug: item.slug,
        name: item.name,
        role: item.role,
        groupId: item.group,
        photo: item.photo,
        bio: item.bio,
        education: item.education,
        career: item.career,
        sortOrder: item.order,
        status: item.status,
        i18n: item.i18n ?? {},
        updatedAt: new Date(item.updatedAt),
      },
    });
  }
}

export async function dbHealth() {
  const rows = await prisma.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`;
  return {
    driver: "prisma" as const,
    database: String(rows[0]?.name ?? "kse"),
  };
}

export async function disconnectDb() {
  await prisma.$disconnect();
}
