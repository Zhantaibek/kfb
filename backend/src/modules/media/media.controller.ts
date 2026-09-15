import type { Request, Response } from "express";
import multer from "multer";
import { requireSession } from "../auth/auth.service";
import { saveUpload } from "./media.service";

export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });

export async function postUpload(req: Request, res: Response) {
  const session = requireSession(req);
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "Файл не выбран" });
    return;
  }
  res.json(await saveUpload(session, file));
}
