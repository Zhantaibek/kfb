/**
 * Лендинги «Сектор устойчивого развития» и «Инвестиции в ГЦБ»: бумаги сектора, ESG-отчёты, верификаторы,
 * участники торгов ГЦБ и текстовые блоки. Все пять таблиц обслуживаются здесь, репозиторий только делегирует.
 */
import type { EsgReport, GcbParticipant, LandingSection, SustainableBond, Verifier } from "@prisma/client";
import type {
  CmsEsgReport,
  CmsGcbParticipant,
  CmsLandingSection,
  CmsStore,
  CmsSustainableBond,
  CmsVerifier,
} from "../../../shared/cms";
import {
  esgReportsSeed,
  gcbNewsSeed,
  gcbParticipantsSeed,
  landingSectionsSeed,
  sustainableBondsSeed,
  verifiersSeed,
} from "../../../shared/landings-seed";
import { prisma } from "./prisma";

export const landingCollections = ["sustainableBonds", "esgReports", "verifiers", "gcbParticipants", "landingSections"] as const;
export type LandingCollection = (typeof landingCollections)[number];

export function isLandingCollection(collection: string): collection is LandingCollection {
  return (landingCollections as readonly string[]).includes(collection);
}

type Row = Record<string, unknown>;

const iso = (value: Date) => value.toISOString();
const i18nOf = (value: unknown) => (value && typeof value === "object" ? (value as CmsSustainableBond["i18n"]) : {});
const status = (value: string) => value as CmsSustainableBond["status"];

// ── БД → CMS

export function toCmsSustainableBond(row: SustainableBond): CmsSustainableBond {
  return {
    id: row.id,
    name: row.name,
    issuerSlug: row.issuerSlug ?? "",
    regNumber: row.regNumber,
    kind: row.kind,
    volume: row.volume,
    nominal: row.nominal,
    currency: row.currency,
    yieldRate: row.yieldRate,
    startDate: row.startDate,
    endDate: row.endDate,
    category: row.category,
    standard: row.standard,
    order: row.sortOrder,
    status: status(row.status),
    i18n: i18nOf(row.i18n),
    updatedAt: iso(row.updatedAt),
  };
}

export function toCmsEsgReport(row: EsgReport): CmsEsgReport {
  return { id: row.id, title: row.title, file: row.file, order: row.sortOrder, status: status(row.status), i18n: i18nOf(row.i18n), updatedAt: iso(row.updatedAt) };
}

export function toCmsVerifier(row: Verifier): CmsVerifier {
  return { id: row.id, name: row.name, site: row.site, order: row.sortOrder, status: status(row.status), i18n: i18nOf(row.i18n), updatedAt: iso(row.updatedAt) };
}

export function toCmsGcbParticipant(row: GcbParticipant): CmsGcbParticipant {
  return {
    id: row.id,
    title: row.title,
    type: row.type === "bank" ? "bank" : "broker",
    address: row.address,
    phones: row.phones,
    emails: row.emails,
    website: row.website,
    order: row.sortOrder,
    status: status(row.status),
    i18n: i18nOf(row.i18n),
    updatedAt: iso(row.updatedAt),
  };
}

export function toCmsLandingSection(row: LandingSection): CmsLandingSection {
  return {
    id: row.id,
    page: row.page === "gcb" ? "gcb" : "sustainable",
    key: row.key,
    kicker: row.kicker,
    title: row.title,
    text: row.text,
    items: row.items,
    link: row.link,
    photo: row.photo,
    order: row.sortOrder,
    i18n: i18nOf(row.i18n),
    updatedAt: iso(row.updatedAt),
  };
}

// ── CMS → БД (без id)

const common = (row: { order: number; i18n?: unknown; updatedAt: string }) => ({
  sortOrder: row.order,
  i18n: (row.i18n ?? {}) as object,
  updatedAt: new Date(row.updatedAt),
});

