import type { Metadata } from "next";
import { headers } from "next/headers";
import { tr, type Lang } from "@/lib/i18n";
import {
  isLang,
  LANG_HEADER,
  languageAlternates,
  localizedPath,
  metaDescription,
  ogLocale,
  PATH_HEADER,
  SEO_LANGS,
  splitLangPath,
} from "@/lib/seo";

/** Название и описание сайта на трёх языках — для заголовков, соцсетей и поисковиков. */
export const siteText: Record<Lang, { name: string; home: string; description: string }> = {
  ru: {
    name: "Кыргызская фондовая биржа",
    home: "Кыргызская фондовая биржа — финансовый рынок Кыргызстана",
    description:
      "Официальный портал Кыргызской фондовой биржи: котировки, итоги торгов, листинг, раскрытие информации и инвестиции в ГЦБ.",
  },
  ky: {
    name: "Кыргыз фондулук биржасы",
    home: "Кыргыз фондулук биржасы — Кыргызстандын финансы рыногу",
    description:
      "Кыргыз фондулук биржасынын расмий порталы: котировкалар, соода жыйынтыктары, листинг, маалымат ачыкка чыгаруу жана МБК инвестициялары.",
  },
  en: {
    name: "Kyrgyz Stock Exchange",
    home: "Kyrgyz Stock Exchange — Kyrgyzstan's financial market",
    description:
      "Official portal of the Kyrgyz Stock Exchange: quotes, trading results, listing, disclosure and investing in government securities.",
  },
};

/** Общее превью для соцсетей — генерируется app/opengraph-image.tsx. */
export const DEFAULT_OG_IMAGE = "/opengraph-image";

/** Язык и адрес текущей страницы — их выставляет proxy.ts. */
export async function requestLocale() {
  const list = await headers();
  const lang = list.get(LANG_HEADER);
  return {
    lang: isLang(lang) ? lang : ("ru" as Lang),
    path: splitLangPath(list.get(PATH_HEADER) ?? "/").path,
  };
}

/**
 * Open Graph целиком: в Next вложенный openGraph страницы заменяет общий полностью,
 * поэтому адрес, язык и название сайта повторяем здесь.
 */
export function openGraphFor(lang: Lang, path: string, title: string, description: string, extra: Partial<NonNullable<Metadata["openGraph"]>> = {}) {
  return {
    type: "website",
    locale: ogLocale[lang],
    alternateLocale: SEO_LANGS.filter((item) => item !== lang).map((item) => ogLocale[item]),
    url: localizedPath(path, lang),
    siteName: siteText[lang].name,
    title,
    description,
    // Своя картинка страницы задаётся через extra.images; иначе — общее превью сайта (app/opengraph-image.tsx).
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: siteText[lang].name }],
    ...extra,
  } as NonNullable<Metadata["openGraph"]>;
}

