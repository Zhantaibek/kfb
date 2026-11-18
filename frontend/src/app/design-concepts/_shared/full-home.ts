import { EDU_URL } from "@/lib/edu";
import { loadPublicContent } from "@/lib/cms/public";
import { loadArchiveLatest, type ArchiveNews } from "@/lib/kse-live";
import { loadMarketData } from "@/lib/market-data";
import { dateKey } from "./data";
import { loadHomeData } from "./home-data";

/**
 * Всё содержимое текущей главной для «полных» макетов (варианты 66+): тексты слайдов, услуги, шаги,
 * меню, рыночные данные, новости вместе с архивом старого сайта, срочные объявления, соцсети.
 * Источники те же, что у настоящей главной (src/app/page.tsx).
 */

export const siteNav = [
  { label: "О Бирже", href: "/about" },
  { label: "Листинг", href: "/listing" },
  { label: "Статистика торгов", href: "/statistics" },
  { label: "Центр раскрытия информации", href: "/disclosure" },
  { label: "Сектор устойчивого развития", href: "/sustainable" },
  { label: "Инвестиции в ГЦБ", href: "/gcb" },
  { label: "Учебный центр", href: EDU_URL },
];

/** Тексты и кнопки четырёх слайдов главной (components/HomeHero.tsx). Фото подбирает каждый макет сам. */
export const heroSlides = [
  {
    title: "Инвестиции в стабильное будущее",
    text: "Кыргызская фондовая биржа — это прозрачный и надежный механизм для привлечения капитала, развития бизнеса и роста экономики страны.",
    primary: { label: "Торговать", href: "/market" },
    secondary: { label: "Подробнее", href: "/about" },
  },
  {
    title: "Как начать инвестировать",
    text: "Частному инвестору нужен счёт у участника торгов. Дальше — выбор акций, облигаций, ГЦБ или драгоценных металлов.",
    primary: { label: "Выбрать брокера", href: "/members" },
    secondary: { label: "Инвестируйте в ГЦБ", href: "/gcb" },
  },
  {
    title: "Итоги торгов",
    text: "Объём торгов по рынкам и сделки по ценным бумагам: последний торговый день, неделя, месяц и год.",
    primary: { label: "Смотреть итоги", href: "/market" },
    secondary: { label: "Все котировки", href: "/market/quotes" },
  },
  {
    title: "Листинг и раскрытие информации",
    text: "Официальный список ценных бумаг, допущенных к торгам на Кыргызской фондовой бирже.",
    primary: { label: "Листинг", href: "/listing" },
    secondary: { label: "Центр раскрытия информации", href: "/disclosure" },
  },
];

/** «Наши услуги» главной (components/HomeView.tsx). */
export const homeServices = [
  { title: "Организация торгов", text: "Биржевые торги акциями, облигациями и другими ценными бумагами.", href: "/market" },
  { title: "Листинг", text: "Включение компаний в биржевой список и сопровождение эмитентов.", href: "/listing" },
  { title: "Аукционы ГЦБ", text: "Размещение и обращение государственных ценных бумаг и депозитов.", href: "/gcb" },
  { title: "Товарно-сырьевой сектор", text: "Торги драгоценными металлами и биржевыми товарами.", href: "https://ts.kse.kg/" },
  { title: "Раскрытие информации", text: "Публикация отчётов и существенных фактов эмитентов.", href: "/disclosure" },
  { title: "Учебный центр", text: "Курсы и семинары по рынку ценных бумаг для специалистов и инвесторов.", href: EDU_URL },
];

/** «Как начать инвестировать» главной. */
export const homeSteps = [
  { title: "Выберите брокера", text: "Сделки на бирже заключаются только через лицензированных участников торгов.", link: "Участники торгов", href: "/members" },
  { title: "Разберитесь в основах", text: "Курсы учебного центра объяснят, как устроен рынок ценных бумаг.", link: "Учебный центр", href: EDU_URL },
  { title: "Выберите инструменты", text: "Акции, облигации, ГЦБ и драгоценные металлы — котировки по каждой бумаге.", link: "Котировки", href: "/market/quotes" },
  { title: "Подайте заявку", text: "Поручите брокеру купить или продать бумаги — сделка пройдёт на торговой сессии.", link: "Итоги торгов", href: "/market" },
];

