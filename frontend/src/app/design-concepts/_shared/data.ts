import { EDU_URL } from "@/lib/edu";
import { loadIssuerData, loadPublicContent } from "@/lib/cms/public";
import { isGeneralNews } from "@/lib/cms/types";
import { loadMarketData } from "@/lib/market-data";

/**
 * Данные для макетов главной (design-concepts). Источники те же, что у настоящей главной:
 * CMS через API (новости, контакты, эмитенты) и loadMarketData() (снимки рынка, без них — демо-каталог).
 * Новых обращений к kse.kg макеты не делают.
 */

export const nav = [
  { href: "/about", label: "О бирже" },
  { href: "/market", label: "Торги" },
  { href: "/listing", label: "Листинг" },
  { href: "/disclosure", label: "Раскрытие информации" },
  { href: "/gcb", label: "ГЦБ" },
  { href: "/news", label: "Новости" },
];

/** Услуги — тексты блока «Наши услуги» с текущей главной. */
export const services = [
  {
    title: "Организация торгов",
    text: "Биржевые торги акциями, облигациями и другими ценными бумагами.",
    href: "/market",
  },
  {
    title: "Листинг",
    text: "Включение компаний в биржевой список и сопровождение эмитентов.",
    href: "/listing",
  },
  {
    title: "Аукционы ГЦБ",
    text: "Размещение и обращение государственных ценных бумаг и депозитов.",
    href: "/gcb",
  },
  {
    title: "Товарно-сырьевой сектор",
    text: "Торги драгоценными металлами и биржевыми товарами.",
    href: "/commodity",
  },
  {
    title: "Раскрытие информации",
    text: "Публикация отчётов и существенных фактов эмитентов.",
    href: "/disclosure",
  },
  {
    title: "Учебный центр",
    text: "Курсы и семинары по рынку ценных бумаг для специалистов и инвесторов.",
    href: EDU_URL,
  },
];

/** Шаги «Как начать инвестировать» — с текущей главной. */
export const steps = [
  {
    title: "Выберите брокера",
    text: "Сделки на бирже заключаются только через лицензированных участников торгов.",
    href: "/members",
  },
  {
    title: "Разберитесь в основах",
    text: "Курсы учебного центра объяснят, как устроен рынок ценных бумаг.",
    href: EDU_URL,
  },
  {
    title: "Выберите инструменты",
    text: "Акции, облигации, ГЦБ и драгоценные металлы — котировки по каждой бумаге.",
    href: "/market/quotes",
  },
  {
    title: "Подайте заявку",
    text: "Поручите брокеру купить или продать бумаги — сделка пройдёт на торговой сессии.",
    href: "/market",
  },
];

export function dateKey(value: string) {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
}

/** Торговая сессия КФБ: будни 9:00–17:00 по Бишкеку. */
export function session() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bishkek",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const open = parts.weekday !== "Sat" && parts.weekday !== "Sun" && minutes >= 9 * 60 && minutes < 17 * 60;
  return {
    open,
    clock: `${parts.hour}:${parts.minute}`,
    label: open ? "Сессия открыта" : "Сессия закрыта",
  };
}

export async function loadConceptData() {
  const [content, issuers, market] = await Promise.all([loadPublicContent(), loadIssuerData(), loadMarketData()]);
  const count = (type: string) => market.instruments.filter((item) => item.type === type).length;
  const settings = content.settings;
  const news = content.news
    // Без анонса — черновые записи вроде тестовых: в макетах они ломают первую полосу.
    .filter((item) => item.status === "published" && isGeneralNews(item) && item.excerpt.trim())
    .sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)))
    .slice(0, 4)
    .map((item) => ({
      slug: item.slug,
      date: item.date,
      tag: item.tag,
      title: item.title,
      excerpt: item.excerpt,
      photo: item.photo,
      urgent: item.kind === "urgent",
    }));

  return {
    live: market.live,
    session: {
      ...session(),
      hours: market.sessionHours,
      date: market.sessionDate,
    },
    index: market.index,
    history: market.indexHistory.map((row) => row.index).slice(-60),
    volume: market.stats,
    leaders: market.weekLeaders.slice(0, 6),
    auctions: market.auctions.slice(0, 4),
    instruments: {
      total: market.instruments.length,
      stocks: count("stock"),
      bonds: count("bond"),
      gcb: count("gcb"),
      metals: count("metal"),
    },
    issuers: issuers.issuers.length,
    listed: issuers.listing.length,
    news,
    /** Описание биржи из админки («Контакты и подвал»). */
    tagline: settings.tagline,
    contacts: {
      address: settings.address,
      phones: settings.phones
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      email: settings.emails.split("\n")[0]?.trim() ?? "",
      license: settings.license,
      copyright: settings.copyright || "© ЗАО «Кыргызская фондовая биржа»",
    },
  };
}

export type ConceptData = Awaited<ReturnType<typeof loadConceptData>>;

const nf = (digits: number) =>
  new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export function num(value: number, digits = 0) {
  return nf(digits).format(value);
}

export function pct(value: number) {
  return `${value > 0 ? "+" : ""}${nf(2).format(value)}%`;
}

const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

/** «13.08.2026» → «13 августа 2026». */
export function longDate(value: string) {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return match ? `${Number(match[1])} ${months[Number(match[2]) - 1]} ${match[3]}` : value;
}

/** SVG-путь ломаной по ряду значений в прямоугольнике width×height. */
export function linePath(values: number[], width: number, height: number, pad = 2) {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((value, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = pad + (1 - (value - min) / span) * (height - pad * 2);
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

/** Внешние ссылки (учебный центр) открываем в новой вкладке. */
export function linkProps(href: string) {
  return href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {};
}
