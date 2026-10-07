"use client";

import { applyLocale } from "@/lib/cms/locale";
import type { CmsLandingSection, LandingPage } from "@/lib/cms/types";
import { useLang } from "@/lib/use-tr";

const sectionFields = ["kicker", "title", "text", "items"] as const;

const blank = (page: LandingPage, key: string): CmsLandingSection => ({
  id: `${page}-${key}`,
  page,
  key,
  kicker: "",
  title: "",
  text: "",
  items: "",
  link: "",
  photo: "",
  order: 0,
  updatedAt: "",
});

/** Текстовые блоки лендинга на текущем языке: section("hero") — блок или пустой (если его удалили в админке). */
export function useSections(sections: CmsLandingSection[], page: LandingPage) {
  const lang = useLang();
  const byKey = new Map(
    sections.filter((item) => item.page === page).map((item) => [item.key, applyLocale(item, lang, [...sectionFields])]),
  );
  return (key: string) => byKey.get(key) ?? blank(page, key);
}

/** Абзацы — через пустую строку. */
export function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Пункты списка — по одному в строке. */
export function lines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