export function sustainableBondData(row: CmsSustainableBond) {
  return {
    name: row.name,
    issuerSlug: row.issuerSlug || null,
    regNumber: row.regNumber,
    kind: row.kind,
    volume: row.volume,
    nominal: row.nominal,
    currency: row.currency,
    yieldRate: row.yieldRate,
    startDate: row.startDate,
    endDate: row.endDate,
    category: row.category,
    standard: row.standard,
    status: row.status,
    ...common(row),
  };
}

export function esgReportData(row: CmsEsgReport) {
  return { title: row.title, file: row.file, status: row.status, ...common(row) };
}

export function verifierData(row: CmsVerifier) {
  return { name: row.name, site: row.site, status: row.status, ...common(row) };
}

export function gcbParticipantData(row: CmsGcbParticipant) {
  return {
    title: row.title,
    type: row.type,
    address: row.address,
    phones: row.phones,
    emails: row.emails,
    website: row.website,
    status: row.status,
    ...common(row),
  };
}

export function landingSectionData(row: CmsLandingSection) {
  return {
    page: row.page,
    key: row.key,
    kicker: row.kicker,
    title: row.title,
    text: row.text,
    items: row.items,
    link: row.link,
    photo: row.photo,
    ...common(row),
  };
}

// ── Операции

export async function readLandingStore(): Promise<Pick<CmsStore, LandingCollection>> {
  const order = { sortOrder: "asc" } as const;
  const [bonds, reports, verifiers, participants, sections] = await Promise.all([
    prisma.sustainableBond.findMany({ orderBy: order }),
    prisma.esgReport.findMany({ orderBy: order }),
    prisma.verifier.findMany({ orderBy: order }),
    prisma.gcbParticipant.findMany({ orderBy: [{ type: "desc" }, order] }),
    prisma.landingSection.findMany({ orderBy: [{ page: "asc" }, order] }),
  ]);
  return {
    sustainableBonds: bonds.map(toCmsSustainableBond),
    esgReports: reports.map(toCmsEsgReport),
    verifiers: verifiers.map(toCmsVerifier),
    gcbParticipants: participants.map(toCmsGcbParticipant),
    landingSections: sections.map(toCmsLandingSection),
  };
}

export async function createLandingItem(collection: LandingCollection, item: Row) {
  const id = String(item.id);
  switch (collection) {
    case "sustainableBonds":
      await prisma.sustainableBond.create({ data: { id, ...sustainableBondData(item as unknown as CmsSustainableBond) } });
      break;
    case "esgReports":
      await prisma.esgReport.create({ data: { id, ...esgReportData(item as unknown as CmsEsgReport) } });
      break;
    case "verifiers":
      await prisma.verifier.create({ data: { id, ...verifierData(item as unknown as CmsVerifier) } });
      break;
    case "gcbParticipants":
      await prisma.gcbParticipant.create({ data: { id, ...gcbParticipantData(item as unknown as CmsGcbParticipant) } });
      break;
    case "landingSections":
      await prisma.landingSection.create({ data: { id, ...landingSectionData(item as unknown as CmsLandingSection) } });
      break;
  }
}

export async function updateLandingItem(collection: LandingCollection, id: string, item: Row) {
  const where = { id };
  switch (collection) {
    case "sustainableBonds":
      await prisma.sustainableBond.update({ where, data: sustainableBondData(item as unknown as CmsSustainableBond) });
      break;
    case "esgReports":
      await prisma.esgReport.update({ where, data: esgReportData(item as unknown as CmsEsgReport) });
      break;
    case "verifiers":
      await prisma.verifier.update({ where, data: verifierData(item as unknown as CmsVerifier) });
      break;
    case "gcbParticipants":
      await prisma.gcbParticipant.update({ where, data: gcbParticipantData(item as unknown as CmsGcbParticipant) });
      break;
    case "landingSections":
      await prisma.landingSection.update({ where, data: landingSectionData(item as unknown as CmsLandingSection) });
      break;
  }
}

