import type { CmsMenuItem } from "@/lib/cms/types";

/**
 * Страницы-«хабы» с плитками-ссылками. Плитки — это пункты раздела главного меню (шапки):
 * что добавлено в раздел в «Меню и страницы», то и появляется плиткой на странице.
 * sectionHref — ссылка самого раздела в шапке, по ней раздел и находится.
 */
export const HUB_PAGES = [
  { page: "/about", sectionHref: "/about", title: "О Бирже" },
  { page: "/statistics", sectionHref: "/market", title: "Статистика торгов" },
] as const;

export type HubPage = (typeof HUB_PAGES)[number]["page"];

/** Раздел шапки, который показывается плитками на странице hub. */
export function hubSection(menu: CmsMenuItem[], page: HubPage) {
  const hub = HUB_PAGES.find((item) => item.page === page);
  if (!hub) return undefined;
  return menu.find((item) => (item.group || "header") === "header" && !item.parentId && item.href === hub.sectionHref);
}

/** Плитки страницы: все пункты раздела по порядку, кроме ссылки на саму эту страницу. */
export function hubCards(menu: CmsMenuItem[], page: HubPage) {
  const section = hubSection(menu, page);
  if (!section) return [];
  return menu
    .filter((item) => item.parentId === section.id && item.href !== page)
    .sort((a, b) => a.order - b.order);
}

/** Для админки: на какой странице раздел показывается плитками. */
export function hubPageForSection(section: CmsMenuItem) {
  return HUB_PAGES.find((item) => item.sectionHref === section.href);
}
