import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../../config";
import { detachMediaUrl, insertAudit, insertMedia } from "../../db/repositories/cms.repository";
import type { AdminSession } from "../../../../shared/cms";
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
  pptx: zipMagic,
  odt: zipMagic,
  ods: zipMagic,
  zip: zipMagic,
  doc: oleMagic,
  xls: oleMagic,
  ppt: oleMagic,
  rtf: Buffer.from("{\\rtf"),
};
/** Текстовые форматы без сигнатуры: проверяем, что внутри нет нулевых байтов (то есть это не бинарный файл). */
const textTypes = new Set(["txt", "csv"]);

/** Сигнатура картинки: под видом image/png не должен приехать HTML или другой файл. */
function isImageBytes(buffer: Buffer, mimetype: string) {
  const starts = (hex: string, at = 0) => buffer.subarray(at, at + hex.length / 2).equals(Buffer.from(hex, "hex"));
  if (mimetype === "image/png") return starts("89504e470d0a1a0a");
  if (mimetype === "image/jpeg") return starts("ffd8ff");
  if (mimetype === "image/gif") return starts("474946383761") || starts("474946383961");
  if (mimetype === "image/webp") return starts("52494646") && starts("57454250", 8);
  return false;
}

function documentExt(file: { buffer: Buffer; originalname: string }) {
  const ext = path.extname(file.originalname).slice(1).toLowerCase();
  if (textTypes.has(ext)) return file.buffer.subarray(0, 4096).includes(0) ? null : ext;
  const magic = documentTypes[ext];
  return magic && file.buffer.subarray(0, magic.length).equals(magic) ? ext : null;
}

export async function saveUpload(
  session: AdminSession,
  file: { buffer: Buffer; mimetype: string; originalname: string },
) {
  let ext: string;
  if (allowed.has(file.mimetype)) {
    if (file.buffer.length > imageMaxBytes) throw new Error("Картинка больше 4 МБ");
    if (!isImageBytes(file.buffer, file.mimetype)) throw new Error("Файл не похож на картинку — загрузите настоящий JPG, PNG, WEBP или GIF");
    ext = file.mimetype.split("/")[1] === "jpeg" ? "jpg" : file.mimetype.split("/")[1];
  } else {
    const doc = documentExt(file);
    if (!doc) throw new Error("Можно загрузить JPG, PNG, WEBP, GIF или документ PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ODT, ODS, RTF, TXT, CSV, ZIP");
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

export async function purgeMediaRecord(existing: Record<string, unknown>) {
  const url = String(existing.url ?? "");
  if (!url) return;
  await detachMediaUrl(url);
  await removeUploadedFile(url);
}
