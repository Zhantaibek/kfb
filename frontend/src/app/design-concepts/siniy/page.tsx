import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import { Tabs } from "../_shared/Tabs";
import { HeroSlider, MarketDesk, Showcase, type ShowCard, type Slide } from "./Interactive";
import css from "./siniy.module.css";

/*
 * Концепция 54 — «Синий». Повтор устройства и визуального языка главной bakai.kg по снимкам страницы:
 * двухэтажная шапка со строкой аудиторий и «таблетками», синий слайдер с полосками прогресса,
 * витрина с вкладками-таблетками и карточкой в центре, тёмный баннер, белые карточки, фото-баннер на всю ширину,
 * тёмная панель «Котировки + Калькулятор» с хромированными шарами, новости с вкладками и баннер учебного центра.
 * Без логотипа, текстов и изображений Bakai. Шрифты — сайта, данные — loadHomeData().
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "54 · Синий" };

const audiences = [
  { label: "КФБ", href: "/design-concepts/siniy" },
  { label: "Инвесторам", href: "/investors" },
  { label: "Эмитентам", href: "/listing" },
  { label: "Участникам торгов", href: "/members" },
  { label: "Раскрытие информации", href: "/disclosure" },
];

const nav = [
  { label: "Котировки", href: "/market/quotes" },
  { label: "Торги", href: "/market" },
  { label: "Листинг", href: "/listing" },
  { label: "ГЦБ", href: "/gcb" },
];

const services: ShowCard[] = [
  { title: "Торги и котировки", text: "Цены и сделки каждой сессии", href: "/market", photo: "/hub/hub-market.jpg" },
  { title: "Аукционы ГЦБ", text: "Государственные ценные бумаги Минфина", href: "/gcb", photo: "/hub/hub-gcb.jpg" },
  { title: "Листинг компаний", text: "Выход на биржу и размещение выпусков", href: "/listing", photo: "/hub/hub-listing.jpg" },
  { title: "Участники торгов", text: "Брокеры и дилеры с лицензией", href: "/members", photo: "/hub/hub-members.jpg" },
  { title: "Учебный центр", text: "Курсы для инвесторов и специалистов", href: EDU_URL, photo: "/hub/hub-education.jpg" },
  { title: "Раскрытие информации", text: "Отчёты и существенные факты эмитентов", href: "/disclosure", photo: "/hub/hub-disclosure.jpg" },
];

const footerCols = [
  { title: "Рынок", links: [["Котировки", "/market/quotes"], ["Индекс KSE", "/market/index"], ["Аукционы ГЦБ", "/gcb"], ["Статистика", "/statistics"]] },
  { title: "Компаниям", links: [["Листинг", "/listing"], ["Раскрытие информации", "/disclosure"], ["Тарифы", "/tariffs"], ["Документы", "/documents"]] },
  { title: "О бирже", links: [["О нас", "/about"], ["Участники торгов", "/members"], ["Новости", "/news"], ["Учебный центр", EDU_URL]] },
] as const;

function NewsCards({ items }: { items: { slug: string; date: string; title: string; excerpt: string; photo: string }[] }) {
  return (
    <div className={css.newsGrid}>
      {items.map((item) => (
        <article key={item.slug} className={css.newsCard}>
          <span className={css.newsPhoto}>
            <Image src={item.photo} alt="" fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw" />
          </span>
          <h3>{item.title}</h3>
          <p>{item.excerpt}</p>
          <time>{longDate(item.date)}</time>
          <Link href={`/news/${item.slug}`} className={css.btnLine} aria-label={`Подробнее: ${item.title}`}>
            Подробнее
          </Link>
        </article>
      ))}
    </div>
  );
}

export default async function SiniyConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const sessionDate = data.session.date ? longDate(data.session.date) : "последней сессии";
  const up = data.index.change >= 0;
  const next = data.auctions[0];
  const phones = data.contacts.phones.length ? data.contacts.phones : ["+996 312 31 14 84", "+996 551 31 14 84"];
  const address = data.contacts.address || "г. Бишкек, ул. Московская, 172";
  const email = data.contacts.email || "office@kse.kg";
  const license = data.contacts.license || "№37 НКРЦБ от 30.11.2000";

  const slides: Slide[] = [
    {
      title: `Индекс KSE — ${num(data.index.value, 2)}`,
      text: `${pct(data.index.change)} по итогам торгов ${sessionDate}. Капитализация рынка — ${num(data.index.capitalization, 1)} млн сом.`,
      href: "/market/index",
      cta: "Подробнее",
      photo: "/hero/market-charts.jpg",
      alt: "Графики биржевых котировок",
      chip: { label: "Индекс KSE", value: num(data.index.value, 2), delta: pct(data.index.change), up },
    },
    {
      title: "Аукционы государственных ценных бумаг",
      text: next ? `Ближайший аукцион — ${longDate(next.date)}: ${next.type}, объём ${next.volume}.` : "Казначейские векселя и облигации Министерства финансов — на бирже.",
      href: "/gcb",
      cta: "Календарь аукционов",
      photo: "/hub/hub-gcb.jpg",
      alt: "Государственные ценные бумаги",
    },
    {
      title: `Торги ${sessionDate}`,
      text: `Объём сессии — ${num(data.volume.volumeMln, 1)} млн сом, ${num(data.volume.trades)} сделок. В котировках ${data.quotes.total} бумаг.`,
      href: "/market",
      cta: "Итоги торгов",
      photo: "/hero/kse-entrance-garden.jpg",
      alt: "Вход в здание Кыргызской фондовой биржи",
      chip: { label: "Объём сессии", value: `${num(data.volume.volumeMln, 1)} млн` },
    },
    {
      title: "Выход компании на биржу",
      text: "Размещение акций и облигаций, листинг и сопровождение эмитента на каждом шаге.",
      href: "/listing",
      cta: "Подробнее",
      photo: "/hero/issuer-signing.jpg",
      alt: "Подписание документов эмитентом",
    },
    {
      title: "Учебный центр биржи",
      text: "Курсы для начинающих инвесторов и специалистов рынка ценных бумаг.",
      href: EDU_URL,
      cta: "Выбрать курс",
      photo: "/hub/hub-education.jpg",
      alt: "Занятие в учебном центре",
    },
  ];

  const quoteCards = (rows: typeof priced): ShowCard[] =>
    rows.slice(0, 7).map((item) => ({
      title: item.name,
      href: item.href,
      ticker: item.ticker,
      price: `${num(item.price, 2)} сом`,
      change: item.change ? pct(item.change) : undefined,
      up: item.change >= 0,
    }));

  const showGroups = [
    { label: "Сервисы", cards: services },
    { label: "Акции", cards: quoteCards(data.quotes.stocks.filter((item) => item.price > 0)) },
    { label: "Облигации", cards: quoteCards(data.quotes.bonds.filter((item) => item.price > 0)) },
    { label: "Металлы", cards: quoteCards(data.quotes.metals.filter((item) => item.price > 0)) },
  ].filter((group) => group.cards.length >= 2);

  const toRows = (rows: typeof priced) => rows.filter((item) => item.price > 0).map(({ ticker, name, price, change, href }) => ({ ticker, name, price, change, href }));
  const deskGroups = [
    { label: "Самые активные", rows: toRows(priced.slice(0, 10)) },
    { label: "Акции", rows: toRows(data.quotes.stocks) },
    { label: "Облигации и ГЦБ", rows: toRows(data.quotes.bonds) },
    { label: "Драгоценные металлы", rows: toRows(data.quotes.metals) },
  ].filter((group) => group.rows.length);

  const newsTabs = [
    { label: "Новости", items: data.news.slice(0, 4) },
    { label: "Сообщения эмитентов", items: data.companyNews.slice(0, 4) },
  ].filter((tab) => tab.items.length);

  return (
    <ConceptPage accent="#0b2a5e">
      <div className={css.page}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <div className={css.util}>
            <div className={css.wrap}>
              <nav aria-label="Аудитории">
                {audiences.map((item, i) => (
                  <Link key={item.label} href={item.href} aria-current={i === 0 ? "page" : undefined}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className={css.utilRight}>
                <Link href="/search" className={css.search}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
                  </svg>
                  Найти на сайте
                </Link>
                <span className={css.session} data-open={data.session.open ? "" : undefined}>
                  <i aria-hidden="true" />
                  {data.session.label}
                </span>
                <span className={css.lang}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
                  </svg>
                  Русский
                </span>
              </div>
            </div>
          </div>
          <div className={css.bar}>
            <div className={css.wrap}>
              <Link href="/design-concepts/siniy" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
                <Image src="/brand/kse-mark.png" alt="" width={40} height={37} priority />
                <span>KSE</span>
              </Link>
              <nav aria-label="Основные разделы" className={css.nav}>
                {nav.map((item) => (
                  <Link key={item.label} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className={css.pillsNav}>
                <Link href="/market/index" className={css.pill} data-tone="red">
                  ИНДЕКС
                </Link>
                <Link href={EDU_URL} className={css.pill} {...linkProps(EDU_URL)}>
                  KSE <em>Академия</em>
                </Link>
                <Link href="/statistics" className={css.pill}>
                  KSE <em>Данные</em>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main id="main">
          <h1 className={css.sr}>Кыргызская фондовая биржа</h1>

          <HeroSlider slides={slides} />

          {/* ——— Витрина ——— */}
          <section className={css.top}>
            <span className={`${css.orb} ${css.orbA}`} aria-hidden="true" />
            <span className={`${css.orb} ${css.orbB}`} aria-hidden="true" />
            <h2 className={css.title} data-reveal>
              Главное на бирже
            </h2>
            <div data-reveal>
              <Showcase groups={showGroups} />
            </div>
          </section>

          {/* ——— Тёмный баннер ——— */}
          <section className={css.wrap}>
            <div className={css.banner} data-reveal>
              <span className={css.bannerMark} aria-hidden="true">
                <i />
                <i />
              </span>
              <div className={css.bannerText}>
                <h2>Капитал для вашей компании</h2>
                <p>Акции и облигации на бирже — для роста бизнеса и новых проектов</p>
                <Link href="/listing" className={css.btnWhite}>
                  Подробнее
                </Link>
              </div>
              <span className={css.bannerPhoto}>
                <Image src="/hero/issuer-signing.jpg" alt="" fill sizes="(max-width: 900px) 100vw, 50vw" />
              </span>
            </div>
          </section>

          {/* ——— Две карточки ——— */}
          <section className={`${css.wrap} ${css.pair}`} data-stagger>
            <article className={css.offer}>
              <div>
                <h2>Ваши сбережения — в государственных бумагах</h2>
                <p>Казначейские векселя и облигации Минфина на аукционах биржи</p>
              </div>
              <span className={css.offerPhoto}>
                <Image src="/sectors/bank.jpg" alt="" fill sizes="(max-width: 900px) 40vw, 18vw" />
              </span>
              <Link href="/gcb" className={css.btnLine}>
                Подробнее
              </Link>
            </article>
            <article className={css.offer}>
              <div>
                <h2>Брокер для каждого</h2>
                <p>Участники торгов с лицензией — откройте счёт у любого из них</p>
              </div>
              <span className={css.offerPhoto}>
                <Image src="/hub/hub-members.jpg" alt="" fill sizes="(max-width: 900px) 40vw, 18vw" />
              </span>
              <Link href="/members" className={css.btnLine}>
                Подробнее
              </Link>
            </article>
          </section>

          {/* ——— Фото на всю ширину ——— */}
          <section className={css.wide}>
            <Image src="/hero/bishkek-ala-too.jpg" alt="" fill sizes="100vw" className={css.wideImg} />
            <div className={css.wideText} data-reveal>
              <h2>
                Рынок капитала
                <br />
                Кыргызстана
              </h2>
              <Link href="/market/quotes" className={css.btnWhite}>
                Открыть котировки
              </Link>
            </div>
          </section>

          {/* ——— Котировки и калькулятор ——— */}
          {deskGroups.length ? (
            <section className={css.deskWrap}>
              <span className={css.star} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className={css.pillObj} aria-hidden="true" />
              <div data-reveal>
                <MarketDesk groups={deskGroups} date={sessionDate} />
              </div>
            </section>
          ) : null}

          {/* ——— Новости ——— */}
          {newsTabs.length ? (
            <section className={css.news}>
              <div className={css.wrap} data-reveal>
                <Tabs label="Новости" css={css} tabs={newsTabs.map((tab) => ({ label: tab.label, content: <NewsCards items={tab.items} /> }))} />
                <div className={css.center}>
                  <Link href="/news" className={css.btnLine}>
                    Все новости
                  </Link>
                </div>
              </div>
            </section>
          ) : null}

          {/* ——— Учебный центр ——— */}
          <section className={css.appWrap}>
            <div className={`${css.wrap}`}>
              <div className={css.app} data-reveal>
                <span className={css.appBox} aria-hidden="true">
                  <Image src="/brand/kse-mark.png" alt="" width={150} height={140} />
                </span>
                <div className={css.appText}>
                  <h2>Учебный центр KSE</h2>
                  <p>Курсы для начинающих инвесторов и специалистов рынка ценных бумаг</p>
                  <Link href={EDU_URL} className={css.btnWhite} {...linkProps(EDU_URL)}>
                    Перейти к курсам
                  </Link>
                </div>
                <span className={css.appPhotos} aria-hidden="true">
                  <span>
                    <Image src="/hub/hub-education.jpg" alt="" fill sizes="220px" />
                  </span>
                  <span>
                    <Image src="/carousel/trading.jpg" alt="" fill sizes="220px" />
                  </span>
                </span>
              </div>
            </div>
          </section>
        </main>

        <footer className={css.footer}>
          <div className={css.wrap}>
            <div className={css.footTop}>
              <Link href="/design-concepts/siniy" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
                <Image src="/brand/kse-mark.png" alt="" width={40} height={37} />
                <span>KSE</span>
              </Link>
              <div className={css.phones}>
                {phones.slice(0, 2).map((phone) => (
                  <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                    {phone}
                  </a>
                ))}
              </div>
            </div>
            <div className={css.footCols}>
              {footerCols.map((col) => (
                <div key={col.title}>
                  <h2>{col.title}</h2>
                  <ul>
                    {col.links.map(([label, href]) => (
                      <li key={label}>
                        <Link href={href} {...linkProps(href)}>
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div>
                <h2>Контакты</h2>
                <ul>
                  <li>{address}</li>
                  <li>
                    <a href={`mailto:${email}`}>{email}</a>
                  </li>
                  <li>Лицензия {license}</li>
                </ul>
              </div>
            </div>
            <p className={css.legal}>{data.contacts.copyright}</p>
          </div>
        </footer>

        <ConceptSwitch current="siniy" />
      </div>
    </ConceptPage>
  );
}
