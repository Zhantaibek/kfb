import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Inter } from "next/font/google";
import { mediaSrc } from "@/lib/cms/media-src";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, nav, num, steps } from "../_shared/data";
import { loadHomeData, type HomeData } from "../_shared/home-data";
import { Icon } from "../_shared/Icon";
import { IndexChart } from "../_shared/IndexChart";
import { SectorPhoto } from "../_shared/SectorPhoto";
import { Tabs } from "../_shared/Tabs";
import { treemap } from "../_shared/treemap";
import { Countdown } from "./Countdown";
import css from "./dashboard.module.css";

/*
 * Концепция 19 — «Дашборд»: главная в жанре торговой панели современных бирж — тёмный интерфейс, тёплый янтарный акцент,
 * сводка рынка сверху, таблица рынков с вкладками, справа — путь новичка и объявления. Свой стиль КФБ: без чужих логотипов,
 * текстов и фирменных элементов. Только реальные данные сайта.
 */
// Inter — вариативный шрифт: без списка весов (с ним Turbopack не собирает production-версию) доступны все начертания.
const font = Inter({ subsets: ["latin", "cyrillic"], variable: "--d-font" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "19 · Дашборд" };

type Row = HomeData["instruments"][number];

const typeLabel: Record<string, string> = { stock: "Акция", bond: "Облигация", gcb: "ГЦБ", metal: "Драгметалл" };

function Change({ value }: { value: number }) {
  const dir = value > 0 ? css.up : value < 0 ? css.down : css.flat;
  return (
    <span className={`${css.change} ${dir}`}>
      <span className={css.srOnly}>{value > 0 ? "рост" : value < 0 ? "снижение" : "без изменений"} </span>
      {value > 0 ? "+" : value < 0 ? "−" : ""}
      {value >= 1000 ? `в ${num(value / 100 + 1)} раз` : `${num(Math.abs(value), 2)}%`}
    </span>
  );
}

function Markets({ rows, live, max }: { rows: Row[]; live: boolean; max: number }) {
  if (!rows.length) return <p className={css.empty}>Сделок по этим инструментам на последней сессии не было</p>;
  return (
    <table className={css.table}>
      <thead>
        <tr>
          <th scope="col">Инструмент</th>
          <th scope="col" className={css.num}>
            Цена, сом
          </th>
          <th scope="col" className={css.num}>
            Изм.
          </th>
          <th scope="col" className={`${css.num} ${css.hideSm}`}>
            {live ? "Объём, тыс. сом" : "Объём"}
          </th>
          <th scope="col" className={css.hideMd}>
            <span className={css.srOnly}>Доля в объёме</span>
          </th>
          <th scope="col">
            <span className={css.srOnly}>Действие</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.ticker}>
            <th scope="row">
              <Link href={row.href} className={css.asset}>
                <span className={css.avatar} data-type={row.type} aria-hidden="true">
                  {row.ticker.slice(0, 2)}
                </span>
                <span>
                  <b>{row.ticker}</b>
                  <small>
                    {row.name} · {typeLabel[row.type] ?? row.type}
                  </small>
                </span>
              </Link>
            </th>
            <td className={css.num}>{num(row.price, 2)}</td>
            <td className={css.num}>
              <Change value={row.change} />
            </td>
            <td className={`${css.num} ${css.hideSm}`}>{num(row.volume, 1)}</td>
            <td className={css.hideMd}>
              <span className={css.meter} aria-hidden="true">
                <i style={{ width: `${Math.max(2, (row.volume / max) * 100)}%` }} />
              </span>
            </td>
            <td className={css.actionCell}>
              <Link href={row.href} className={css.rowAction} aria-label={`${row.ticker}: подробнее`}>
                Подробнее
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function DashboardConcept() {
  const data = await loadHomeData();
  const traded = data.instruments.filter((item) => item.volume > 0);
  const priced = data.instruments.filter((item) => item.price > 0);
  const max = Math.max(1, ...priced.map((item) => item.volume));
  const gainers = data.gainers.filter((item): item is Row => "price" in item);
  const losers = data.losers.filter((item): item is Row => "price" in item);
  const series = data.indexSeries;
  const ticker = priced.slice(0, 12);
  const announcements = [
    ...data.urgent.map((item) => ({ ...item, kind: "Срочно" })),
    ...data.news.map((item) => ({ slug: item.slug, date: item.date, title: item.title, kind: item.tag || "Новости" })),
    ...data.companyNews.map((item) => ({ slug: item.slug, date: item.date, title: item.title, kind: "Эмитенты" })),
  ].slice(0, 7);
  const promo = data.news.find((item) => item.photo);
  const total = traded.reduce((sum, item) => sum + item.volume, 0);
  const sessionLeader = traded[0];
  const weekLeader = data.leaders[0];
  const nextAuction = data.auctions.find((a) => /планир/i.test(a.status)) ?? data.auctions[0];
  // Периоды графика: только те, что короче всего ряда, плюс весь ряд.
  const points = series.map(({ date, value }) => ({ date, value }));
  const periods = [
    { label: "2 недели", size: 10 },
    { label: "Месяц", size: 22 },
  ].filter((p) => p.size < points.length);

  const tabs = [
    { label: "Активные", content: <Markets rows={priced.slice(0, 10)} live={data.live} max={max} /> },
    { label: "Акции", content: <Markets rows={data.quotes.stocks} live={data.live} max={max} /> },
    { label: "Облигации и ГЦБ", content: <Markets rows={data.quotes.bonds} live={data.live} max={max} /> },
    { label: "Драгметаллы", content: <Markets rows={data.quotes.metals} live={data.live} max={max} /> },
    ...(gainers.length ? [{ label: "Растут", content: <Markets rows={gainers} live={data.live} max={max} /> }] : []),
    ...(losers.length ? [{ label: "Падают", content: <Markets rows={losers} live={data.live} max={max} /> }] : []),
  ];

  return (
    <ConceptPage accent="#f2a93b">
      <div className={`${css.page} ${font.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <Link href="/design-concepts/dashboard" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={30} height={28} priority />
            <span>KSE</span>
          </Link>
          <nav className={css.nav} aria-label="Основное меню">
            {nav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <form action="/search" role="search" className={css.search}>
            <Icon name="search" />
            <label htmlFor="d-q" className={css.srOnly}>
              Поиск по сайту
            </label>
            <input id="d-q" name="q" type="search" placeholder="Тикер или эмитент" />
          </form>
          <Link href="/members" className={css.primary}>
            Открыть счёт
          </Link>
          <details className={css.menu}>
            <summary aria-label="Меню">
              <Icon name="menu" />
            </summary>
            <nav aria-label="Меню (мобильное)">
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href="/members">Участники торгов</Link>
              <Link href={EDU_URL} {...linkProps(EDU_URL)}>
                Учебный центр
              </Link>
              <Link href="/contacts">Контакты</Link>
            </nav>
          </details>
        </header>

        {/* Бегущая строка цен под шапкой. */}
        {ticker.length ? (
          <div className={css.ticker} aria-label="Цены последней сессии">
            <div className={css.tickerTrack}>
              {[0, 1].map((copy) => (
                <ul key={copy} aria-hidden={copy === 1 || undefined}>
                  {ticker.map((item) => (
                    <li key={item.ticker}>
                      <Link href={item.href} tabIndex={copy === 1 ? -1 : undefined}>
                        <b>{item.ticker}</b>
                        <span>{num(item.price, 2)}</span>
                        <Change value={item.change} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        ) : null}

        <main id="main" className={css.layout}>
          <div className={css.mainCol}>
            {/* Сводка рынка — как карточка «обзора активов» в торговых приложениях. */}
            <section className={`${css.card} ${css.overview}`} aria-labelledby="d-overview" data-intro="rise">
              <div className={css.overviewHead}>
                <div>
                  <h1 id="d-overview" className={css.overviewTitle}>
                    Индекс KSE
                    <span className={data.session.open ? css.badgeOpen : css.badgeClosed}>{data.session.label}</span>
                  </h1>
                  <p className={css.bigValue}>
                    <span data-count={data.index.value} data-digits="2">
                      {num(data.index.value, 2)}
                    </span>
                    <Change value={data.index.change} />
                  </p>
                  <p className={css.muted}>
                    {data.live ? `Итоги сессии ${longDate(data.session.date)}` : "Демонстрационные значения"} · торги {data.session.hours}
                  </p>
                  <Countdown hours={data.session.hours} className={css.countdown} />
                </div>
                <div className={css.overviewActions}>
                  <Link href="/members" className={css.primary}>
                    Начать инвестировать
                  </Link>
                  <Link href="/market/quotes" className={css.secondary}>
                    Котировки
                  </Link>
                  <Link href="/market/index" className={css.secondary}>
                    История индекса
                  </Link>
                </div>
              </div>
              <dl className={css.stats}>
                <div>
                  <dt>Капитализация</dt>
                  <dd>
                    {num(data.index.capitalization, 1)} <small>млрд сом</small>
                  </dd>
                </div>
                <div>
                  <dt>Объём сессии</dt>
                  <dd>
                    {num(data.volume.volumeMln, 2)} <small>млн сом</small>
                  </dd>
                  <Change value={data.volume.volumeChange} />
                </div>
                <div>
                  <dt>Сделок</dt>
                  <dd>{num(data.volume.trades)}</dd>
                </div>
                <div>
                  <dt>Бумаг со сделками</dt>
                  <dd>
                    {num(traded.length)} <small>из {num(data.quotes.total)}</small>
                  </dd>
                </div>
              </dl>
              {points.length > 1 ? (
                <div className={css.chart}>
                  <Tabs
                    css={{ ...css, tabList: `${css.tabList} ${css.periodList}` }}
                    label="Период графика"
                    tabs={[
                      ...periods.map((p) => ({ label: p.label, content: <IndexChart css={css} points={points.slice(-p.size)} /> })),
                      { label: `Всё · ${points.length} сессий`, content: <IndexChart css={css} points={points} /> },
                    ]}
                  />
                </div>
              ) : null}
            </section>

            {/* Хайлайты — три быстрых факта, как карточки «в тренде» в торговых приложениях. */}
            <div className={css.highlights} data-stagger>
              {sessionLeader ? (
                <Link href={sessionLeader.href} className={css.highlight}>
                  <small>Лидер сессии по объёму</small>
                  <b>{sessionLeader.ticker}</b>
                  <span className={css.muted}>{sessionLeader.name}</span>
                  <span className={css.hlValue}>
                    {num(sessionLeader.price, 2)} сом <em>{num((sessionLeader.volume / (total || 1)) * 100, 1)}% оборота</em>
                  </span>
                </Link>
              ) : null}
              {weekLeader ? (
                <Link href={traded.find((t) => t.ticker === weekLeader.ticker)?.href ?? "/market/quotes"} className={css.highlight}>
                  <small>Лидер недели</small>
                  <b>{weekLeader.ticker}</b>
                  <span className={css.muted}>{weekLeader.name}</span>
                  <span className={css.hlValue}>
                    {num(weekLeader.volume, 1)}
                    {data.live ? " тыс. сом" : ""} <em>{num(weekLeader.deals)} сделок</em>
                  </span>
                </Link>
              ) : null}
              {nextAuction ? (
                <Link href="/gcb" className={css.highlight}>
                  <small>Ближайший аукцион ГЦБ</small>
                  <b>{nextAuction.date}</b>
                  <span className={css.muted}>{nextAuction.type}</span>
                  <span className={css.hlValue}>
                    {nextAuction.volume} <em>{nextAuction.status}</em>
                  </span>
                </Link>
              ) : null}
            </div>

            {/* Рынки. */}
            <section className={css.card} aria-labelledby="d-markets" data-reveal>
              <header className={css.cardHead}>
                <h2 id="d-markets">Рынки</h2>
                <Link href="/market/quotes" className={css.more}>
                  Все инструменты <Icon name="arrowRight" />
                </Link>
              </header>
              <Tabs css={css} label="Рынки" tabs={tabs} />
            </section>

            {/* Карта оборота: площадь плитки — доля в обороте сессии, фон — фото отрасли эмитента. */}
            {traded.length ? (
              <section className={css.card} aria-labelledby="d-map" data-reveal>
                <header className={css.cardHead}>
                  <h2 id="d-map">Карта оборота</h2>
                  <span className={css.muted}>
                    {num(traded.length)} бумаг · {num(data.volume.volumeMln, 2)} млн сом
                  </span>
                </header>
                {[
                  { className: css.mapWide, w: 1000, h: 300 },
                  { className: css.mapTall, w: 360, h: 420 },
                ].map((layout) => (
                  <ul key={layout.className} className={`${css.map} ${layout.className}`}>
                    {treemap(traded, (item) => item.volume, layout.w, layout.h).map(({ item, left, top, width, height }) => (
                      <li key={item.ticker} style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` } as CSSProperties}>
                        <Link href={item.href} title={`${item.ticker} — ${item.name}`}>
                          <SectorPhoto name={item.name} type={item.type} ticker={item.ticker} tint="#15181e" />
                          <b>{item.ticker}</b>
                          <span>{num((item.volume / (total || 1)) * 100, 1)}%</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ))}
              </section>
            ) : null}

            <div className={css.pair}>
              {/* Сегменты. */}
              <section className={css.card} aria-labelledby="d-segments" data-reveal>
                <header className={css.cardHead}>
                  <h2 id="d-segments">Сегменты</h2>
                  <span className={css.muted}>млн сом</span>
                </header>
                {data.tradingRows.length ? (
                  <ul className={css.segments}>
                    {data.tradingRows.map((row) => (
                      <li key={row.label}>
                        <span>{row.label}</span>
                        <b>{num(row.value, 2)}</b>
                        <Change value={row.change} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={css.empty}>Сегменты появятся после сессии</p>
                )}
              </section>

              {/* Аукционы ГЦБ. */}
              <section className={css.card} aria-labelledby="d-gcb" data-reveal>
                <header className={css.cardHead}>
                  <h2 id="d-gcb">Аукционы ГЦБ</h2>
                  <Link href="/gcb" className={css.more}>
                    Календарь <Icon name="arrowRight" />
                  </Link>
                </header>
                {data.auctions.length ? (
                  <ul className={css.auctions}>
                    {data.auctions.map((a) => (
                      <li key={`${a.date}-${a.type}`}>
                        <span className={css.dateBox}>
                          <Icon name="clock" />
                          {a.date}
                        </span>
                        <span>
                          <b>{a.type}</b>
                          <small>{a.volume}</small>
                        </span>
                        <span className={css.status}>{a.status}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={css.empty}>Ближайших аукционов нет</p>
                )}
              </section>
            </div>

            {data.leaders.length ? (
              <section className={css.card} aria-labelledby="d-leaders" data-reveal>
                <header className={css.cardHead}>
                  <h2 id="d-leaders">Лидеры недели</h2>
                  <span className={css.muted}>по объёму сделок</span>
                </header>
                <ol className={css.leaders}>
                  {data.leaders.map((row, i) => (
                    <li key={row.ticker}>
                      <span className={css.rank}>{i + 1}</span>
                      <b>{row.ticker}</b>
                      <span className={css.muted}>{row.name}</span>
                      <span className={css.num}>
                        {num(row.volume, 1)}
                        {data.live ? " тыс." : ""}
                      </span>
                      <span className={`${css.num} ${css.muted}`}>{num(row.deals)} сд.</span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </div>

          {/* Правая колонка: путь новичка, объявления, учебный центр. */}
          <aside className={css.side} aria-label="Новичкам и объявления">
            <section className={`${css.card} ${css.onboarding}`} aria-labelledby="d-start" id="start" data-intro="rise" style={{ "--kc-d": "120ms" } as CSSProperties}>
              <h2 id="d-start">Первые шаги инвестора</h2>
              <p className={css.muted}>Четыре шага до первой сделки на бирже</p>
              <ol>
                {steps.map((step, i) => (
                  <li key={step.title}>
                    <Link href={step.href} {...linkProps(step.href)}>
                      <span className={css.stepNo}>{i + 1}</span>
                      <span>
                        <b>{step.title}</b>
                        <small>{step.text}</small>
                      </span>
                      <Icon name="arrowRight" />
                    </Link>
                  </li>
                ))}
              </ol>
            </section>

            <section className={css.card} aria-labelledby="d-news" data-reveal>
              <header className={css.cardHead}>
                <h2 id="d-news">Объявления</h2>
                <Link href="/news" className={css.more}>
                  Все <Icon name="arrowRight" />
                </Link>
              </header>
              {announcements.length ? (
                <ul className={css.announcements}>
                  {announcements.map((item) => (
                    <li key={item.slug}>
                      <Link href={`/news/${item.slug}`}>
                        <span className={css.annMeta}>
                          <span className={item.kind === "Срочно" ? css.tagHot : css.tag}>{item.kind}</span>
                          <time>{item.date}</time>
                        </span>
                        <b>{item.title}</b>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={css.empty}>Объявлений пока нет</p>
              )}
            </section>

            {promo ? (
              <Link href={`/news/${promo.slug}`} className={`${css.card} ${css.promo}`} data-reveal>
                <span className={css.promoPhoto}>
                  <Image src={mediaSrc(promo.photo)} alt="" fill sizes="360px" unoptimized />
                </span>
                <span className={css.promoText}>
                  <small>{promo.tag}</small>
                  <b>{promo.title}</b>
                </span>
              </Link>
            ) : null}

            <Link href={EDU_URL} className={`${css.card} ${css.edu}`} {...linkProps(EDU_URL)} data-reveal>
              <Icon name="book" />
              <span>
                <b>Учебный центр</b>
                <small>Курсы и семинары по рынку ценных бумаг</small>
              </span>
              <Icon name="arrowUpRight" />
            </Link>
          </aside>
        </main>

        <footer className={css.footer}>
          <div className={css.footGrid}>
            <div>
              <b className={css.footBrand}>Кыргызская фондовая биржа</b>
              {data.contacts.address ? <p>{data.contacts.address}</p> : null}
              {data.contacts.phones.map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                  {phone}
                </a>
              ))}
              {data.contacts.email ? <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a> : null}
            </div>
            <nav aria-label="Рынок">
              <b>Рынок</b>
              <Link href="/market">Итоги торгов</Link>
              <Link href="/market/quotes">Котировки</Link>
              <Link href="/market/index">Индекс KSE</Link>
              <Link href="/gcb">ГЦБ</Link>
            </nav>
            <nav aria-label="Эмитентам и инвесторам">
              <b>Эмитентам и инвесторам</b>
              <Link href="/listing">Листинг</Link>
              <Link href="/disclosure">Раскрытие информации</Link>
              <Link href="/members">Участники торгов</Link>
              <Link href={EDU_URL} {...linkProps(EDU_URL)}>
                Учебный центр
              </Link>
            </nav>
            <nav aria-label="О бирже">
              <b>О бирже</b>
              <Link href="/about">О бирже</Link>
              <Link href="/documents">Документы</Link>
              <Link href="/news">Новости</Link>
              <Link href="/contacts">Контакты</Link>
            </nav>
          </div>
          <p className={css.footBottom}>
            {data.contacts.copyright}
            {data.contacts.license ? ` · ${data.contacts.license}` : ""}
          </p>
        </footer>
        <ConceptSwitch current="dashboard" />
      </div>
    </ConceptPage>
  );
}
