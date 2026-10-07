import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/error";
import { requireSession } from "../auth/auth.service";
import { listVisits, recordVisit, visitSummary } from "./analytics.service";

const visitBody = z.object({
  path: z.string().trim().min(1).max(500).default("/"),
  // id посетителя из localStorage; кривой — просто не учитываем
  visitorId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{8,64}$/)
    .optional()
    .catch(undefined),
});

const listQuery = z.object({
  period: z.enum(["today", "week", "month", "all"]).catch("today"),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  pageSize: z.coerce.number().int().min(5).max(100).catch(10),
});

/** Публичный счётчик: POST /api/public/visit { path, visitorId }. */
export async function postVisit(req: Request, res: Response) {
  const body = visitBody.parse(req.body ?? {});
  const result = await recordVisit({
    path: body.path,
    visitorId: body.visitorId,
    // Next-прокси передаёт адрес посетителя в X-Visitor-Ip (только для статистики); напрямую — req.ip.
    ip: req.get("x-visitor-ip") ?? req.ip ?? null,
    userAgent: req.get("user-agent") ?? null,
  });
  res.json({ ok: true, ...result });
}

/** Админка: /api/admin/analytics/summary и /api/admin/analytics/visits?period=&page=&pageSize= */
export const adminAnalyticsRoutes = Router();

adminAnalyticsRoutes.get(
  "/summary",
  asyncHandler(async (req: Request, res: Response) => {
    requireSession(req);
    res.json(await visitSummary());
  }),
);

adminAnalyticsRoutes.get(
  "/visits",
  asyncHandler(async (req: Request, res: Response) => {
    requireSession(req);
    const query = listQuery.parse(req.query);
    res.json(await listVisits(query.period, query.page, query.pageSize));
  }),
);
