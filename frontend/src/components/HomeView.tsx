"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { HeroSlide } from "@/components/HeroSlider";
import { HomeHero } from "@/components/HomeHero";
import { MarketPulse } from "@/components/MarketPulse";
import { QuoteBoard } from "@/components/QuoteBoard";
import { ResourceRail } from "@/components/ResourceRail";
import { applyLocale } from "@/lib/cms/locale";
import { mediaSrc } from "@/lib/cms/media-src";
import type { CmsI18n } from "@/lib/cms/types";
import { useLang, useTr } from "@/lib/use-tr";
import styles from "@/app/page.module.css";
import { AdminEditButton } from "@/components/AdminEditButton";

const months: Record<string, string[]> = {
  ru: ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  ky: ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

function pressDate(value: string, lang: string) {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return value;
  const list = months[lang] ?? months.ru;
  return `${Number(match[1])} ${list[Number(match[2]) - 1]} ${match[3]}`;
}

function dateKey(value: string) {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
}

const services = [
  {
    title: "Организация торгов",
    text: "Биржевые торги акциями, облигациями и другими ценными бумагами.",
    href: "/market",
    icon: <path d="M6.5 6.5V19M12 3.5V17M17.5 8.5v11M5 9h3v7H5zM10.5 6h3v8h-3zM16 11h3v6h-3z" />,
  },
  {
    title: "Листинг",
    text: "Включение компаний в биржевой список и сопровождение эмитентов.",
    href: "/listing",
    icon: <path d="M13 20.5H6.5A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5H13l4 4V11M8.5 8.5h3M8.5 12h5M21 17a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM15.3 17l1.2 1.2 2.2-2.4" />,
  },
  {
    title: "Аукционы ГЦБ",
    text: "Размещение и обращение государственных ценных бумаг и депозитов.",
    href: "/gcb",
    icon: <path d="M12.5 3.5l6 6-3 3-6-6zM12.5 9.5l-7.5 7.5M3.5 18.5h9v2h-9zM16 3l5 5" />,
  },
  {
    title: "Товарно-сырьевой сектор",
    text: "Торги драгоценными металлами и биржевыми товарами.",
    href: "/commodity",
    icon: <path d="M3.5 20l1.5-5h6l1.5 5zM11.5 20l1.5-5h6l1.5 5zM7.5 13l1.5-5h6l1.5 5z" />,
  },
  {
    title: "Раскрытие информации",
    text: "Публикация отчётов и существенных фактов эмитентов.",
    href: "/disclosure",
    icon: <path d="M11 20.5H5.5A1.5 1.5 0 0 1 4 19V5a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 16 5v4M7.5 8h5M7.5 11.5h3M19 15a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM18 17.5l2.5 2.5" />,
  },
  {
    title: "Учебный центр",
    text: "Курсы и семинары по рынку ценных бумаг для специалистов и инвесторов.",
    href: "/education",
    icon: <path d="M2.5 9 12 4.5 21.5 9 12 13.5zM6.5 11v5c1.5 1.6 3.4 2.5 5.5 2.5s4-.9 5.5-2.5v-5M21.5 9v6" />,
  },
];

const startSteps = [
  {
    title: "Выберите брокера",
    text: "Сделки на бирже заключаются только через лицензированных участников торгов.",
    href: "/members",
    link: "Участники торгов",
  },
  {
    title: "Разберитесь в основах",
    text: "Курсы учебного центра объяснят, как устроен рынок ценных бумаг.",
    href: "/education",
    link: "Учебный центр",
  },
  {
    title: "Выберите инструменты",
    text: "Акции, облигации, ГЦБ и драгоценные металлы — котировки по каждой бумаге.",
    href: "/market/quotes",
    link: "Котировки",
  },
  {
    title: "Подайте заявку",
    text: "Поручите брокеру купить или продать бумаги — сделка пройдёт на торговой сессии.",
    href: "/market",
    link: "Итоги торгов",
  },
];

export type HomeNews = {
  slug: string;
  tag: string;
  date: string;
  title: string;
  excerpt: string;
  photo?: string;
  featured?: boolean;
  pinned?: boolean;
  company?: string;
  i18n?: CmsI18n;
};

type Props = {
  slides: HeroSlide[];
  news: HomeNews[];
  session: { open: boolean; clock: string; label: string; hours: string; date: string };
  index: { value: number; change: number; history: number[]; capitalization: number };
  volume: { value: number; change: number; trades: number };
  listing: { total: number; stocks: number; gcb: number; metals: number };
  gold?: { price: number; change: number };
  companyNews?: HomeNews[];
};

export function HomeView({ news, companyNews = [], index, volume, listing }: Props) {
  const tr = useTr();
  const lang = useLang();
  const localizedNews = news.map((item) => applyLocale(item, lang, ["title", "excerpt", "tag"]));
  const localizedCompanies = companyNews.map((item) => applyLocale(item, lang, ["title", "excerpt", "tag", "company"]));
  const featured = localizedNews.find((item) => item.featured) ?? localizedNews[0];
  const [newsTab, setNewsTab] = useState<"exchange" | "company">("exchange");
  const byDate = <T extends { date: string }>(items: T[]) =>
    [...items].sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date))).slice(0, 4);
  const exchangeItems = byDate(localizedNews.filter((item) => item.slug !== featured?.slug));
  const companyItems = byDate(localizedCompanies);
  const latest = newsTab === "company" ? companyItems : exchangeItems;

  return (
    <div className={styles.page}>
      <main className={styles.home}>
        <HomeHero index={index} volume={volume} listing={listing} />

        <section className={styles.services} aria-labelledby="services-title">
          <header className={styles.servicesHead}>
            <h2 id="services-title">{tr("Наши услуги")}</h2>
            <AdminEditButton href="/admin/hubs" />
          </header>
          <div className={styles.servicesGrid} data-stagger>
            {services.map((item) => (
              <Link className={styles.serviceCard} href={item.href} key={item.href}>
                <span className={styles.serviceIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24">{item.icon}</svg>
                </span>
                <b>{tr(item.title)}</b>
                <em>{tr(item.text)}</em>
                <span className={styles.serviceMore} aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <MarketPulse />
        <QuoteBoard />

        <section className={styles.newsHome} aria-labelledby="news-title">
          <header className={styles.newsIntro}>
            <p>{tr("Новости и обновления")}</p>
            <h2 id="news-title">{tr("Будьте в курсе последних событий")}</h2>
            <span>{tr("Объявления площадки, изменения правил и события рынка")}</span>
            <AdminEditButton href="/admin/news" />
          </header>
          {featured ? (
            <div className={styles.newsBoard} data-stagger>
              <Link className={styles.leadCard} href={`/news/${featured.slug}`}>
                <span className={styles.leadArt}>
                  {featured.photo ? (
                    <Image src={mediaSrc(featured.photo)} alt="" fill sizes="720px" unoptimized />
                  ) : null}
                  <em>{tr("Главное")}</em>
                </span>
                <time>{pressDate(featured.date, lang)}</time>
                <h3>{tr(featured.title)}</h3>
                {featured.excerpt ? <p>{tr(featured.excerpt)}</p> : null}
                <strong>
                  {tr("Читать далее")} <span aria-hidden="true">→</span>
                </strong>
              </Link>
              {exchangeItems.length || companyItems.length ? (
                <div className={styles.latestCard}>
                  <div className={styles.latestHead}>
                    <div className={styles.newsTabs} role="tablist" aria-label={tr("Новости")}>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={newsTab === "exchange"}
                        onClick={() => setNewsTab("exchange")}
                      >
                        {tr("Новости биржи")}
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={newsTab === "company"}
                        onClick={() => setNewsTab("company")}
                      >
                        {tr("Новости компаний")}
                      </button>
                    </div>
                    {newsTab === "company" ? (
                      <Link href="/disclosure">
                        {tr("Раскрытие")} <span aria-hidden="true">→</span>
                      </Link>
                    ) : (
                      <Link href="/news">
                        {tr("Все новости")} <span aria-hidden="true">→</span>
                      </Link>
                    )}
                  </div>
                  <div className={styles.latestList}>
                    {latest.map((item) => (
                      <Link href={`/news/${item.slug}`} key={item.slug}>
                        <span className={styles.latestThumb}>
                          {item.photo ? <Image src={mediaSrc(item.photo)} alt="" fill sizes="96px" unoptimized /> : null}
                        </span>
                        <span className={styles.latestMeta}>
                          <time>{pressDate(item.date, lang)}</time>
                          {newsTab === "company" && item.company ? <span>{item.company}</span> : null}
                        </span>
                        <b>{tr(item.title)}</b>
                        {item.excerpt ? <small>{tr(item.excerpt)}</small> : null}
                        <span className={styles.latestArrow} aria-hidden="true">
                          →
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className={styles.start} aria-labelledby="start-title">
          <header className={styles.startHead}>
            <div>
              <p>{tr("Первые шаги")}</p>
              <h2 id="start-title">{tr("Как начать инвестировать")}</h2>
            </div>
            <span>{tr("Четыре шага от выбора брокера до первой сделки на бирже")}</span>
          </header>
          <ol className={styles.startSteps}>
            {startSteps.map((step, i) => (
              <li key={step.title}>
                <span className={styles.startNum}>{String(i + 1).padStart(2, "0")}</span>
                <h3>{tr(step.title)}</h3>
                <p>{tr(step.text)}</p>
                <Link href={step.href}>
                  {tr(step.link)} <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <ResourceRail />
      </main>
    </div>
  );
}
