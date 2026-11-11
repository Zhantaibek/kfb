import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Inter, Literata } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, steps } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import css from "./azbuka.module.css";

/*
 * Концепция 30 — «Азбука»: главная как руководство для частного инвестора. Спокойный деловой тон: словарь
 * терминов с примерами на настоящих бумагах последней сессии, схема сделки, частые вопросы, порядок действий.
 * Слоновая кость, тёмно-синий и приглушённое золото, антиква Literata в заголовках, Inter в тексте, фото биржи.
 */
const serif = Literata({ subsets: ["latin", "cyrillic"], weight: ["500", "600"], variable: "--az-serif" });
const sans = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], variable: "--az-sans" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "30 · Азбука" };

const questions = [
  { q: "Можно ли купить акции на бирже напрямую?", a: "Нет. Заявку на бирже выставляет брокер — лицензированный участник торгов. Вы открываете у него счёт и даёте поручение." },
  { q: "Чем облигация отличается от акции?", a: "Акция — доля в компании, доход зависит от её результатов. Облигация — долговое обязательство: эмитент возвращает вложенные средства с процентом в установленный срок." },
  { q: "Где узнать о финансовом положении компании?", a: "Эмитенты, чьи бумаги обращаются на бирже, публикуют годовые отчёты и существенные факты в Центре раскрытия информации." },
  { q: "Даёт ли биржа рекомендации, что покупать?", a: "Нет. Биржа организует торги и публикует их итоги. Решение об инвестициях принимает инвестор, при необходимости — с помощью своего брокера." },
];

const flow = [
  { who: "Инвестор", text: "принимает решение и даёт поручение" },
  { who: "Брокер", text: "выставляет заявку на торгах" },
  { who: "Биржа", text: "сводит заявки покупателей и продавцов" },
  { who: "Депозитарий", text: "учитывает права на ценные бумаги" },
];

