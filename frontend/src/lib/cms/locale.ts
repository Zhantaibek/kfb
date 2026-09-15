import type { CmsI18n, LocaleCode } from "@/lib/cms/types";
import { languageError } from "@/lib/cms/lang-check";
import { tr, type Lang } from "@/lib/i18n";

export type ContentLang = "ru" | LocaleCode;

export const contentLanguages: { id: ContentLang; label: string; short: string }[] = [
  { id: "ru", label: "Русский", short: "RU" },
  { id: "ky", label: "Кыргызча", short: "KY" },
  { id: "en", label: "English", short: "EN" },
];

export function readLocaleField(item: { i18n?: CmsI18n } | null | undefined, lang: ContentLang, field: string): string {
  if (!item) return "";
  if (lang === "ru") return String((item as Record<string, unknown>)[field] ?? "");
  return item.i18n?.[lang]?.[field] ?? "";
}

export function writeLocaleField<T extends { i18n?: CmsI18n }>(item: T, lang: ContentLang, field: string, value: string): T {
  if (lang === "ru") return { ...item, [field]: value };
  return { ...item, i18n: setI18n(item.i18n, lang, field, value) };
}

export function setI18n(i18n: CmsI18n | undefined, lang: LocaleCode, field: string, value: string): CmsI18n {
  const pack = { ...(i18n?.[lang] ?? {}) };
  if (value.trim()) pack[field] = value;
  else delete pack[field];
  const next: CmsI18n = { ...(i18n ?? {}) };
  if (Object.keys(pack).length) next[lang] = pack;
  else delete next[lang];
  return next;
}

const htmlI18nFields = new Set(["body"]);

export function isLocaleValueFilled(value: unknown, field: string) {
  const text = String(value ?? "");
  if (htmlI18nFields.has(field)) {
    return text
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim().length > 0;
  }
  return text.trim().length > 0;
}

export function hasLocale(
  i18n: CmsI18n | undefined,
  lang: LocaleCode,
  fields: string[],
  item?: { i18n?: CmsI18n } | null,
) {
  const pack = i18n?.[lang] ?? {};
  return fields.every((field) => {
    const ruFilled = item ? isLocaleValueFilled((item as Record<string, unknown>)[field], field) : true;
    if (!ruFilled) return true;
    return isLocaleValueFilled(pack[field], field);
  });
}

const langNames: Record<LocaleCode, string> = { ky: "кыргызский", en: "английский" };

/** properNames — поля с именами собственными: перевод обязателен, но эвристика языка к ним не применяется. */
export function incompleteTranslation(
  item: { i18n?: CmsI18n } | null | undefined,
  fields: string[],
  properNames: string[] = [],
): { lang: ContentLang; message: string } | null {
  if (!item) return { lang: "ky", message: "Заполните русский, кыргызский и английский текст." };
  for (const field of fields) {
    if (!isLocaleValueFilled((item as Record<string, unknown>)[field], field)) continue;
    const skipLangCheck = properNames.includes(field);
    const ru = String((item as Record<string, unknown>)[field] ?? "");
    const ruErr = skipLangCheck ? null : languageError(ru, "ru");
    if (ruErr) return { lang: "ru", message: ruErr };
    for (const lang of ["ky", "en"] as const) {
      const translated = item.i18n?.[lang]?.[field] ?? "";
      if (!isLocaleValueFilled(translated, field)) {
        return {
          lang,
          message: `Нужны все три языка. Заполните ${langNames[lang]} текст на вкладке ${lang.toUpperCase()}.`,
        };
      }
      const langErr = skipLangCheck ? null : languageError(translated, lang, ru);
      if (langErr) return { lang, message: langErr };
    }
  }
  return null;
}

export function applyLocale<T extends { i18n?: CmsI18n }>(item: T, lang: Lang, fields: (keyof T & string)[]): T {
  if (lang === "ru") return item;
  const pack = item.i18n?.[lang];
  if (!pack) return item;
  const next = { ...item };
  for (const field of fields) {
    const value = pack[field];
    if (typeof value === "string" && value.trim()) {
      (next as Record<string, unknown>)[field] = value;
    }
  }
  return next;
}

export function localizedString<T extends { i18n?: CmsI18n }>(item: T, lang: Lang, field: keyof T & string) {
  const applied = applyLocale(item, lang, [field]);
  return tr(lang, String(applied[field] ?? ""));
}
