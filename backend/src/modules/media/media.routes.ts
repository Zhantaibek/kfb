import { Router } from "express";
import { asyncHandler } from "../../middleware/error";
import { postUpload, upload } from "./media.controller";

export const mediaRoutes = Router();

mediaRoutes.post(
  "/upload",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        const tooBig = (err as { code?: string }).code === "LIMIT_FILE_SIZE";
        res.status(400).json({ error: tooBig ? "Файл больше 20 МБ" : "Не удалось принять файл. Загрузите один файл ещё раз." });
        return;
      }
      next();
    });
  },
  asyncHandler(postUpload),
);