/** Описания основных разделов (по-русски); на KY/EN описание собирается из переведённого названия. */
const descriptions: Record<string, string> = {
  "/about": "Кыргызская фондовая биржа с 1994 года: история, лицензии, руководство, акционеры и партнёры биржи.",
  "/about/partners": "Партнёры Кыргызской фондовой биржи: биржи, депозитарии, международные организации и профессиональные участники рынка.",
  "/market": "Итоги торгов на Кыргызской фондовой бирже: объём, число сделок, цены и изменения по ценным бумагам за торговый день.",
  "/market/quotes": "Котировки ценных бумаг на Кыргызской фондовой бирже: цены спроса и предложения, последняя сделка и объём торгов.",
  "/market/index": "Индекс KSE и капитализация рынка акций Кыргызстана: значения, динамика и история.",
  "/market/archive": "Архив торгов Кыргызской фондовой биржи: сделки и итоги торговых сессий за прошлые даты.",
  "/market/metals": "Котировки драгоценных металлов на Кыргызской фондовой бирже: золото и серебро, цены покупки и продажи.",
  "/gcb": "Государственные ценные бумаги Кыргызстана на бирже: расписание аукционов, ГКВ и ГКО, доходность и объёмы.",
  "/gcb/results": "Результаты аукционов государственных ценных бумаг: объём размещения, спрос и средневзвешенная доходность.",
  "/gcb/volume": "Объём государственных ценных бумаг в обращении на Кыргызской фондовой бирже.",
  "/gcb/deposits": "Результаты аукционов по размещению депозитов на Кыргызской фондовой бирже.",
  "/listing": "Листинг Кыргызской фондовой биржи: компании и ценные бумаги в официальном списке по категориям.",
  "/disclosure": "Центр раскрытия информации: отчёты, существенные факты и документы эмитентов ценных бумаг Кыргызстана.",
  "/members": "Участники торгов Кыргызской фондовой биржи: брокеры и дилеры, лицензии и контакты.",
  "/members/rating": "Рейтинг участников торгов Кыргызской фондовой биржи по объёму сделок.",
  "/investors": "Как начать инвестировать на Кыргызской фондовой бирже: брокеры, ценные бумаги, ГЦБ и полезные материалы.",
  "/news": "Новости Кыргызской фондовой биржи и эмитентов: торги, листинг, аукционы ГЦБ, события рынка капитала.",
  "/contacts": "Контакты Кыргызской фондовой биржи в Бишкеке: адрес, телефоны, e-mail и отдел раскрытия информации.",
  "/documents": "Корпоративные документы Кыргызской фондовой биржи: устав, правила, положения и отчётность.",
  "/tariffs": "Тарифы Кыргызской фондовой биржи: комиссии за сделки, листинг и услуги для участников рынка.",
  "/islamic": "Исламские финансы на Кыргызской фондовой бирже: сукук и инструменты, соответствующие нормам шариата.",
  "/commodity": "Товарно-сырьевой сектор Кыргызской фондовой биржи: биржевая торговля товарами и участники.",
  "/finmarket": "Финансовый рынок Кыргызстана: ключевые показатели, участники и регулирование.",
  "/sustainable": "Устойчивое развитие на Кыргызской фондовой бирже: зелёные облигации, ESG-отчёты и верификаторы.",
  "/statistics": "Статистика торгов Кыргызской фондовой биржи: итоги, котировки, индекс, архив и рейтинг участников.",
  "/analytics": "Аналитика по рынку ценных бумаг Кыргызстана и обзоры Кыргызской фондовой биржи.",
};

/**
 * Метаданные страницы с содержимым из CMS (новость, страница, эмитент): заголовок и описание
 * уже на языке адреса, картинка для соцсетей, для новостей — тип «статья» и даты.
 */
export async function contentMetadata(input: {
  title: string;
  description?: string;
  image?: string;
  article?: { publishedTime?: string; modifiedTime?: string; section?: string };
  noindex?: boolean;
}): Promise<Metadata> {
  const { lang, path } = await requestLocale();
  const text = metaDescription(input.description || `${input.title} — ${siteText[lang].name}. ${siteText[lang].description}`);
  const images = input.image ? [{ url: input.image }] : undefined;
  const fullTitle = `${input.title} | ${siteText[lang].name}`;
  return {
    title: input.title,
    description: text,
    alternates: { canonical: localizedPath(path, lang), languages: languageAlternates(path) },
    openGraph: openGraphFor(lang, path, fullTitle, text, {
      ...(images ? { images } : {}),
      ...(input.article ? { type: "article", ...input.article } : {}),
    }),
    twitter: { card: "summary_large_image", title: fullTitle, description: text, ...(images ? { images } : {}) },
    ...(input.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Дата новости «2026-10-12» или «12.10.2026» → ISO для поисковиков; непонятная дата — undefined. */
export function isoDate(value: string | undefined) {
  if (!value) return undefined;
  const ru = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(value);
  const date = new Date(ru ? `${ru[3]}-${ru[2]}-${ru[1]}` : value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * generateMetadata для страницы: название на языке адреса, своё описание, canonical и hreflang.
 * Использование: `export const generateMetadata = pageMetadata("Новости");`
 */
export function pageMetadata(title: string, description?: string, options: { noindex?: boolean } = {}) {
  return async function generateMetadata(): Promise<Metadata> {
    const { lang, path } = await requestLocale();
    const name = tr(lang, title);
    const own = description ?? descriptions[path];
    const text = metaDescription(
      lang === "ru" && own ? own : `${name} — ${siteText[lang].name}. ${siteText[lang].description}`,
    );
    return {
      title: name,
      description: text,
      alternates: { canonical: localizedPath(path, lang), languages: languageAlternates(path) },
      openGraph: openGraphFor(lang, path, `${name} | ${siteText[lang].name}`, text),
      twitter: { card: "summary_large_image", title: `${name} | ${siteText[lang].name}`, description: text },
      ...(options.noindex ? { robots: { index: false, follow: true } } : {}),
    };
  };
}