export default async function AzbukaConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const stock = priced.find((item) => item.type === "stock");
  const bond = priced.find((item) => item.type === "bond");
  const auction = data.auctions[0];

  const terms = [
    {
      term: "Акция",
      text: "Ценная бумага, удостоверяющая долю в капитале компании. Даёт право на часть прибыли — дивиденды — и на участие в управлении.",
      example: stock ? `${stock.ticker} — акция ${stock.name}: ${num(stock.price, 2)} сом на последней сессии.` : null,
      href: stock?.href ?? "/market/quotes",
    },
    {
      term: "Облигация",
      text: "Долговая ценная бумага. Эмитент обязуется вернуть номинальную стоимость в срок и выплачивать доход.",
      example: bond ? `${bond.ticker} — облигация ${bond.name}: ${num(bond.price, 2)} сом.` : null,
      href: bond?.href ?? "/market/quotes",
    },
    {
      term: "ГЦБ",
      text: "Государственные ценные бумаги, выпускаемые Министерством финансов. Размещаются на аукционах биржи.",
      example: auction ? `Ближайший аукцион — ${auction.date}, выпуск ${auction.type}, объём ${auction.volume}.` : null,
      href: "/gcb",
    },
    {
      term: "Индекс KSE",
      text: "Показатель, отражающий общую динамику цен на рынке акций биржи.",
      example: `Значение на ${longDate(data.session.date)} — ${num(data.index.value, 2)}.`,
      href: "/market/index",
    },
  ];

  return (
    <ConceptPage accent="#13233a">
      <div className={`${css.page} ${serif.variable} ${sans.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <Link href="/design-concepts/azbuka" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={32} height={30} priority />
            <span>Кыргызская фондовая биржа</span>
          </Link>
          <nav className={css.nav} aria-label="Основное меню">
            <a href="#terms">Словарь</a>
            <a href="#deal">Как проходит сделка</a>
            <a href="#faq">Вопросы</a>
            <a href="#start">С чего начать</a>
            <Link href="/market/quotes">Котировки</Link>
          </nav>
          <Link href="/members" className={css.headCta}>
            Участники торгов
          </Link>
        </header>

        <main id="main">
          {/* 1. Первый экран. */}
          <section className={css.hero} aria-labelledby="az-hero">
            <div className={css.heroText}>
              <p className={css.kicker} data-intro="fade">
                Руководство для частного инвестора
              </p>
              <h1 id="az-hero" data-intro="rise" style={{ "--kc-d": "80ms" } as CSSProperties}>
                Фондовый рынок — простыми словами
              </h1>
              <p className={css.lead} data-intro="rise" style={{ "--kc-d": "160ms" } as CSSProperties}>
                Что такое акции, облигации и государственные ценные бумаги, как проходит сделка на бирже и с чего начать. Коротко и по существу.
              </p>
              <div className={css.heroActions} data-intro="rise" style={{ "--kc-d": "240ms" } as CSSProperties}>
                <a href="#terms" className={css.btn}>
                  Читать руководство
                </a>
                <Link href="/members" className={css.btnLine}>
                  Список брокеров
                </Link>
              </div>
            </div>
            <figure className={css.heroPhoto} data-intro="fade" style={{ "--kc-d": "120ms" } as CSSProperties}>
              <Image src="/hero/issuer-signing.jpg" alt="Подписание документов на бирже" fill priority sizes="(max-width: 900px) 100vw, 46vw" />
              <figcaption>
                Индекс KSE — <b>{num(data.index.value, 2)}</b> · сессия {longDate(data.session.date)}
              </figcaption>
            </figure>
          </section>

          {/* 2. Словарь. */}
          <section id="terms" className={css.section} aria-labelledby="az-terms">
            <div className={css.sectionHead}>
              <p className={css.num}>01</p>
              <h2 id="az-terms">Словарь инвестора</h2>
              <p>Четыре понятия, с которых начинается знакомство с рынком. Примеры — бумаги и данные последней сессии.</p>
            </div>
            <dl className={css.terms} data-stagger>
              {terms.map((item) => (
                <div key={item.term}>
                  <dt>{item.term}</dt>
                  <dd>
                    <p>{item.text}</p>
                    {item.example ? (
                      <Link href={item.href} className={css.example}>
                        <span>Пример</span>
                        {item.example}
                      </Link>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* 3. Как проходит сделка. */}
          <section id="deal" className={css.section} aria-labelledby="az-deal">
            <div className={css.sectionHead}>
              <p className={css.num}>02</p>
              <h2 id="az-deal">Как проходит сделка</h2>
              <p>Биржа не продаёт бумаги и не даёт рекомендаций. Она проводит открытые торги: цены видны всем, итоги каждой сессии публикуются.</p>
            </div>
            <ol className={css.flow} data-stagger>
              {flow.map((item, i) => (
                <li key={item.who}>
                  <span className={css.flowNum}>{i + 1}</span>
                  <b>{item.who}</b>
                  <span>{item.text}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* 4. Вопросы. */}
          <section id="faq" className={css.section} aria-labelledby="az-faq">
            <div className={css.sectionHead}>
              <p className={css.num}>03</p>
              <h2 id="az-faq">Частые вопросы</h2>
            </div>
            <div className={css.faq} data-reveal>
              {questions.map((item, i) => (
                <details key={item.q} open={i === 0}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* 5. С чего начать. */}
          <section id="start" className={css.section} aria-labelledby="az-start">
            <div className={css.sectionHead}>
              <p className={css.num}>04</p>
              <h2 id="az-start">С чего начать</h2>
            </div>
            <ol className={css.steps} data-stagger>
              {steps.map((step, i) => (
                <li key={step.title}>
                  <Link href={step.href} {...linkProps(step.href)}>
                    <span className={css.stepNum}>{String(i + 1).padStart(2, "0")}</span>
                    <b>{step.title}</b>
                    <span>{step.text}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          {/* 6. Учебный центр. */}
          <section className={css.edu} aria-labelledby="az-edu">
            <div className={css.eduInner}>
              <div>
                <h2 id="az-edu">Учебный центр биржи</h2>
                <p>Курсы и семинары по рынку ценных бумаг — для частных инвесторов и специалистов финансовых организаций.</p>
              </div>
              <Link href={EDU_URL} className={css.btnLight} {...linkProps(EDU_URL)}>
                Программы обучения
              </Link>
            </div>
          </section>

          {/* 7. Новости. */}
          <section className={css.section} aria-labelledby="az-news">
            <div className={css.newsHead}>
              <h2 id="az-news">Новости биржи</h2>
              <Link href="/news">Все новости →</Link>
            </div>
            <ul className={css.news} data-stagger>
              {data.news.slice(0, 3).map((item) => (
                <li key={item.slug}>
                  <Link href={`/news/${item.slug}`}>
                    <span className={css.newsPhoto}>
                      <Image src={item.photo} alt="" fill sizes="(max-width: 720px) 100vw, 360px" />
                    </span>
                    <time>{longDate(item.date)}</time>
                    <b>{item.title}</b>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </main>

        <footer className={css.footer}>
          <div>
            <b>Кыргызская фондовая биржа</b>
            <p>{data.contacts.address}</p>
            <p>
              {data.contacts.phones[0] ?? ""}
              {data.contacts.email ? (
                <>
                  {" · "}
                  <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a>
                </>
              ) : null}
            </p>
          </div>
          <nav aria-label="Подвал">
            <Link href="/market">Итоги торгов</Link>
            <Link href="/disclosure">Раскрытие информации</Link>
            <Link href="/listing">Листинг</Link>
            <Link href="/about">О бирже</Link>
            <Link href="/contacts">Контакты</Link>
          </nav>
          <p className={css.legal}>
            {data.contacts.copyright}. Материалы носят информационный характер и не являются инвестиционной рекомендацией.
          </p>
        </footer>
        <ConceptSwitch current="azbuka" />
      </div>
    </ConceptPage>
  );
}
