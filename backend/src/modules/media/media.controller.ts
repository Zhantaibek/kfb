import type { Request, Response } from "express";
import multer from "multer";
import { requireSession } from "../auth/auth.service";
import { saveUpload, uploadMaxBytes } from "./media.service";

export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: uploadMaxBytes } });

export async function postUpload(req: Request, res: Response) {
  const session = requireSession(req);
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "Файл не выбран" });
    return;
  }
  res.json(await saveUpload(session, file));
}
