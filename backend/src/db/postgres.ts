import { readFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { config } from "../config";
import { createSeedStore } from "../data/seed";
import { allNavSeed } from "../../../shared/nav-seed";
import { defaultHomeHubs, defaultSiteSettings } from "../../../shared/site-defaults";
import { managementSeed } from "../../../shared/management-seed";
import { partnersSeed } from "../../../shared/partners-seed";
import { ensureDefaultLandings } from "./landing";
import { issuerSeedRows } from "../../../shared/issuers-seed";
import { listingSeedRows } from "../../../shared/listing-seed";
import { ksePageSeed } from "../../../shared/kse-pages-seed";
import { sanitizeRichHtml } from "../utils/sanitize-html";
import type { CmsStore } from "../../../shared/cms";
import { prisma } from "./prisma";
import { issuerCreateData, listingCreateData, partnerCreateData, seedDatabase } from "./seed";

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

function eduDatabaseUrl() {
  if (process.env.EDU_DATABASE_URL) return process.env.EDU_DATABASE_URL;
  const url = new URL(config.databaseUrl);
  url.searchParams.set("schema", "edu");
  return url.toString();
}

/** Учебный центр — своя Prisma-схема в схеме `edu` той же базы. */
function runEduMigrations() {
  execSync("npx prisma migrate deploy --schema prisma/edu/schema.prisma", {
    cwd: resolveBackendRoot(),
    stdio: "pipe",
    env: { ...process.env, EDU_DATABASE_URL: eduDatabaseUrl() },
  });
}

function runMigrations() {
  runEduMigrations();
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
      partners: parsed.partners ?? seed.partners,
      sustainableBonds: parsed.sustainableBonds ?? seed.sustainableBonds,
      esgReports: parsed.esgReports ?? seed.esgReports,
      verifiers: parsed.verifiers ?? seed.verifiers,
      gcbParticipants: parsed.gcbParticipants ?? seed.gcbParticipants,
      landingSections: parsed.landingSections ?? seed.landingSections,
      issuers: parsed.issuers ?? seed.issuers,
      listing: parsed.listing ?? seed.listing,
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
  await ensureDefaultIssuers();
  await ensureDefaultPartners();
  await ensureDefaultLandings();
  await ensureKsePages();
}

const legacyHeaderLabels = new Set(["Частным лицам", "Бизнесу", "Исламские финансы", "О бирже"]);

async function ensureDefaultMenu() {
  const existing = await prisma.menuItem.findMany({ select: { id: true, label: true } });
  const ids = new Set(existing.map((item) => item.id));
  const seed = allNavSeed();

  for (const item of seed) {
    if (ids.has(item.id)) continue;
    // Родителя удалили в админке — подпункт без него не создаём (parent_id — внешний ключ).
    if (item.parentId && !ids.has(item.parentId)) continue;
    ids.add(item.id);
    await prisma.menuItem.create({
      data: {
        id: item.id,
        label: item.label,
        href: item.href,
        menuGroup: item.group,
        sortOrder: item.order,
        parentId: item.parentId,
        i18n: item.i18n ?? {},
      },
    });
  }

  // Пункт «Нормативная база → Центр раскрытия информации» вёл на /disclosure, а на kse.kg это отдельная страница.
  await prisma.menuItem.updateMany({
    where: { id: "menu-reg-disclosure", href: "/disclosure" },
    data: { href: "/regulations/disclosure" },
  });
  // «Статистика торгов» в шапке вела сразу на итоги торгов, а на kse.kg это раздел с карточками.
  await prisma.menuItem.updateMany({
    where: { id: "menu-top-market", href: "/market" },
    data: { href: "/statistics" },
  });

  await fixMenuOrderCollisions(seed);

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

/**
 * Новые пункты из seed встают на свой номер и могут совпасть с уже существующими.
 * Если в группе есть одинаковые номера — раскладываем её по порядку seed, ручные пункты ставим в конец.
 * Группы без совпадений не трогаем, чтобы не сбить сортировку из админки.
 */
async function fixMenuOrderCollisions(seed: ReturnType<typeof allNavSeed>) {
  const rows = await prisma.menuItem.findMany({ select: { id: true, parentId: true, menuGroup: true, sortOrder: true } });
  const seedOrder = new Map(seed.map((item) => [item.id, item.order]));
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = `${row.menuGroup}:${row.parentId ?? ""}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  for (const siblings of groups.values()) {
    if (new Set(siblings.map((row) => row.sortOrder)).size === siblings.length) continue;
    const ordered = [...siblings].sort(
      (a, b) =>
        (seedOrder.get(a.id) ?? 10_000 + a.sortOrder) - (seedOrder.get(b.id) ?? 10_000 + b.sortOrder),
    );
    for (const [index, row] of ordered.entries()) {
      if (row.sortOrder !== index + 1) {
        await prisma.menuItem.update({ where: { id: row.id }, data: { sortOrder: index + 1 } });
      }
    }
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
      facebookUrl: item.facebookUrl,
      instagramUrl: item.instagramUrl,
      telegramUrl: item.telegramUrl,
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

// Партнёры раньше были в коде фронтенда (data/resources.ts) — при первом запуске переносим в БД.
async function ensureDefaultPartners() {
  if ((await prisma.partner.count()) > 0) return;
  await prisma.partner.createMany({ data: partnersSeed.map(partnerCreateData), skipDuplicates: true });
}

// Эмитенты и листинг раньше жили в коде фронтенда — при первом запуске переносим их в БД.
async function ensureDefaultIssuers() {
  const now = new Date().toISOString();
  if ((await prisma.issuer.count()) === 0) {
    await prisma.issuer.createMany({ data: issuerSeedRows(now).map(issuerCreateData), skipDuplicates: true });
  }
  if ((await prisma.listingEntry.count()) === 0) {
    await prisma.listingEntry.createMany({ data: listingSeedRows(now).map(listingCreateData), skipDuplicates: true });
  }
}

// Тексты разделов, перенесённые с kse.kg (backend/scripts/import-kse-pages.mjs).
// Создаём страницу, только если по адресу ещё ничего нет, — правки из админки не трогаем.
async function ensureKsePages() {
  const existing = new Set((await prisma.page.findMany({ select: { path: true } })).map((row) => row.path));
  const now = new Date();
  for (const item of ksePageSeed) {
    if (existing.has(item.path)) continue;
    const i18n = Object.fromEntries(
      Object.entries(item.i18n).map(([lang, pack]) => [lang, { ...pack, body: sanitizeRichHtml(pack?.body ?? "") }]),
    );
    await prisma.page.create({
      data: {
        id: `page-kse${item.path.replace(/[^a-z0-9]+/gi, "-")}`,
        path: item.path,
        title: item.title,
        lead: item.lead,
        body: sanitizeRichHtml(item.body),
        status: "published",
        i18n,
        updatedAt: now,
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
