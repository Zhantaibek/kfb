export function decodeUploadName(raw: string) {
  const base = String(raw ?? "").replace(/\.[^.]+$/, "");
  const decoded =
    /[\u00C0-\u00FF]/.test(base) && !/[А-Яа-яЁё]/.test(base)
      ? Buffer.from(base, "latin1").toString("utf8")
      : base;
  const clean = decoded
    .replace(/[\u0000-\u001f<>:"/\\|?*\uFFFD]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean.slice(0, 160) || "Фото";
}
