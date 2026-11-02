import { prisma } from "../../db/prisma";
import { insertAudit } from "../../db/repositories/cms.repository";
import { AppError } from "../../middleware/error";
import { disclosureSeed } from "../../../../shared/disclosure-seed";
import type { AdminSession } from "../../../../shared/cms";
import { KSE_ORIGIN, text } from "../kse-sync/parse";

/**
 * Центр раскрытия информации: существенные факты эмитентов. Источник — страницы эмитентов на kse.kg
 * (/ru/PublicInfo/<slug>, ссылки на карточки oi.kse.kg); плюс события, добавленные сотрудниками в админке.
 */

export type DisclosureRow = { date: string; title: string; url: string };

const SYNC_EVERY_MS = 6 * 60 * 60 * 1000;
/** Пауза между страницами эмитентов: ~200 страниц за цикл, kse.kg не нагружаем параллельными запросами. */
const PAUSE_MS = 1200;
const TIMEOUT_MS = 20_000;
export const DISCLOSURE_SNAPSHOT = "disclosure";

/**
 * События со страницы эмитента: «<strong>2026-08-21</strong> <a href="https://oi.kse.kg/report/…">Компания : Событие</a>».
 * Название компании перед « : » отбрасываем — на странице эмитента оно лишнее.
 */
export function parseDisclosure(html: string): DisclosureRow[] {
  const rows: DisclosureRow[] = [];
  const pattern = /<strong>\s*(\d{4}-\d{2}-\d{2})\s*<\/strong>\s*<a\s+href="(https?:\/\/oi\.kse\.kg\/report\/[\d/]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const full = text(match[3]);
    const split = full.indexOf(" : ");
    const title = (split >= 0 ? full.slice(split + 3) : full).trim();
    if (title) rows.push({ date: match[1], title, url: match[2].replace(/^http:/, "https:") });
  }
  return rows;
}

/** Первое заполнение пустой таблицы снимком, который раньше был вшит в сайт. */
export async function ensureDisclosureSeed() {
  if ((await prisma.disclosureEvent.count()) > 0) return;
  const issuers = new Set((await prisma.issuer.findMany({ select: { slug: true } })).map((row) => row.slug));
  const data = Object.entries(disclosureSeed)
    .filter(([slug]) => issuers.has(slug))
    .flatMap(([slug, events]) =>
      events.map((event) => ({ id: crypto.randomUUID(), issuerSlug: slug, date: event.date, title: event.title, url: event.url, source: "kse" })),
    );
  if (!data.length) return;
  const { count } = await prisma.disclosureEvent.createMany({ data, skipDuplicates: true });
  console.log(`Раскрытие информации: загружено ${count} событий из начального снимка`);
}

async function fetchIssuerPage(slug: string) {
  const response = await fetch(`${KSE_ORIGIN}/ru/PublicInfo/${encodeURIComponent(slug)}`, {
    headers: { "user-agent": "Mozilla/5.0 (KSE site sync)" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

let running = false;

/** Обход страниц всех эмитентов: новые события добавляются, существующие (в т.ч. ручные) не трогаются. */
export async function syncDisclosures(fetchPage: (slug: string) => Promise<string> = fetchIssuerPage, pauseMs = PAUSE_MS) {
  if (running) return null;
  running = true;
  const startedAt = new Date();
  let added = 0;
  const failed: string[] = [];
  try {
    const issuers = await prisma.issuer.findMany({ select: { slug: true }, orderBy: { slug: "asc" } });
    for (const { slug } of issuers) {
      try {
        const rows = parseDisclosure(await fetchPage(slug));
        if (rows.length) {
          const result = await prisma.disclosureEvent.createMany({
            data: rows.map((row) => ({ id: crypto.randomUUID(), issuerSlug: slug, ...row, source: "kse" })),
            skipDuplicates: true,
          });
          added += result.count;
        }
      } catch (error) {
        failed.push(`${slug}: ${error instanceof Error ? error.message : String(error)}`);
      }
      if (pauseMs) await new Promise((resolve) => setTimeout(resolve, pauseMs));
    }
    // Итог прогона — в общую таблицу снимков: по fetchedAt мониторинг видит, что синхронизация жива.
    const summary = { checked: issuers.length, added, failed: failed.length };
    const allFailed = issuers.length > 0 && failed.length === issuers.length;
    const error = failed.length ? `${failed.length} ошибок: ${failed.slice(0, 3).join("; ")}`.slice(0, 300) : null;
    await prisma.kseSnapshot.upsert({
      where: { key: DISCLOSURE_SNAPSHOT },
      create: { key: DISCLOSURE_SNAPSHOT, data: summary, sourceUrl: `${KSE_ORIGIN}/ru/PublicInfo`, fetchedAt: startedAt, checkedAt: new Date(), error },
      // Если не открылась ни одна страница, fetchedAt не сдвигаем — мониторинг увидит устаревание.
      update: allFailed ? { checkedAt: new Date(), error } : { data: summary, fetchedAt: startedAt, checkedAt: new Date(), error },
    });
    if (added || failed.length) console.log(`Раскрытие информации: +${added} событий, ошибок ${failed.length}`);
    return summary;
  } finally {
    running = false;
  }
}

/** Раз в 6 часов (первый прогон через минуту после старта). DISCLOSURE_SYNC=off или KSE_SYNC=off — выключить. */
export function startDisclosureSync() {
  if (process.env.KSE_SYNC === "off" || process.env.DISCLOSURE_SYNC === "off") return;
  const run = () => void syncDisclosures().catch((error) => console.warn("disclosure sync:", error));
  setTimeout(run, 60_000).unref();
  setInterval(run, SYNC_EVERY_MS).unref();
}

export async function disclosuresForIssuer(slug: string) {
  return prisma.disclosureEvent.findMany({
    where: { issuerSlug: { equals: slug, mode: "insensitive" } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: { id: true, date: true, title: true, url: true, source: true },
  });
}

export async function addDisclosure(session: AdminSession, input: { issuerSlug: string; date: string; title: string; url: string }) {
  const issuer = await prisma.issuer.findUnique({ where: { slug: input.issuerSlug }, select: { name: true } });
  if (!issuer) throw new AppError(`Эмитент «${input.issuerSlug}» не найден`, 400);
  if (await prisma.disclosureEvent.findUnique({ where: { url: input.url }, select: { id: true } })) {
    throw new AppError("Событие с этой ссылкой уже есть", 400);
  }
  const row = await prisma.disclosureEvent.create({ data: { id: crypto.randomUUID(), ...input, source: "manual" } });
  await insertAudit({ action: "create", entity: "disclosure", detail: `${issuer.name}: ${input.title}`, actor: session.email });
  return row;
}

export async function removeDisclosure(session: AdminSession, id: string) {
  const row = await prisma.disclosureEvent.findUnique({ where: { id } });
  if (!row) throw new Error("not-found");
  await prisma.disclosureEvent.delete({ where: { id } });
  await insertAudit({ action: "delete", entity: "disclosure", detail: `${row.issuerSlug}: ${row.title}`, actor: session.email });
}