export async function deleteLandingItem(collection: LandingCollection, id: string) {
  const where = { id };
  switch (collection) {
    case "sustainableBonds":
      await prisma.sustainableBond.delete({ where });
      break;
    case "esgReports":
      await prisma.esgReport.delete({ where });
      break;
    case "verifiers":
      await prisma.verifier.delete({ where });
      break;
    case "gcbParticipants":
      await prisma.gcbParticipant.delete({ where });
      break;
    case "landingSections":
      await prisma.landingSection.delete({ where });
      break;
  }
}

export async function findLandingItem(collection: LandingCollection, id: string): Promise<Row | null> {
  const where = { id };
  switch (collection) {
    case "sustainableBonds": {
      const row = await prisma.sustainableBond.findUnique({ where });
      return row ? (toCmsSustainableBond(row) as unknown as Row) : null;
    }
    case "esgReports": {
      const row = await prisma.esgReport.findUnique({ where });
      return row ? (toCmsEsgReport(row) as unknown as Row) : null;
    }
    case "verifiers": {
      const row = await prisma.verifier.findUnique({ where });
      return row ? (toCmsVerifier(row) as unknown as Row) : null;
    }
    case "gcbParticipants": {
      const row = await prisma.gcbParticipant.findUnique({ where });
      return row ? (toCmsGcbParticipant(row) as unknown as Row) : null;
    }
    case "landingSections": {
      const row = await prisma.landingSection.findUnique({ where });
      return row ? (toCmsLandingSection(row) as unknown as Row) : null;
    }
  }
}

/** Файл из медиатеки удалили — отчёты и блоки на него больше не ссылаются. */
export async function detachLandingMedia(url: string) {
  await prisma.esgReport.updateMany({ where: { file: url }, data: { file: "" } });
  await prisma.landingSection.updateMany({ where: { photo: url }, data: { photo: "" } });
}

/**
 * Данные лендингов раньше были в коде фронтенда — при первом запуске переносим в БД.
 * Пустую таблицу заполняем целиком; в блоки текста дописываем только недостающие ключи, правки админки не трогаем.
 */
export async function ensureDefaultLandings() {
  const issuers = new Set((await prisma.issuer.findMany({ select: { slug: true } })).map((row) => row.slug));
  if ((await prisma.sustainableBond.count()) === 0) {
    await prisma.sustainableBond.createMany({
      data: sustainableBondsSeed.map((row) => ({
        id: row.id,
        ...sustainableBondData(row),
        // Эмитента в базе нет (удалили) — без ссылки на ЦРИ, иначе внешний ключ не пустит строку.
        issuerSlug: issuers.has(row.issuerSlug) ? row.issuerSlug : null,
      })),
    });
  }
  if ((await prisma.esgReport.count()) === 0) {
    await prisma.esgReport.createMany({ data: esgReportsSeed.map((row) => ({ id: row.id, ...esgReportData(row) })) });
  }
  if ((await prisma.verifier.count()) === 0) {
    await prisma.verifier.createMany({ data: verifiersSeed.map((row) => ({ id: row.id, ...verifierData(row) })) });
  }
  if ((await prisma.gcbParticipant.count()) === 0) {
    await prisma.gcbParticipant.createMany({ data: gcbParticipantsSeed.map((row) => ({ id: row.id, ...gcbParticipantData(row) })) });
  }
  const firstRun = (await prisma.landingSection.count()) === 0;
  await prisma.landingSection.createMany({
    data: landingSectionsSeed.map((row) => ({ id: row.id, ...landingSectionData(row) })),
    skipDuplicates: true,
  });
  // Новости по ГЦБ ложатся в общую ленту один раз — вместе с первыми блоками лендинга; удалённые в админке не возвращаем.
  if (!firstRun) return;
  for (const item of gcbNewsSeed) {
    if (await prisma.news.findFirst({ where: { OR: [{ id: item.id }, { slug: item.slug }] }, select: { id: true } })) continue;
    await prisma.news.create({
      data: {
        id: item.id,
        slug: item.slug,
        date: item.date,
        tag: item.tag,
        kind: item.kind,
        status: item.status,
        title: item.title,
        excerpt: item.excerpt,
        body: item.body,
        photo: item.photo,
        issuerSlug: null,
        i18n: item.i18n ?? {},
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
  }
}
