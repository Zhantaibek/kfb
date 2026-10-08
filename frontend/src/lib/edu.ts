/**
 * Учебный центр КФБ — отдельный проект (репозиторий kse-edu) со своим адресом.
 * На сайте биржи от него осталась только ссылка; адрес задаётся NEXT_PUBLIC_EDU_URL.
 */
export const EDU_URL = process.env.NEXT_PUBLIC_EDU_URL ?? "http://localhost:5173/education/app/";

/** Старые адреса раздела (/education, /education/plan, /education/app/…) — ссылки из меню и карточек в базе. */
export function eduHref(href: string) {
  return href === "/education" || href.startsWith("/education/") ? EDU_URL : href;
}
