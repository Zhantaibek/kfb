import { Router } from "express";
import { dbHealth } from "./db/postgres";
import { authRoutes, publicAuthRoutes } from "./modules/auth/auth.routes";
import { adminCmsRoutes, publicCmsRoutes } from "./modules/cms/cms.routes";
import { mediaRoutes } from "./modules/media/media.routes";

export const api = Router();

api.get("/health", async (_req, res, next) => {
  try {
    const db = await dbHealth();
    res.json({ ok: true, service: "kse-api", db });
  } catch (error) {
    next(error);
  }
});

api.use("/admin", authRoutes);
api.use("/admin", adminCmsRoutes);
api.use("/admin", mediaRoutes);
api.use("/auth", publicAuthRoutes);
api.use("/public", publicCmsRoutes);
