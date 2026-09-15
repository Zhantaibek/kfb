import { Router } from "express";
import { asyncHandler } from "../../middleware/error";
import { postUpload, upload } from "./media.controller";

export const mediaRoutes = Router();

mediaRoutes.post(
  "/upload",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: "Файл больше 4 МБ" });
        return;
      }
      next();
    });
  },
  asyncHandler(postUpload),
);
