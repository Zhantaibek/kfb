import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../../config";
import { insertAudit, insertMedia } from "../../db/repositories/cms.repository";
import type { AdminSession } from "../../../../shared/cms";
import { AppError } from "../../middleware/error";
import { decodeUploadName } from "../../utils/upload-name";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const imageMaxBytes = 4 * 1024 * 1024;
export const uploadMaxBytes = 20 * 1024 * 1024;

// Отчёты эмитентов. Тип берём по расширению (Windows-браузеры часто шлют octet-stream)
// и сверяем с сигнатурой файла, чтобы под .pdf не прислали что-то другое.
const zipMagic = Buffer.from("504b0304", "hex");
const oleMagic = Buffer.from("d0cf11e0a1b11ae1", "hex");
const documentTypes: Record<string, Buffer> = {
  pdf: Buffer.from("%PDF"),
  docx: zipMagic,
  xlsx: zipMagic,
  zip: zipMagic,
  doc: oleMagic,
  xls: oleMagic,
};

function documentExt(file: { buffer: Buffer; originalname: string }) {
  const ext = path.extname(file.originalname).slice(1).toLowerCase();
  const magic = documentTypes[ext];
  return magic && file.buffer.subarray(0, magic.length).equals(magic) ? ext : null;
}

/** Тип картинки присылает браузер — сверяем с первыми байтами файла, чтобы под .png не сохранили что-то другое. */
export function looksLikeImage(buffer: Buffer, mimetype: string) {
  const head = buffer.subarray(0, 12);
  if (mimetype === "image/jpeg") return head.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"));
  if (mimetype === "image/png") return head.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  if (mimetype === "image/gif") return head.subarray(0, 4).toString("latin1") === "GIF8";
  if (mimetype === "image/webp") return head.subarray(0, 4).toString("latin1") === "RIFF" && head.subarray(8, 12).toString("latin1") === "WEBP";
  return false;
}

export async function saveUpload(
  session: AdminSession,
  file: { buffer: Buffer; mimetype: string; originalname: string },
) {
  let ext: string;
  if (allowed.has(file.mimetype)) {
    if (file.buffer.length > imageMaxBytes) throw new AppError("Картинка больше 4 МБ", 400);
    if (!looksLikeImage(file.buffer, file.mimetype)) throw new AppError("Файл не похож на изображение указанного формата", 400);
    ext = file.mimetype.split("/")[1] === "jpeg" ? "jpg" : file.mimetype.split("/")[1];
  } else {
    const doc = documentExt(file);
    if (!doc) throw new AppError("Можно загрузить JPG, PNG, WEBP, GIF или документ PDF, DOC, DOCX, XLS, XLSX, ZIP", 400);
    ext = doc;
  }

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
