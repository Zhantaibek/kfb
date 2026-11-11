import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { CountUp } from "../_shared/CountUp";
import { linkProps, longDate, nav, num, pct, steps } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import { pickNewsPhotos } from "../_shared/news-photos";
import css from "./zelenyi.module.css";

/*
 * Концепция 45 — «Зелёный»: визуальный язык по мотивам Wise. Белый фон, огромные заголовки заглавными буквами,
 * фирменный бирюзовый #57b6c0 (как у основного сайта) и тёмная бирюза #163f45 для крупных секций и кнопок-«пилюль», мягкие радиусы 24–40px.
 * Первый экран — заголовок и три разных карточки (индекс со сферой, белый виджет итогов, «Эмитентам» со столбиками),
 * дальше рынок, «Инвесторам» (бирюзовая секция), «Эмитентам» (тёмная), мозаика услуг, новости и подвал.
 * Шрифты — те же, что у основного сайта (--font-display и --font-sans из app/layout.tsx). Цифры досчитываются при появлении.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "45 · Зелёный" };

function Arrow() {
  return (
    <svg className={css.arrow} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

function SmartLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={className} {...linkProps(href)}>
      {children}
    </Link>
  );
}

/** Абстрактная «3D»-сфера с орбитой — символ рынка капитала. */
function Sphere() {
  return (
    <svg className={css.sphere} viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <radialGradient id="zl-sphere" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#e3f4f6" />
          <stop offset="0.45" stopColor="#57b6c0" />
          <stop offset="1" stopColor="#2c7e87" />
        </radialGradient>
      </defs>
      <ellipse className={css.orbit} cx="100" cy="104" rx="96" ry="26" />
      <circle cx="100" cy="100" r="62" fill="url(#zl-sphere)" />
      <path d="M44 92c22 10 90 10 112 0M50 122c20 8 80 8 100 0M100 38c-18 20-18 104 0 124M100 38c18 20 18 104 0 124" fill="none" stroke="#163f45" strokeOpacity="0.18" strokeWidth="2" />
      <circle className={css.moon} cx="186" cy="104" r="9" fill="#e3f4f6" />
    </svg>
  );
}

/** Объёмные столбики — рост капитала компаний. */
function Columns() {
  const bars = [18, 62, 106, 150].map((x, i) => ({ x, h: [46, 74, 104, 136][i] }));
  return (
    <svg className={css.columns} viewBox="0 0 210 170" aria-hidden="true">
      {bars.map((bar, i) => {
        const w = 30;
        const d = 13;
        const y = 160 - bar.h;
        return (
          <g key={bar.x} className={css.column} style={{ animationDelay: `${0.9 + i * 0.09}s` }}>
            <rect x={bar.x} y={y} width={w} height={bar.h} fill="#163f45" />
            <polygon points={`${bar.x + w},${y} ${bar.x + w + d},${y - d / 1.6} ${bar.x + w + d},${160 - d / 1.6} ${bar.x + w},160`} fill="#13211e" />
            <polygon points={`${bar.x},${y} ${bar.x + d},${y - d / 1.6} ${bar.x + w + d},${y - d / 1.6} ${bar.x + w},${y}`} fill="#276f77" />
          </g>
        );
      })}
    </svg>
  );
}

const services = [
  { title: "Организация торгов", text: "Биржевые торги акциями, облигациями и другими ценными бумагами.", href: "/market", tone: "forest", icon: "M6.5 6.5V19M12 3.5V17M17.5 8.5v11M5 9h3v7H5zM10.5 6h3v8h-3zM16 11h3v6h-3z" },
  { title: "Листинг", text: "Включение компаний в биржевой список и сопровождение эмитентов.", href: "/listing", tone: "lime", icon: "M13 20.5H6.5A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5H13l4 4V11M8.5 8.5h3M8.5 12h5M21 17a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM15.3 17l1.2 1.2 2.2-2.4" },
  { title: "Аукционы ГЦБ", text: "Размещение и обращение государственных ценных бумаг и депозитов.", href: "/gcb", tone: "mint", icon: "M12.5 3.5l6 6-3 3-6-6zM12.5 9.5l-7.5 7.5M3.5 18.5h9v2h-9zM16 3l5 5" },
  { title: "Товарно-сырьевой сектор", text: "Торги драгоценными металлами и биржевыми товарами.", href: "/commodity", tone: "sand", icon: "M3.5 20l1.5-5h6l1.5 5zM11.5 20l1.5-5h6l1.5 5zM7.5 13l1.5-5h6l1.5 5z" },
  { title: "Раскрытие информации", text: "Публикация отчётов и существенных фактов эмитентов.", href: "/disclosure", tone: "line", icon: "M11 20.5H5.5A1.5 1.5 0 0 1 4 19V5a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 16 5v4M7.5 8h5M7.5 11.5h3M19 15a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM18 17.5l2.5 2.5" },
  { title: "Учебный центр", text: "Курсы и семинары по рынку ценных бумаг для специалистов и инвесторов.", href: EDU_URL, tone: "night", icon: "M2.5 9 12 4.5 21.5 9 12 13.5zM6.5 11v5c1.5 1.6 3.4 2.5 5.5 2.5s4-.9 5.5-2.5v-5M21.5 9v6" },
];