/** Меню блока рынка (components/MarketPulse.tsx). */
export const marketMenu = [
  { label: "Обзор", href: "/market" },
  { label: "Акции", href: "/market/quotes" },
  { label: "Облигации", href: "/gcb" },
  { label: "Драгметаллы", href: "/market/metals" },
  { label: "Архив торгов", href: "/market/archive" },
  { label: "Индексы", href: "/market/index" },
];

export const marketTabs = [
  { label: "Все", types: ["stock", "bond", "gcb", "metal"] },
  { label: "Акции", types: ["stock"] },
  { label: "Облигации", types: ["bond", "gcb"] },
  { label: "Драгметаллы", types: ["metal"] },
] as const;

export const typeName = { stock: "акция", bond: "облигация", gcb: "ГЦБ", metal: "металл" } as const;

export type FeedItem = { key: string; date: string; title: string; href: string; external: boolean; company?: string; photo?: string };

function fromArchive(item: ArchiveNews): FeedItem {
  return {
    key: `a-${item.slug}`,
    date: item.date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3.$2.$1"),
    title: item.title,
    href: item.url,
    external: true,
    company: item.company || undefined,
  };
}

const byDate = (a: FeedItem, b: FeedItem) => dateKey(b.date).localeCompare(dateKey(a.date));

export async function loadFullHome() {
  const [data, market, content, archiveAll] = await Promise.all([loadHomeData(), loadMarketData(), loadPublicContent(), loadArchiveLatest()]);
  const archive = archiveAll.ru;
  const settings = content.settings;
  const priced = data.instruments.filter((item) => item.price > 0);
  const [lead, ...restNews] = data.news;

  return {
    data,
    market,
    priced,
    lead,
    maxLeader: Math.max(1, ...data.leaders.map((row) => row.volume)),
    exchangeFeed: [
      ...restNews.map((n): FeedItem => ({ key: n.slug, date: n.date, title: n.title, href: `/news/${n.slug}`, external: false, photo: n.photo })),
      ...archive.exchange.map(fromArchive),
    ]
      .sort(byDate)
      .slice(0, 8),
    companyFeed: [
      ...data.companyNews.map((n): FeedItem => ({ key: n.slug, date: n.date, title: n.title, href: `/news/${n.slug}`, external: false, company: n.company, photo: n.photo })),
      ...archive.company.map(fromArchive),
    ]
      .sort(byDate)
      .slice(0, 8),
    urgent: [...data.urgent.map((u): FeedItem => ({ key: u.slug, date: u.date, title: u.title, href: `/news/${u.slug}`, external: false })), ...archive.urgent.map(fromArchive)]
      .sort(byDate)
      .slice(0, 2),
    socials: [
      { label: "Facebook", href: settings.facebookUrl },
      { label: "Instagram", href: settings.instagramUrl },
      { label: "Telegram", href: settings.telegramUrl },
    ].filter((s) => s.href),
    phones: data.contacts.phones.length ? data.contacts.phones : ["+996 312 31 14 84", "+996 551 31 14 84"],
    address: data.contacts.address || "720010, Кыргызская Республика, г. Бишкек, ул. Московская, 172",
    email: data.contacts.email || "office@kse.kg",
    tagline:
      data.tagline ||
      "Кыргызская фондовая биржа основана в 1994 году. Первые торги акциями прошли в мае 1995 года, а с июля 1995 года биржа рассчитывает Индекс КФБ — важнейший показатель деловой активности на рынке ценных бумаг.",
  };
}

/** Внешняя ссылка — открыть в новой вкладке. */
export function ext(external: boolean) {
  return external ? { target: "_blank", rel: "noopener noreferrer" } : {};
}
