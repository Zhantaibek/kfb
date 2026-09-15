"use client";

import { applyLocale } from "@/lib/cms/locale";
import type { CmsI18n } from "@/lib/cms/types";
import { useLang } from "@/lib/use-tr";

export function useLocalized<T extends { i18n?: CmsI18n }>(item: T, fields: (keyof T & string)[]): T {
  const lang = useLang();
  return applyLocale(item, lang, fields);
}

export function useLocalizedList<T extends { i18n?: CmsI18n }>(items: T[], fields: (keyof T & string)[]): T[] {
  const lang = useLang();
  return items.map((item) => applyLocale(item, lang, fields));
}
