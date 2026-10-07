import type { CmsStore } from "../../../shared/cms";
import { news as seedNews } from "./news";
import { allNavSeed } from "../../../shared/nav-seed";
import { managementSeed } from "../../../shared/management-seed";
import { partnersSeed } from "../../../shared/partners-seed";
import {
  esgReportsSeed,
  gcbParticipantsSeed,
  landingSectionsSeed,
  sustainableBondsSeed,
  verifiersSeed,
} from "../../../shared/landings-seed";
import { issuerSeedRows } from "../../../shared/issuers-seed";
import { listingSeedRows } from "../../../shared/listing-seed";
import { defaultHomeHubs, defaultSiteSettings } from "../../../shared/site-defaults";

const now = "2026-08-18T09:00:00.000Z";

const photos = [
  "/carousel/meeting.jpg",
  "/carousel/city.jpg",
  "/carousel/mountains.jpg",
  "/carousel/office.jpg",
  "/carousel/gold.jpg",
  "/carousel/trading.jpg",
];

export function createSeedStore(): CmsStore {
  return {
    news: seedNews.map((item, index) => ({
      id: `news-${index + 1}`,
      slug: item.slug,
      date: item.date,
      tag: item.tag,
      kind: item.kind,
      status: "published",
      title: item.title,
      excerpt: item.excerpt,
      body: item.body.join("\n\n"),
      photo: photos[index % photos.length],
      issuerSlug: item.issuerSlug ?? "",
      createdAt: now,
      updatedAt: now,
    })),
    slides: [
      {
        id: "slide-1",
        title: "INDEX KSE",
        text: "главный индикатор рынка капитала Кыргызстана",
        href: "/market",
        value: "8 410.39",
        photo: "/carousel/trading.jpg",
        order: 1,
      },
      {
        id: "slide-2",
        title: "ГЦБ",
        text: "казначейские векселя и облигации Минфина КР",
        href: "/gcb",
        value: "ГКВ-12",
        photo: "/carousel/gold.jpg",
        order: 2,
      },
      {
        id: "slide-3",
        title: "ЛИСТИНГ",
        text: "выведите компанию на официальную площадку",
        href: "/listing",
        value: "КФБ",
        photo: "/carousel/meeting.jpg",
        order: 3,
      },
      {
        id: "slide-4",
        title: "ШАРИАТ",
        text: "инструменты и экосистема по принципам ислама",
        href: "/islamic",
        value: "NAHDA",
        photo: "/carousel/mountains.jpg",
        order: 4,
      },
    ],
    media: [
      { id: "media-1", name: "Торги", url: "/carousel/trading.jpg", createdAt: now },
      { id: "media-2", name: "Офис", url: "/carousel/office.jpg", createdAt: now },
      { id: "media-3", name: "Город", url: "/carousel/city.jpg", createdAt: now },
      { id: "media-4", name: "Встреча", url: "/carousel/meeting.jpg", createdAt: now },
      { id: "media-5", name: "Горы", url: "/carousel/mountains.jpg", createdAt: now },
      { id: "media-6", name: "Телефон", url: "/carousel/phone.jpg", createdAt: now },
      { id: "media-7", name: "ГЦБ", url: "/carousel/gold.jpg", createdAt: now },
    ],
    pages: [
      {
        id: "page-about",
        path: "/about",
        title: "О бирже",
        lead: "Кыргызская фондовая биржа — организатор торгов на рынке капитала КР.",
        body: "Биржа работает с 1994 года. Лицензия №37 НКРЦБ от 30.11.2000.",
        status: "published",
        updatedAt: now,
      },
      {
        id: "page-investors",
        path: "/investors",
        title: "Инвесторам",
        lead: "Как начать инвестировать через участников торгов КФБ.",
        body: "Откройте счёт у брокера — участника КФБ — и получите доступ к акциям, облигациям и ГЦБ.",
        status: "published",
        updatedAt: now,
      },
    ],
    menu: allNavSeed(),
    hubs: defaultHomeHubs,
    management: managementSeed,
    partners: partnersSeed,
    sustainableBonds: sustainableBondsSeed,
    esgReports: esgReportsSeed,
    verifiers: verifiersSeed,
    gcbParticipants: gcbParticipantsSeed,
    landingSections: landingSectionsSeed,
    issuers: issuerSeedRows(now),
    listing: listingSeedRows(now),
    settings: [{ ...defaultSiteSettings, updatedAt: now }],
    requests: [],
    users: [
      { id: "user-admin", name: "Администратор", email: "admin@kse.kg", role: "admin", password: "admin" },
      { id: "user-editor", name: "Редактор", email: "editor@kse.kg", role: "editor", password: "editor" },
      { id: "user-investor", name: "Инвестор", email: "investor@kse.kg", role: "investor", password: "kse" },
      { id: "user-issuer", name: "Эмитент", email: "issuer@kse.kg", role: "issuer", password: "kse" },
    ],
    visits: [],
    audit: [
      {
        id: "audit-1",
        action: "seed",
        entity: "cms",
        detail: "Начальное наполнение CMS",
        actor: "system",
        at: now,
      },
    ],
  };
}
