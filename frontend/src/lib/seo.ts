import type { Lang } from "@/lib/i18n";

/**
 * Языковые адреса для поисковиков: русский — без префикса (/about),
 * кыргызский и английский — /ky/about и /en/about. Сервер сразу отдаёт страницу на нужном языке.
 */
export const SITE_URL = "https://kse.kg";
export const SEO_LANGS: Lang[] = ["ru", "ky", "en"];
export const LANG_HEADER = "x-kse-lang";
export const PATH_HEADER = "x-kse-path";
export const LANG_COOKIE = "kse-lang";

export const ogLocale: Record<Lang, string> = { ru: "ru_KG", ky: "ky_KG", en: "en_US" };
export const hreflang: Record<Lang, string> = { ru: "ru", ky: "ky", en: "en" };

export function isLang(value: unknown): value is Lang {
  return value === "ru" || value === "ky" || value === "en";
}

/** /ky/about → { lang: "ky", path: "/about" }; /about → { lang: null, path: "/about" }. */
export function splitLangPath(pathname: string): { lang: Lang | null; path: string } {
  const match = /^\/(ky|en)(?=\/|$)/.exec(pathname);
  if (!match) return { lang: null, path: pathname || "/" };
  return { lang: match[1] as Lang, path: pathname.slice(match[0].length) || "/" };
}

/** Адрес страницы на языке: localizedPath("/about", "ky") → "/ky/about". */
export function localizedPath(path: string, lang: Lang) {
  const clean = path === "" ? "/" : path;
  if (lang === "ru") return clean;
  return clean === "/" ? `/${lang}` : `/${lang}${clean}`;
}

/** Ссылки rel="alternate" hreflang для страницы — все три языка и x-default (русский). */
export function languageAlternates(path: string) {
  return {
    ru: localizedPath(path, "ru"),
    ky: localizedPath(path, "ky"),
    en: localizedPath(path, "en"),
    "x-default": localizedPath(path, "ru"),
  };
}

/** Текст для meta description: без тегов, сущностей и лишних пробелов, не длиннее ~160 символов. */
export function metaDescription(text: string, max = 160) {
  const plain = text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6))}…`;
}
