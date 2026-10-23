import type { Request, Response } from "express";
import multer from "multer";
import { requireSession } from "../auth/auth.service";
import { invalidatePublicContent } from "../../store/public-cache";
import { saveUpload, uploadMaxBytes } from "./media.service";

export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: uploadMaxBytes } });

export async function postUpload(req: Request, res: Response) {
  const session = requireSession(req);
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "Файл не выбран" });
    return;
  }
  const saved = await saveUpload(session, file);
  invalidatePublicContent();
  res.json(saved);
}
