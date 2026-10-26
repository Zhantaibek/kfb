import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../middleware/error";
import { validateBody } from "../../middleware/validate";
import { disclosureItemSchema } from "../../validation/cms";
import { requireSession } from "../auth/auth.service";
import { addDisclosure, disclosuresForIssuer, removeDisclosure } from "./disclosure.service";

/** Сайт: события эмитента для вкладки «Новости компании» на /disclosure/<slug>. */
export const publicDisclosureRoutes = Router();
publicDisclosureRoutes.get(
  "/:slug",
  asyncHandler(async (req: Request, res: Response) => {
    const rows = await disclosuresForIssuer(String(req.params.slug));
    res.json(rows.map(({ date, title, url }) => ({ date, title, url })));
  }),
);

/** Админка: события выбранного эмитента, добавление вручную и удаление (admin и editor). */
export const adminDisclosureRoutes = Router();
adminDisclosureRoutes.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    await requireSession(req);
    res.json(await disclosuresForIssuer(String(req.query.issuer ?? "")));
  }),
);
adminDisclosureRoutes.post(
  "/",
  validateBody(disclosureItemSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await addDisclosure(await requireSession(req), req.body));
  }),
);
adminDisclosureRoutes.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    await removeDisclosure(await requireSession(req), String(req.params.id));
    res.json({ ok: true });
  }),
);