const infoLinks = [
  { label: "Котировки ценных бумаг", href: "/market/quotes" },
  { label: "Центр раскрытия информации", href: "/disclosure" },
  { label: "Участники торгов", href: "/members" },
  { label: "Правила и документы", href: "/documents" },
];

const issuerPoints = [
  { title: "Листинг", text: "Включение акций и облигаций в официальный список биржи — доверие инвесторов и прозрачная цена бумаг.", href: "/listing" },
  { title: "Выпуск облигаций и акций", text: "Привлечение финансирования на развитие бизнеса через размещение ценных бумаг на биржевых торгах.", href: "/listing" },
  { title: "Раскрытие информации", text: "Публикация отчётов и существенных фактов — в одном месте для всех участников рынка.", href: "/disclosure" },
];

export default async function ZelenyiConcept() {
  const data = await loadHomeData();
  const spark = smoothPath(data.history, 320, 90, 4);
  const bigChart = smoothPath(data.history, 760, 220, 8);
  const tone = (value: number) => (value < 0 ? "down" : value > 0 ? "up" : "flat");
  const volumeK = data.volume.volumeMln < 1;
  const top = data.instruments.filter((item) => item.price > 0).slice(0, 3);
  const quotes = data.instruments.filter((item) => item.price > 0).slice(0, 7);
  const instruments = [
    { label: "Акции", count: data.quotes.stocks.length, href: "/market/quotes" },
    { label: "Облигации и ГЦБ", count: data.quotes.bonds.length, href: "/gcb" },
    { label: "Драгоценные металлы", count: data.quotes.metals.length, href: "/commodity" },
  ].filter((item) => item.count > 0);
  const news = data.news.slice(0, 4);
  const photos = pickNewsPhotos(news);
  const [lead, ...rest] = news;

  return (
    <ConceptPage accent="#57b6c0">
      <div className={css.page}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        {/* Шапка. */}
        <header className={css.header}>
          <div className={css.headInner}>
            <Link href="/design-concepts/zelenyi" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={36} height={34} priority />
              <span>
                <b>Кыргызская фондовая биржа</b>
                <small>Kyrgyz Stock Exchange</small>
              </span>
            </Link>
            <nav className={css.nav} aria-label="Основное меню">
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className={css.headActions}>
              <Link href="/investors" className={css.headLink}>
                Инвесторам
              </Link>
              <Link href="/market" className={css.btnLimeSm}>
                Торги
              </Link>
            </div>
          </div>
        </header>

        <main id="main" className={css.main}>
          {/* 1. Первый экран. */}
          <section className={css.hero} aria-labelledby="zl-hero">
            <div className={css.top}>
              <p className={css.eyebrow}>
                <span className={css.live} data-open={data.session.open || undefined} aria-hidden="true" />
                Кыргызская фондовая биржа · {data.session.label}
              </p>
              <h1 id="zl-hero" className={css.title}>
                <span>Финансовые возможности.</span> <span>Развитие рынка.</span> <span className={css.mark}>Будущее Кыргызстана.</span>
              </h1>
              <p className={css.lead}>Кыргызская фондовая биржа объединяет инвесторов, эмитентов и профессиональных участников рынка капитала.</p>
              <div className={css.actions}>
                <Link className={css.btnLime} href="/market">
                  Перейти к торгам
                </Link>
                <Link className={css.btnOutline} href="/investors">
                  Инвесторам
                </Link>
              </div>
            </div>

            <div className={css.cards}>
              <Link className={`${css.card} ${css.cardForest}`} href="/market/index">
                <Sphere />
                <span className={css.cardLabel}>Индекс KSE</span>
                <strong className={css.bigNumber}>
                  <CountUp value={data.index.value} digits={2} />
                </strong>
                <span className={css.change} data-tone={tone(data.index.change)}>
                  {pct(data.index.change)}
                </span>
                {spark ? (
                  <svg className={css.spark} viewBox="0 0 320 90" preserveAspectRatio="none" aria-hidden="true">
                    <path d={spark.area} className={css.sparkArea} />
                    <path d={spark.line} className={css.sparkLine} />
                  </svg>
                ) : null}
                <span className={css.cardFoot}>
                  Капитализация <b>{num(data.index.capitalization, 1)} млрд сом</b>
                  <Arrow />
                </span>
              </Link>

              <div className={`${css.card} ${css.cardWidget}`}>
                <div className={css.widgetHead}>
                  <span className={css.cardLabel}>Итоги торгов</span>
                  <span className={css.session} data-open={data.session.open || undefined}>
                    {data.session.label}
                  </span>
                </div>
                <dl className={css.stats}>
                  <div className={css.statMain}>
                    <dt>Объём торгов</dt>
                    <dd>
                      <CountUp value={volumeK ? data.volume.volumeMln * 1000 : data.volume.volumeMln} digits={volumeK ? 0 : 1} />{" "}
                      <small>{volumeK ? "тыс. сом" : "млн сом"}</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Сделок</dt>
                    <dd>
                      <CountUp value={data.volume.trades} />
                    </dd>
                  </div>
                  <div>
                    <dt>Инструментов</dt>
                    <dd>
                      <CountUp value={data.quotes.total} />
                    </dd>
                  </div>
                  <div>
                    <dt>Эмитентов</dt>
                    <dd>
                      <CountUp value={data.issuers} />
                    </dd>
                  </div>
                </dl>
                {top.length ? (
                  <ul className={css.topList} aria-label="Крупнейшие по объёму">
                    {top.map((item) => (
                      <li key={item.ticker}>
                        <b>{item.ticker}</b>
                        <span>{item.name}</span>
                        <em>{num(item.price, 2)}</em>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className={css.widgetNote}>
                  {data.session.date ? `Торговый день ${data.session.date}` : "Последний торговый день"}
                  {data.session.hours ? ` · сессия ${data.session.hours}` : ""}
                </p>
                <Link className={css.btnForest} href="/market">
                  Все итоги торгов
                </Link>
              </div>

              <Link className={`${css.card} ${css.cardLime}`} href="/listing">
                <span className={css.cardLabel}>Эмитентам</span>
                <strong className={css.cardTitle}>Привлекайте капитал через биржу</strong>
                <Columns />
                <span className={css.cardFoot}>
                  Листинг и выпуск ценных бумаг
                  <Arrow />
                </span>
              </Link>
            </div>
          </section>

          {/* 2. Рынок сегодня: график индекса, котировки, аукционы ГЦБ. */}
          <section className={css.section} aria-labelledby="zl-market">
            <header className={css.sectionHead}>
              <h2 id="zl-market" className={css.display}>
                Рынок сегодня
              </h2>
              <Link className={css.headLink} href="/market">
                Итоги торгов
                <Arrow />
              </Link>
            </header>
            <div className={css.marketGrid}>
              <div className={css.chartCard} data-reveal="rise">
                <div className={css.chartHead}>
                  <div>
                    <span>Индекс KSE</span>
                    <b>{num(data.index.value, 2)}</b>
                  </div>
                  <span className={css.change} data-tone={tone(data.index.change)}>
                    {pct(data.index.change)}
                  </span>
                </div>
                {bigChart ? (
                  <svg className={css.bigChart} viewBox="0 0 760 220" preserveAspectRatio="none" aria-hidden="true">
                    <path d={bigChart.area} className={css.bigArea} />
                    <path d={bigChart.line} className={css.bigLine} />
                  </svg>
                ) : null}
                <dl className={css.chartFacts}>
                  <div>
                    <dt>Капитализация</dt>
                    <dd>{num(data.index.capitalization, 1)} млрд сом</dd>
                  </div>
                  <div>
                    <dt>Сделок за сессию</dt>
                    <dd>{num(data.volume.trades)}</dd>
                  </div>
                  <div>
                    <dt>Бумаг в торгах</dt>
                    <dd>{num(data.quotes.total)}</dd>
                  </div>
                </dl>
              </div>

              <div className={css.tableCard} data-reveal="rise">
                <div className={css.tableHead}>
                  <h3>Котировки</h3>
                  <Link href="/market/quotes" className={css.miniLink}>
                    Все <Arrow />
                  </Link>
                </div>
                <table className={css.table}>
                  <thead>
                    <tr>
                      <th>Бумага</th>
                      <th>Цена, сом</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((item) => (
                      <tr key={item.ticker}>
                        <td>
                          <Link href={item.href}>
                            <b>{item.ticker}</b>
                            <span>{item.name}</span>
                          </Link>
                        </td>
                        <td>{num(item.price, 2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {data.auctions.length ? (
              <div className={`${css.tableCard} ${css.auctions}`} data-reveal="rise">
                <div className={css.tableHead}>
                  <h3>Аукционы ГЦБ</h3>
                  <Link href="/gcb" className={css.miniLink}>
                    Календарь <Arrow />
                  </Link>
                </div>
                <table className={`${css.table} ${css.tableWide}`}>
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Выпуск</th>
                      <th>Объём</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.auctions.map((row) => (
                      <tr key={row.date + row.type}>
                        <td>
                          <b>{longDate(row.date)}</b>
                        </td>
                        <td>{row.type}</td>
                        <td>{row.volume || "—"}</td>
                        <td>
                          <span className={css.status}>{row.status || "Запланирован"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>

          {/* 3. Инвесторам — ярко-зелёная секция. */}
          <section className={`${css.band} ${css.bandLime}`} aria-labelledby="zl-investors">
            <div className={css.bandHead} data-reveal="rise">
              <p className={css.kicker}>Инвесторам</p>
              <h2 id="zl-investors" className={css.display}>
                Как начать инвестировать
              </h2>
              <p className={css.bandLead}>
                Фондовая биржа — площадка, где компании и государство размещают ценные бумаги, а инвесторы их покупают и продают.
                Цены складываются из заявок на открытых торгах, а сделки проходят через лицензированных брокеров.
              </p>
            </div>
            <ol className={css.steps} data-stagger="">
              {steps.map((step, i) => (
                <li key={step.title}>
                  <span className={css.stepNum}>{i + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  <SmartLink className={css.stepLink} href={step.href}>
                    Подробнее
                    <Arrow />
                  </SmartLink>
                </li>
              ))}
            </ol>
            <div className={css.investorInfo}>
              <div>
                <h3>Доступные инструменты</h3>
                <ul className={css.chips}>
                  {instruments.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href}>
                        {item.label} <b>{item.count}</b>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Где получить информацию</h3>
                <ul className={css.infoList}>
                  {infoLinks.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href}>
                        {item.label}
                        <Arrow />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 4. Эмитентам — тёмно-зелёная секция. */}
          <section className={`${css.band} ${css.bandForest}`} aria-labelledby="zl-issuers">
            <div className={css.issuerGrid}>
              <div data-reveal="rise">
                <p className={css.kicker}>Эмитентам</p>
                <h2 id="zl-issuers" className={css.display}>
                  Капитал для роста бизнеса
                </h2>
                <p className={css.bandLead}>
                  Выпуск акций или облигаций на бирже открывает компании доступ к средствам инвесторов, повышает доверие и прозрачность.
                </p>
                <div className={css.issuerFigures}>
                  <div>
                    <b>
                      <CountUp value={data.issuers} />
                    </b>
                    <span>эмитентов</span>
                  </div>
                  <div>
                    <b>
                      <CountUp value={data.listed} />
                    </b>
                    <span>в листинге</span>
                  </div>
                  <div>
                    <b>1994</b>
                    <span>год основания</span>
                  </div>
                </div>
                <div className={css.bandActions}>
                  <Link className={css.btnLime} href="/listing">
                    Условия листинга
                  </Link>
                  <Link className={css.btnGhostLight} href="/disclosure">
                    Раскрытие информации
                  </Link>
                </div>
              </div>
              <ul className={css.issuerPoints} data-stagger="">
                {issuerPoints.map((point, i) => (
                  <li key={point.title}>
                    <Link href={point.href}>
                      <span className={css.pointNum}>0{i + 1}</span>
                      <span>
                        <b>{point.title}</b>
                        <small>{point.text}</small>
                      </span>
                      <Arrow />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 5. Услуги — мозаика. */}
          <section className={css.section} aria-labelledby="zl-services">
            <header className={css.sectionHead}>
              <h2 id="zl-services" className={css.display}>
                Услуги биржи
              </h2>
            </header>
            <div className={css.bento} data-stagger="">
              {services.map((item) => (
                <SmartLink className={css.service} href={item.href} key={item.href}>
                  <span className={css.serviceTone} data-tone={item.tone} aria-hidden="true" />
                  <span className={css.serviceIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d={item.icon} />
                    </svg>
                  </span>
                  <b>{item.title}</b>
                  <em>{item.text}</em>
                  <Arrow />
                </SmartLink>
              ))}
            </div>
          </section>

          {/* 6. Новости. */}
          {lead ? (
            <section className={css.section} aria-labelledby="zl-news">
              <header className={css.sectionHead}>
                <h2 id="zl-news" className={css.display}>
                  Новости
                </h2>
                <Link className={css.headLink} href="/news">
                  Все новости
                  <Arrow />
                </Link>
              </header>
              <div className={css.newsBoard}>
                <Link className={css.leadCard} href={`/news/${lead.slug}`} data-reveal="rise">
                  <span className={css.leadArt}>
                    <Image src={photos[0]} alt="" fill sizes="(max-width: 900px) 100vw, 720px" />
                    <em>{lead.tag || "Главное"}</em>
                  </span>
                  <span className={css.leadBody}>
                    <time>{longDate(lead.date)}</time>
                    <h3>{lead.title}</h3>
                    {lead.excerpt ? <p>{lead.excerpt}</p> : null}
                  </span>
                </Link>
                <div className={css.latestList} data-stagger="">
                  {rest.map((item, i) => (
                    <Link href={`/news/${item.slug}`} key={item.slug}>
                      <span className={css.latestThumb}>
                        <Image src={photos[i + 1]} alt="" fill sizes="96px" />
                      </span>
                      <span className={css.latestText}>
                        <time>{longDate(item.date)}</time>
                        <b>{item.title}</b>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </main>

        {/* Подвал: ярко-зелёный баннер с контактами и колонки ссылок. */}
        <footer className={css.footer}>
          <div className={css.footBanner}>
            <div>
              <p className={css.footTitle}>Есть вопрос о рынке ценных бумаг?</p>
              <p>{data.contacts.address}</p>
            </div>
            <div className={css.footContacts}>
              {data.contacts.phones.slice(0, 2).map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                  {phone}
                </a>
              ))}
              {data.contacts.email ? <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a> : null}
            </div>
          </div>
          <div className={css.footCols}>
            <div>
              <h3>Рынок</h3>
              <Link href="/market">Торги</Link>
              <Link href="/market/quotes">Котировки</Link>
              <Link href="/market/index">Индекс KSE</Link>
              <Link href="/gcb">ГЦБ</Link>
            </div>
            <div>
              <h3>Биржа</h3>
              <Link href="/about">О бирже</Link>
              <Link href="/members">Участники торгов</Link>
              <Link href="/news">Новости</Link>
              <Link href="/contacts">Контакты</Link>
            </div>
            <div>
              <h3>Эмитентам</h3>
              <Link href="/listing">Листинг</Link>
              <Link href="/disclosure">Раскрытие информации</Link>
              <Link href="/documents">Правила и документы</Link>
            </div>
            <div>
              <h3>Партнёры</h3>
              {data.partners.slice(0, 4).map((p) => (
                <Link key={p.slug} href={`/about/partners/${p.slug}`}>
                  {p.name}
                </Link>
              ))}
            </div>
          </div>
          <p className={css.legal}>
            {data.contacts.copyright}. {data.contacts.license ? `Лицензия ${data.contacts.license}. ` : ""}Информация на сайте не является
            инвестиционной рекомендацией.
          </p>
        </footer>

        <ConceptSwitch current="zelenyi" />
      </div>
    </ConceptPage>
  );
}
