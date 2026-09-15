import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../../config";
import { detachMediaUrl, insertAudit, insertMedia } from "../../db/repositories/cms.repository";
import type { AdminSession } from "../../../../shared/cms";
import { decodeUploadName } from "../../utils/upload-name";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function saveUpload(
  session: AdminSession,
  file: { buffer: Buffer; mimetype: string; originalname: string },
) {
  if (!allowed.has(file.mimetype)) {
    throw new Error("Можно загрузить JPG, PNG, WEBP или GIF");
  }

  const ext = file.mimetype.split("/")[1] === "jpeg" ? "jpg" : file.mimetype.split("/")[1];
  const id = crypto.randomUUID();
  const filename = `${id}.${ext}`;
  await mkdir(config.uploadsDir, { recursive: true });
  await writeFile(path.join(config.uploadsDir, filename), file.buffer);

  const media = {
    id,
    name: decodeUploadName(file.originalname),
    url: `/uploads/${filename}`,
    createdAt: new Date().toISOString(),
  };

  await insertMedia(media);
  await insertAudit({ action: "upload", entity: "media", detail: media.name, actor: session.email });

  return media;
}

export async function removeUploadedFile(url: string) {
  if (!url.startsWith("/uploads/")) return;
  const filename = path.basename(url);
  if (!filename || filename.includes("..") || filename !== url.slice("/uploads/".length)) return;
  try {
    await unlink(path.join(config.uploadsDir, filename));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
  }
}

export async function purgeMediaRecord(existing: Record<string, unknown>) {
  const url = String(existing.url ?? "");
  if (!url) return;
  await detachMediaUrl(url);
  await removeUploadedFile(url);
}
