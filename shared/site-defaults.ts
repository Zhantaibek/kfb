import type { CmsHomeHub, CmsSiteSettings } from "./cms";

export const defaultSiteSettings: CmsSiteSettings = {
  id: "site",
  tagline: "Рынок ценных бумаг Кыргызстана. Котировки, итоги торгов и отчёты эмитентов — в одном месте.",
  address: "720010, Кыргызская Республика, г. Бишкек, ул. Московская, 172",
  phones: "+996 312 31 14 84\n+996 551 31 14 84",
  emails: "office@kse.kg",
  fax: "+996 312 31 14 83",
  facebookUrl: "https://ru-ru.facebook.com/KyrgyzStockExchange/",
  instagramUrl: "https://www.instagram.com/kse.kg/",
  telegramUrl: "https://t.me/kse_publicinfo",
  license: "№37 НКРЦБ от 30.11.2000",
  copyright: "© 2004–2026 ЗАО «Кыргызская фондовая биржа»",
  eduUrl: "/education/app",
  disclosurePhone: "(0312) 45-40-53",
  eduPhone: "+996 (772) 63-79-97",
  updatedAt: "2026-08-18T09:00:00.000Z",
};

export const defaultHomeHubs: CmsHomeHub[] = [
  { id: "hub-market", href: "/market", title: "Торги и котировки", text: "Инструменты, лидеры сессии и фильтры", photo: "/hub/hub-market.jpg", order: 1 },
  { id: "hub-news", href: "/news", title: "Новости", text: "Пресс-центр биржи, эмитенты и срочные объявления", photo: "/hub/hub-news.jpg", order: 2 },
  { id: "hub-disclosure", href: "/disclosure", title: "Раскрытие", text: "Свежие факты эмитентов", photo: "/hub/hub-disclosure.jpg", order: 3 },
  { id: "hub-gcb", href: "/gcb", title: "Аукционы ГЦБ", text: "Календарь Минфина", photo: "/hub/hub-gcb.jpg", order: 4 },
  { id: "hub-listing", href: "/listing", title: "Листинг", text: "Акции, облигации и требования к эмитентам", photo: "/hub/hub-listing.jpg", order: 5 },
  { id: "hub-members", href: "/members", title: "Участники торгов", text: "Брокеры и компании на площадке", photo: "/hub/hub-members.jpg", order: 6 },
  { id: "hub-analytics", href: "/analytics", title: "Аналитика", text: "Индекс KSE и обзор рынка", photo: "/hub/hub-analytics.jpg", order: 7 },
  { id: "hub-education", href: "/education", title: "Учебный центр", text: "Курсы, план работы и онлайн-платформа", photo: "/hub/hub-education.jpg", order: 8 },
];

export function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function mailHref(email: string) {
  return `mailto:${email.trim()}`;
}
