/**
 * Правила содержимого новости, общие для редактора и проверок: ссылки, видео, вставка из Word.
 * Сервер повторяет эти проверки сам (backend/src/utils/sanitize-html.ts) — здесь они для удобства и подсказок.
 */

const SAFE_SCHEMES = /^(https?:|mailto:|tel:)/i;

/**
 * Адрес ссылки от пользователя → безопасный href или null.
 * «kse.kg/news» дополняем до https://, «/market» — путь сайта; javascript:, data: и прочее отклоняем.
 */
export function normalizeLinkUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return SAFE_SCHEMES.test(value) && isWellFormed(value) ? value : null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  if (/^[\p{L}\p{N}-]+(\.[\p{L}\p{N}-]+)+([/?#].*)?$/u.test(value)) return `https://${value}`;
  return null;
}

function isWellFormed(value: string) {
  if (/^(mailto|tel):/i.test(value)) return value.length > 7;
  try {
    const url = new URL(value);
    return Boolean(url.hostname);
  } catch {
    return false;
  }
}

/** Ссылка на YouTube или Vimeo → адрес встраивания плеера; другие сайты не поддерживаются (null). */
export function videoEmbedUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  const youtubeId = (id: string | null | undefined) => (id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null);
  if (host === "youtu.be") return youtubeId(url.pathname.slice(1));
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") return youtubeId(url.searchParams.get("v"));
    const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/);
    return youtubeId(match?.[1]);
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.match(/(?:^|\/)(\d{6,12})(?:$|\/)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}

/**
 * HTML из буфера обмена (Word, Google Docs) → без служебной разметки, которую схема редактора всё равно не поймёт
 * и которая иногда ломает форматирование (Google Docs оборачивает весь текст в <b style="font-weight:normal">).
 */
export function cleanPastedHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?o:p[^>]*>/gi, "")
    .replace(/<\/?(?:w|m|v):[^>]*>/gi, "")
    .replace(/<b\b[^>]*id="docs-internal-guid[^"]*"[^>]*>([\s\S]*?)<\/b>/gi, "$1")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\sclass="Mso[^"]*"/gi, "");
}

/** Старый текст без разметки (из прежних версий CMS) → абзацы. */
export function plainTextToHtml(value: string): string {
  if (!value.trim() || /<\/?[a-z][\s\S]*>/i.test(value)) return value;
  return value
    .split(/\n{2,}|\r?\n/)
    .filter((line) => line.trim())
    .map((line) => `<p>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    .join("");
}

/** Размер файла для подписи: «2,4 МБ». */
export function formatFileSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / 1024 / 1024).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} МБ`;
}
