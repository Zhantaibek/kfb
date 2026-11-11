import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Inter } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import { pickNewsPhotos } from "../_shared/news-photos";
import { DealStory, type Step } from "./DealStory";
import css from "./sdelka.module.css";

/*
 * Концепция 42 — «Сделка»: главная объясняет, как работает биржа, на примере одной сделки. Рассказ при прокрутке:
 * закреплённая схема участников (инвестор → брокер → биржа → депозитарий → компания), «заявка» переезжает по ней,
 * под схемой — карточка с реальными данными шага. После рассказа — рынок сегодня, новости и контакты.
 */
const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"], variable: "--sd-font" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "42 · Сделка" };

export default async function SdelkaConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const paper = priced[0];
  const report = data.companyNews[0];
  const news = data.news.slice(0, 3);
  const photos = pickNewsPhotos(news);
  const auction = data.auctions[0];
  const ticker = paper?.ticker ?? "бумагу";

  const steps: Step[] = [
    {
      node: 0,
      kicker: "Шаг 1 · Инвестор",
      title: "Вы выбираете бумагу",
      text: "Изучаете котировки и отчётность компании и решаете, что купить. Цены всех бумаг — открытые, по итогам торгов.",
      card: paper
        ? { label: "Например", value: `${paper.ticker} · ${num(paper.price, 2)} сом`, note: paper.name, href: paper.href }
        : { label: "Котировки", value: `${num(data.quotes.total)} бумаг`, note: "Цены последней сессии", href: "/market/quotes" },
    },
    {
      node: 1,
      kicker: "Шаг 2 · Брокер",
      title: "Брокер выставляет заявку",
      text: "Сделки на бирже заключают только лицензированные участники торгов. Вы открываете у брокера счёт и даёте поручение.",
      card: {
        label: "Пример поручения",
        value: `Купить ${ticker}`,
        note: paper ? `по цене до ${num(paper.price, 2)} сом на ближайшей сессии` : "на ближайшей торговой сессии",
        href: "/members",
      },
    },
    {
      node: 2,
      kicker: "Шаг 3 · Биржа",
      title: "Торги сводят покупателя и продавца",
      text: `Биржа проводит торговую сессию по будням ${data.session.hours}. Цена складывается из заявок участников — открыто и по единым правилам.`,
      card: {
        label: `Сессия ${longDate(data.session.date)}`,
        value: `${num(data.volume.volumeMln, 1)} млн сом`,
        note: `${num(data.volume.trades)} сделок · ${data.session.label.toLowerCase()}`,
        href: "/market",
      },
    },
    {
      node: 3,
      kicker: "Шаг 4 · Депозитарий",
      title: "Бумаги переходят к вам",
      text: "После сделки права на ценные бумаги учитываются в депозитарии и у регистратора. Деньги — продавцу, бумаги — вам.",
      card: { label: "Учёт прав", value: "Центральный депозитарий", note: "и регистраторы ведут учёт владельцев бумаг", href: "/about" },
    },
    {
      node: 4,
      kicker: "Шаг 5 · Компания",
      title: "Компания отчитывается перед вами",
      text: "Эмитенты публикуют годовые отчёты и существенные факты, а владельцы бумаг могут получать дивиденды и купоны.",
      card: report
        ? { label: report.company, value: `${num(data.issuers)} эмитентов`, note: report.title, href: "/disclosure" }
        : { label: "Раскрытие", value: `${num(data.issuers)} эмитентов`, note: "публикуют отчётность", href: "/disclosure" },
    },
    {
      node: 2,
      kicker: "Итог",
      title: "Итоги видны всем",
      text: "После каждой сессии биржа публикует цены, объёмы и индекс. Так рынок остаётся прозрачным для каждого инвестора.",
      card: { label: "Индекс KSE", value: num(data.index.value, 2), note: `${pct(data.index.change)} за сессию`, href: "/market/index" },
    },
  ];

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${inter.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <Link href="/design-concepts/sdelka" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={28} height={26} priority />
            <span>Кыргызская фондовая биржа</span>
          </Link>
          <nav className={css.nav} aria-label="Основное меню">
            <Link href="/market">Торги</Link>
            <Link href="/members">Инвесторам</Link>
            <Link href="/listing">Эмитентам</Link>
            <Link href="/gcb">ГЦБ</Link>
            <Link href="/about">О бирже</Link>
          </nav>
          <Link href="/members" className={css.headCta}>
            Начать
          </Link>
        </header>

        <main id="main">
          {/* 1. Первый экран. */}
          <section className={css.hero} aria-labelledby="sd-hero">
            <p className={css.pill} data-intro="fade">
              <i data-open={data.session.open || undefined} aria-hidden="true" />
              {data.session.label} · индекс KSE {num(data.index.value, 2)}
            </p>
            <h1 id="sd-hero" data-intro="rise" style={{ "--kc-d": "80ms" } as CSSProperties}>
              Как работает биржа — на примере одной сделки
            </h1>
            <p className={css.lead} data-intro="rise" style={{ "--kc-d": "160ms" } as CSSProperties}>
              Пять участников, шесть шагов и реальные данные последней сессии. Листайте вниз — сделка пройдёт у вас на глазах.
            </p>
            <a href="#story" className={css.scroll} data-intro="rise" style={{ "--kc-d": "240ms" } as CSSProperties}>
              <span aria-hidden="true">↓</span> Начать
            </a>
          </section>

          {/* 2. Рассказ при прокрутке. */}
          <section id="story" className={css.storyWrap} aria-label="Как проходит сделка">
            <DealStory steps={steps} />
          </section>

          {/* 3. Рынок сегодня. */}
          <section className={css.market} aria-labelledby="sd-market">
            <div className={css.sectionHead}>
              <h2 id="sd-market">Рынок сегодня</h2>
              <Link href="/market">Итоги торгов →</Link>
            </div>
            <div className={css.marketGrid}>
              <dl className={css.kpis}>
                <div>
                  <dt>Индекс KSE</dt>
                  <dd>{num(data.index.value, 2)}</dd>
                  <small className={data.index.change >= 0 ? css.up : css.down}>{pct(data.index.change)}</small>
                </div>
                <div>
                  <dt>Капитализация</dt>
                  <dd>{num(data.index.capitalization, 1)}</dd>
                  <small>млрд сом</small>
                </div>
                <div>
                  <dt>Эмитентов</dt>
                  <dd>{num(data.issuers)}</dd>
                  <small>{num(data.listed)} бумаг в листинге</small>
                </div>
                <div>
                  <dt>Аукцион ГЦБ</dt>
                  <dd>{auction ? auction.date : "—"}</dd>
                  <small>{auction ? auction.volume : "календарь Минфина"}</small>
                </div>
              </dl>
              <ul className={css.quotes}>
                {priced.slice(0, 6).map((item) => (
                  <li key={item.ticker}>
                    <Link href={item.href}>
                      <b>{item.ticker}</b>
                      <span>{item.name}</span>
                      <strong>{num(item.price, 2)}</strong>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 4. Новости. */}
          <section className={css.news} aria-labelledby="sd-news">
            <div className={css.sectionHead}>
              <h2 id="sd-news">Новости</h2>
              <Link href="/news">Все новости →</Link>
            </div>
            <ul>
              {news.map((item, i) => (
                <li key={item.slug}>
                  <Link href={`/news/${item.slug}`}>
                    <span className={css.newsPhoto}>
                      <Image src={photos[i]} alt="" fill sizes="(max-width: 720px) 100vw, 380px" />
                    </span>
                    <small>
                      {item.tag} · {longDate(item.date)}
                    </small>
                    <b>{item.title}</b>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 5. Финал. */}
          <section className={css.final} aria-labelledby="sd-final">
            <h2 id="sd-final">Готовы к своей первой сделке?</h2>
            <p>Начните с выбора брокера — участника торгов биржи.</p>
            <div className={css.finalActions}>
              <Link href="/members" className={css.btnLight}>
                Выбрать брокера
              </Link>
              <Link href={EDU_URL} className={css.btnGhost} {...linkProps(EDU_URL)}>
                Учебный центр
              </Link>
            </div>
          </section>
        </main>

        <footer className={css.footer}>
          <div>
            <b>Кыргызская фондовая биржа</b>
            <p>
              {data.contacts.address} · {data.contacts.phones[0] ?? ""}
            </p>
          </div>
          <nav aria-label="Подвал">
            <Link href="/market">Итоги торгов</Link>
            <Link href="/listing">Листинг</Link>
            <Link href="/disclosure">Раскрытие</Link>
            <Link href="/documents">Документы</Link>
            <Link href="/contacts">Контакты</Link>
          </nav>
          <p className={css.legal}>
            {data.contacts.copyright}. {data.contacts.license ? `Лицензия ${data.contacts.license}. ` : ""}Информация на сайте не является инвестиционной рекомендацией.
          </p>
        </footer>
        <ConceptSwitch current="sdelka" />
      </div>
    </ConceptPage>
  );
}
