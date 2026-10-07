import { randomUUID } from "node:crypto";
import { prisma } from "../../db/prisma";

/** Посещения сайта — как в админке cds.kg: сводка, графики и список с фильтром по периоду. */

const DAY_MS = 24 * 60 * 60 * 1000;
const SERIES_DAYS = 14;
/** Повтор той же страницы тем же посетителем раньше — не новое посещение (обновления страницы). */
const REPEAT_WINDOW_MS = 30 * 60 * 1000;
/** Старше двух лет посещения не храним. */
const KEEP_DAYS = 730;

export type VisitPeriod = "today" | "week" | "month" | "all";
export type DeviceType = "pc" | "phone" | "tablet";

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|monitor|curl|wget|python-requests/i;

export function deviceFromUserAgent(ua: string | null | undefined): DeviceType | null {
  if (!ua?.trim()) return null;
  const s = ua.toLowerCase();
  const android = s.includes("android");
  if (s.includes("ipad") || s.includes("tablet") || s.includes("playbook") || s.includes("silk") || (android && !s.includes("mobile"))) {
    return "tablet";
  }
  if (s.includes("iphone") || s.includes("ipod") || s.includes("windows phone") || s.includes("opera mini") || s.includes("mobile")) {
    return "phone";
  }
  return "pc";
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function periodSince(period: VisitPeriod): Date | undefined {
  const today = startOfToday();
  if (period === "today") return today;
  if (period === "week") return new Date(today.getTime() - 6 * DAY_MS);
  if (period === "month") return new Date(today.getFullYear(), today.getMonth(), 1);
  return undefined;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

let lastCleanup = 0;

export async function recordVisit(input: { path: string; visitorId?: string; ip: string | null; userAgent: string | null }) {
  const path = input.path.replace(/\/+$/, "") || "/";
  if (path.startsWith("/admin") || path.startsWith("/api")) return { recorded: false };
  if (input.userAgent && BOT_RE.test(input.userAgent)) return { recorded: false };

  const now = new Date();
  if (input.visitorId) {
    const repeat = await prisma.visit.findFirst({
      where: { path, visitorId: input.visitorId, at: { gte: new Date(now.getTime() - REPEAT_WINDOW_MS) } },
      select: { id: true },
    });
    if (repeat) return { recorded: false };
  }

  await prisma.visit.create({
    data: {
      id: randomUUID(),
      path: path.slice(0, 180),
      at: now,
      visitorId: input.visitorId ?? null,
      ip: input.ip?.replace(/^::ffff:/, "").slice(0, 64) || null,
      device: deviceFromUserAgent(input.userAgent),
    },
  });

  // Чистка старых записей — не чаще раза в сутки.
  if (now.getTime() - lastCleanup > DAY_MS) {
    lastCleanup = now.getTime();
    await prisma.visit.deleteMany({ where: { at: { lt: new Date(now.getTime() - KEEP_DAYS * DAY_MS) } } });
  }
  return { recorded: true };
}

export async function listVisits(period: VisitPeriod, page: number, pageSize: number) {
  const since = periodSince(period);
  const where = since ? { at: { gte: since } } : {};
  const [items, total] = await Promise.all([
    prisma.visit.findMany({ where, orderBy: { at: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.visit.count({ where }),
  ]);
  return {
    items: items.map((row) => ({ id: row.id, path: row.path, ip: row.ip, device: row.device, at: row.at.toISOString() })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function visitSummary() {
  const today = startOfToday();
  const week = new Date(today.getTime() - 6 * DAY_MS);
  const month = new Date(today.getFullYear(), today.getMonth(), 1);
  const seriesFrom = new Date(today.getTime() - (SERIES_DAYS - 1) * DAY_MS);

  // Посетитель без id (старые записи) считается по самой записи — иначе «уникальных» было бы 0.
  const [counts] = await prisma.$queryRaw<Array<Record<string, bigint>>>`
    SELECT
      COUNT(*)::bigint AS total,
      COUNT(*) FILTER (WHERE at >= ${today})::bigint AS today,
      COUNT(*) FILTER (WHERE at >= ${week})::bigint AS week,
      COUNT(*) FILTER (WHERE at >= ${month})::bigint AS month,
      COUNT(DISTINCT COALESCE(visitor_id, id)) FILTER (WHERE at >= ${today})::bigint AS unique_today,
      COUNT(DISTINCT COALESCE(visitor_id, id)) FILTER (WHERE at >= ${week})::bigint AS unique_week,
      COUNT(DISTINCT COALESCE(visitor_id, id)) FILTER (WHERE at >= ${month})::bigint AS unique_month
    FROM visits
  `;
  const popular = await prisma.$queryRaw<Array<{ path: string; visits: bigint }>>`
    SELECT path, COUNT(*)::bigint AS visits FROM visits GROUP BY path ORDER BY visits DESC LIMIT 10
  `;
  const devices = await prisma.$queryRaw<Array<{ device: string | null; visits: bigint }>>`
    SELECT device, COUNT(*)::bigint AS visits FROM visits WHERE at >= ${month} GROUP BY device
  `;
  const series = await prisma.visit.findMany({
    where: { at: { gte: seriesFrom } },
    select: { at: true, visitorId: true, id: true },
  });

  const daily = new Map<string, { visits: number; visitors: Set<string> }>();
  for (let i = SERIES_DAYS - 1; i >= 0; i -= 1) {
    daily.set(dayKey(new Date(today.getTime() - i * DAY_MS)), { visits: 0, visitors: new Set() });
  }
  const byWeekday = Array.from({ length: 7 }, () => 0);
  for (const row of series) {
    const bucket = daily.get(dayKey(row.at));
    if (bucket) {
      bucket.visits += 1;
      bucket.visitors.add(row.visitorId ?? row.id);
    }
    byWeekday[(row.at.getDay() + 6) % 7] += 1; // неделя с понедельника
  }

  const n = (value: bigint | undefined) => Number(value ?? 0n);
  return {
    total: n(counts?.total),
    today: n(counts?.today),
    week: n(counts?.week),
    month: n(counts?.month),
    uniqueToday: n(counts?.unique_today),
    uniqueWeek: n(counts?.unique_week),
    uniqueMonth: n(counts?.unique_month),
    daily: [...daily.entries()].map(([date, bucket]) => ({ date, visits: bucket.visits, unique: bucket.visitors.size })),
    byWeekday: byWeekday.map((visits, index) => ({ index, visits })),
    devices: devices.map((row) => ({ device: row.device ?? "unknown", visits: Number(row.visits) })),
    popularPages: popular.map((row) => ({ path: row.path, visits: Number(row.visits) })),
  };
}
