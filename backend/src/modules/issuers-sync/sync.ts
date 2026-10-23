import { randomUUID } from "node:crypto";
import type { z } from "zod";
import { prisma } from "../../db/prisma";
import { invalidatePublicContent } from "../../store/public-cache";
import { issuerItemSchema, listingItemSchema } from "../../validation/cms";

/**
 * Эмитенты и листинг приходят из внешнего API, а не добавляются кнопкой в админке.
 * Адреса — ISSUERS_API_URL и LISTING_API_URL в .env; пусто — синхронизация выключена.
 *
 * Оба адреса отдают JSON: массив записей (или { items: [...] }) с полями как в CMS:
 *   эмитент — slug, name, activity, director, position, address, phone, registrar, security, count, price, status, order;
 *   бумага  — code, category (A | B | C | delisted), name, issuerSlug, security, price, cap, count, doc, symbols, industry,
 *             activity, listedAt (ГГГГ-ММ-ДД), auditor, registrar, marketMaker, documents [{ name, url }], order.
 * Каждая запись проверяется теми же правилами, что и форма админки; неверные пропускаются с записью в лог.
 * Записи сопоставляются по slug (эмитент) и code (бумага): новые добавляются, у существующих обновляются только поля,
 * которые API прислал, — остальные правки из админки сохраняются. Записи, которых нет в ответе, не удаляются.
 * Всё по одному источнику пишется одной транзакцией: при ошибке база остаётся как была.
 */

const INTERVAL_MS = 15 * 60 * 1000;
const TIMEOUT_MS = 25_000;

type Row = Record<string, unknown>;

async function fetchRows(url: string): Promise<Row[]> {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = (await response.json()) as unknown;
  const rows = Array.isArray(body) ? body : (body as { items?: unknown })?.items;
  if (!Array.isArray(rows)) throw new Error("ожидался массив записей или { items: [...] }");
  return rows.filter((row): row is Row => !!row && typeof row === "object" && !Array.isArray(row));
}

/** Проверка строки по схеме формы админки; неверную пропускаем и пишем в лог причину. */
export function validRows<S extends z.ZodType>(rows: Row[], schema: S, label: string, keyOf: (row: Row) => unknown) {
  const out: { raw: Row; item: z.infer<S> }[] = [];
  for (const raw of rows) {
    const parsed = schema.safeParse(raw);
    if (parsed.success) out.push({ raw, item: parsed.data });
    else console.warn(`${label}: пропущена запись «${String(keyOf(raw) ?? "?")}» — ${parsed.error.issues[0]?.message}`);
  }
  return out;
}

/** В update попадают только поля, которые есть в ответе API (поле order → колонка sortOrder). */
export function presentFields<T extends Record<string, unknown>>(raw: Row, data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => key in raw || (key === "sortOrder" && ("order" in raw || "sortOrder" in raw))),
  ) as Partial<T>;
}

/** Ссылки на документы — только http(s) или пути сайта, чтобы в href не попал javascript: и подобное. */
export function safeUrl(value: string) {
  return /^(https?:\/\/|\/(?!\/))/i.test(value) ? value : "";
}

async function syncIssuers(url: string) {
  const rows = validRows(await fetchRows(url), issuerItemSchema, "issuers sync", (row) => row.slug);
  const now = new Date();
  await prisma.$transaction(
    rows.map(({ raw, item }, index) => {
      const { order, slug, ...fields } = item;
      const data = { ...fields, sortOrder: "order" in raw ? order : index + 1, updatedAt: now };
      return prisma.issuer.upsert({
        where: { slug },
        create: { id: randomUUID(), slug, ...data },
        update: { ...presentFields(raw, data), updatedAt: now },
      });
    }),
  );
  return rows.length;
}

async function syncListing(url: string) {
  const rows = validRows(await fetchRows(url), listingItemSchema, "listing sync", (row) => row.code);
  const now = new Date();
  const known = new Set((await prisma.issuer.findMany({ select: { slug: true } })).map((item) => item.slug));
  await prisma.$transaction(
    rows.map(({ raw, item }, index) => {
      const { order, code, issuerSlug, ...fields } = item;
      const data = {
        ...fields,
        doc: safeUrl(fields.doc),
        documents: fields.documents.map((doc) => ({ name: doc.name, url: safeUrl(doc.url) })),
        sortOrder: "order" in raw ? order : index + 1,
        updatedAt: now,
      };
      // Привязку к эмитенту меняем, только если API прислал существующий slug (или явно пустой — отвязать).
      // Неизвестный slug не затирает связь, сделанную в админке.
      const link = issuerSlug && known.has(issuerSlug) ? { issuerSlug } : issuerSlug === "" && "issuerSlug" in raw ? { issuerSlug: null } : {};
      if (issuerSlug && !known.has(issuerSlug)) console.warn(`listing sync: у бумаги ${code} неизвестный эмитент «${issuerSlug}»`);
      return prisma.listingEntry.upsert({
        where: { code },
        create: { id: randomUUID(), code, ...data, issuerSlug: "issuerSlug" in link ? link.issuerSlug : null },
        update: { ...presentFields(raw, data), ...link, updatedAt: now },
      });
    }),
  );
  return rows.length;
}

export function issuersApiConfig() {
  return {
    issuersUrl: process.env.ISSUERS_API_URL?.trim() ?? "",
    listingUrl: process.env.LISTING_API_URL?.trim() ?? "",
  };
}

let running = false;

export async function syncIssuersAndListing() {
  const { issuersUrl, listingUrl } = issuersApiConfig();
  if (running || (!issuersUrl && !listingUrl)) return;
  running = true;
  try {
    // Сначала эмитенты: бумаги листинга ссылаются на них по slug. Если эмитенты не загрузились —
    // листинг в этот раз не трогаем, иначе он сверялся бы с неполным списком.
    if (issuersUrl) {
      try {
        console.log(`issuers sync: ${await syncIssuers(issuersUrl)} эмитентов`);
      } catch (error) {
        console.warn(`issuers sync: ${error instanceof Error ? error.message : String(error)}`);
        return;
      }
    }
    if (listingUrl) {
      try {
        console.log(`listing sync: ${await syncListing(listingUrl)} бумаг`);
      } catch (error) {
        console.warn(`listing sync: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } finally {
    running = false;
    invalidatePublicContent();
  }
}

/** Запуск при старте бэкенда и далее раз в 15 минут — только если задан хотя бы один адрес API. */
export function startIssuersSync() {
  const { issuersUrl, listingUrl } = issuersApiConfig();
  if (!issuersUrl && !listingUrl) return;
  setTimeout(() => void syncIssuersAndListing(), 5_000);
  setInterval(() => void syncIssuersAndListing(), INTERVAL_MS).unref();
}
