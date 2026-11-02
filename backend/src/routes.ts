import { Router } from "express";
import { dbHealth } from "./db/postgres";
import { authRoutes, publicAuthRoutes } from "./modules/auth/auth.routes";
import { adminCmsRoutes, publicCmsRoutes } from "./modules/cms/cms.routes";
import { mediaRoutes } from "./modules/media/media.routes";
import { adminAnalyticsRoutes } from "./modules/analytics/analytics.routes";
import { marketDataHealth } from "./modules/kse-sync/sync";
import { adminDisclosureRoutes, publicDisclosureRoutes } from "./modules/disclosure/disclosure.routes";

export const api = Router();

api.get("/health", async (_req, res, next) => {
  try {
    const db = await dbHealth();
    res.json({ ok: true, service: "kse-api", db });
  } catch (error) {
    next(error);
  }
});

// Для внешнего мониторинга: 503, если данные торгов с kse.kg перестали обновляться.
api.get("/health/market", async (_req, res, next) => {
  try {
    const market = await marketDataHealth();
    res.status(market.status === "stale" ? 503 : 200).json(market);
  } catch (error) {
    next(error);
  }
});

api.use("/admin", authRoutes);
api.use("/admin", adminCmsRoutes);
api.use("/admin", mediaRoutes);
api.use("/admin/analytics", adminAnalyticsRoutes);
api.use("/admin/disclosures", adminDisclosureRoutes);
api.use("/public/disclosure", publicDisclosureRoutes);
api.use("/auth", publicAuthRoutes);
api.use("/public", publicCmsRoutes);
