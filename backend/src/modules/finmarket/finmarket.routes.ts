import { Router } from "express";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/error";

/**
 * Журнал «Финансовый рынок.KG» — выпуски из нашей базы (fin_market_issues; перенесено из бэкапа старого сайта,
 * scripts/import-legacy-finmarket.ts). PDF лежат у нас в uploads/finmarket.
 *
 *   GET /api/public/finmarket → { rows: [{ title, date, url, size }] }, новые сверху
 */
export const finMarketRoutes = Router();

finMarketRoutes.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.finMarketIssue.findMany({ where: { fileUrl: { not: "" } }, orderBy: [{ date: "desc" }, { legacyId: "desc" }] });
    res.json({
      rows: rows.map((row) => ({ title: row.title, date: row.date.toISOString().slice(0, 10), url: row.fileUrl, size: row.fileSize })),
    });
  }),
);
