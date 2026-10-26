import { Router } from "express";
import { asyncHandler } from "../../middleware/error";
import { requireSession } from "../auth/auth.service";
import { postUpload, upload } from "./media.controller";

export const mediaRoutes = Router();

mediaRoutes.post(
  "/upload",
  // Сначала проверяем вход, и только потом принимаем файл в память (до 20 МБ) — иначе загрузить мог бы кто угодно.
  (req, res, next) => {
    requireSession(req).then(
      () => next(),
      () => res.status(401).json({ error: "unauthorized" }),
    );
  },
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: "Файл больше 20 МБ" });
        return;
      }
      next();
    });
  },
  asyncHandler(postUpload),
);
