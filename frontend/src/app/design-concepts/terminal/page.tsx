import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { loadSnapshot, type Members } from "@/lib/kse-live";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linePath, longDate, nav, num, pct } from "../_shared/data";
import { loadHomeData, type HomeData } from "../_shared/home-data";
import { Icon } from "../_shared/Icon";
import { pickNewsPhotos } from "../_shared/news-photos";
import { Tabs } from "../_shared/Tabs";
import { TerminalHeader } from "./TerminalHeader";
import css from "./terminal.module.css";

/*
 * Концепция 50 — «Терминал»: по мотивам главной TradingView. Чёрный первый экран с фото и одной кнопкой; тёмный блок
 * с «окном терминала» из четырёх графиков; дальше светлая часть: обзор рынка (большой график + список бумаг справа,
 * ряд карточек), лидеры недели карточками, события с вкладками, разделы рынка с плавающей панелью-переключателем,
 * брокеры, главные новости и светлый подвал с огромной надписью. Цвета и шрифты основного сайта.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "50 · Терминал" };

type Row = HomeData["instruments"][number];

const tones = ["#2c7e87", "#1d4f55", "#57b6c0", "#3d6b84", "#0b2a2e", "#6f8f3a", "#a4683a", "#5a5f9a"];

/** Ломаная без сглаживания (сглаженная кривая на резких скачках выходит за рамку графика) и залитая область под ней. */
function lineChart(values: number[], width: number, height: number, pad: number) {
  const line = linePath(values, width, height, pad);
  if (!line) return null;
  return { line, area: `${line} L${width} ${height} L0 ${height} Z`, min: Math.min(...values), max: Math.max(...values) };
}

/** Сумма в млн сом: меньше миллиона — в тысячах. */
function mln(value: number) {
  return value > 0 && value < 1 ? `${num(value * 1000, 1)} тыс.` : `${num(value, 2)} млн`;
}

/**
 * Свечной график по ряду закрытий: открытие — предыдущее закрытие, тени чуть шире тела.
 * Справа — шкала цен, как в торговом терминале.
 */
function Candles({ values, width = 600, height = 220 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 3) return null;
  const rows = values.slice(1).map((close, i) => {
    const open = values[i];
    const wick = Math.abs(close - open) * 0.35 + (Math.max(...values) - Math.min(...values)) * 0.012;
    return { open, close, high: Math.max(open, close) + wick, low: Math.min(open, close) - wick };
  });
  const min = Math.min(...rows.map((r) => r.low));
  const max = Math.max(...rows.map((r) => r.high));
  const span = max - min || 1;
  const plot = width - 54;
  const y = (v: number) => 8 + (1 - (v - min) / span) * (height - 16);
  const step = plot / rows.length;
  const body = Math.max(2, step * 0.62);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => max - f * span);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      {ticks.map((t) => (
        <g key={t}>
          <line x1="0" x2={plot} y1={y(t)} y2={y(t)} className={css.gridLine} />
          <text x={width - 4} y={y(t) + 3} className={css.scale}>
            {num(t, 0)}
          </text>
        </g>
      ))}
      {rows.map((r, i) => {
        const x = i * step + step / 2;
        const up = r.close >= r.open;
        const top = y(Math.max(r.open, r.close));
        const h = Math.max(1.2, Math.abs(y(r.open) - y(r.close)));
        return (
          <g key={i} className={up ? css.candleUp : css.candleDown}>
            <line x1={x} x2={x} y1={y(r.high)} y2={y(r.low)} />
            <rect x={x - body / 2} y={top} width={body} height={h} />
          </g>
        );
      })}
      <line x1="0" x2={plot} y1={y(values[values.length - 1])} y2={y(values[values.length - 1])} className={css.lastLine} />
    </svg>
  );
}

function tone(change: number) {
  return change > 0 ? "up" : change < 0 ? "down" : "flat";
}

/** Круглый «логотип» бумаги: две буквы на цвете, стабильном для тикера. */
function Logo({ text, size }: { text: string; size?: "sm" | "lg" }) {
  const clean = text.replace(/^(ОсОО|ЗАО|ОАО|АО|ООО)\s*/i, "").replace(/[«»"'„“]/g, "").trim();
  const sum = [...clean].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return (
    <span className={css.logo} data-size={size} style={{ background: tones[sum % tones.length] }} aria-hidden="true">
      {clean.slice(0, 2).toUpperCase() || "КФ"}
    </span>
  );
}

function Title({ id, href, children }: { id: string; href: string; children: ReactNode }) {
  return (
    <h2 id={id} className={css.title}>
      <Link href={href}>
        {children}
        <span aria-hidden="true">›</span>
      </Link>
    </h2>
  );
}

function SymbolRow({ row }: { row: Pick<Row, "ticker" | "name" | "href" | "change"> & { price?: number } }) {
  return (
    <li>
      <Link href={row.href} className={css.symbol}>
        <Logo text={row.ticker} />
        <span className={css.symbolName}>
          <b>{row.name}</b>
          <em>{row.ticker}</em>
        </span>
        <span className={css.symbolNums}>
          {row.price !== undefined ? (
            <b>
              {row.price > 0 ? num(row.price, 2) : "—"} <small>KGS</small>
            </b>
          ) : null}
          <span data-tone={tone(row.change)}>{pct(row.change)}</span>
        </span>
      </Link>
    </li>
  );
}

function Pane({ title, value, children }: { title: string; value: string; children: ReactNode }) {
  return (
    <div className={css.pane}>
      <span className={css.paneHead}>
        <i /> {title} <b>{value}</b>
      </span>
      {children}
    </div>
  );
}

export default async function TerminalConcept() {
  const [data, members] = await Promise.all([loadHomeData(), loadSnapshot<Members>("members")]);
  const big = lineChart(data.history, 900, 400, 16);
  const capValues = data.indexSeries.map((row) => row.cap).filter((v): v is number => typeof v === "number" && v > 0);
  const paneCap = lineChart(capValues.length > 1 ? capValues : data.history, 600, 220, 12);
  const dates = data.indexSeries.length ? [0, 0.25, 0.5, 0.75, 1].map((f) => data.indexSeries[Math.round(f * (data.indexSeries.length - 1))].date.slice(0, 5)) : [];
  const leaders = data.leaders.slice(0, 4);
  const topLeader = Math.max(1, ...data.leaders.map((row) => row.volume));
  const volumeK = data.volume.volumeMln < 1;
  const brokers = (members?.data.rows ?? []).filter((row) => !row.suspended.trim()).slice(0, 6);
  const ideas = data.news.slice(0, 3);
  const ideaPhotos = pickNewsPhotos(ideas);
  const companyIdeas = data.companyNews.slice(0, 3);
  const companyPhotos = pickNewsPhotos(companyIdeas);
  const stories = [
    ...data.news.map((item) => ({ slug: item.slug, date: item.date, title: item.title, by: "КФБ" })),
    ...data.companyNews.map((item) => ({ slug: item.slug, date: item.date, title: item.title, by: String(item.company || "Эмитент") })),
  ].slice(0, 9);
  const mainList = data.instruments.slice(0, 6);
  const sections = [
    { id: "tm-stocks", label: "Акции" },
    { id: "tm-bonds", label: "Облигации и ГЦБ" },
    { id: "tm-metals", label: "Металлы" },
    { id: "tm-brokers", label: "Брокеры" },
  ];

  const ideaCards = (items: typeof ideas, photos: string[], by: (i: number) => string) => (
    <div className={css.ideas}>
      {items.map((item, i) => (
        <Link key={item.slug} href={`/news/${item.slug}`} className={css.idea}>
          <span className={css.ideaPhoto}>
            <Image src={photos[i]} alt="" fill sizes="(max-width: 900px) 100vw, 440px" />
          </span>
          <b>{item.title}</b>
          <span className={css.ideaText}>{item.excerpt}</span>
          <span className={css.ideaMeta}>
            <span>
              {by(i)}
              <time>{longDate(item.date)}</time>
            </span>
            <span className={css.ideaBtn}>
              Читать <Icon name="arrowUpRight" />
            </span>
          </span>
        </Link>
      ))}
    </div>
  );

  return (
    <ConceptPage accent="#57b6c0">
      <div className={css.page}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        {/* Шапка: на чёрном фоне первого экрана. */}
        <TerminalHeader className={css.header}>
          <Link href="/design-concepts/terminal" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={32} height={30} priority />
            <span>Фондовая биржа</span>
          </Link>
          <form action="/search" className={css.search} role="search">
            <Icon name="search" />
            <input type="search" name="q" placeholder="Поиск (Ctrl+K)" aria-label="Поиск по сайту" />
          </form>
          <nav className={css.nav} aria-label="Основное меню">
            {nav.slice(0, 5).map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <span className={css.headTools}>
            <span className={css.lang}>RU</span>
            <Link href="/market" className={css.headBtn}>
              Рынок сегодня
            </Link>
          </span>
        </TerminalHeader>

        <main id="main">
          {/* Первый экран: чёрный фон, заголовок по центру, фото города со свечением снизу. */}
          <section className={css.hero} aria-labelledby="tm-hero">
            {/* Рисованная сцена: звёзды, дуга планеты с ночными огнями и рассвет над горизонтом. */}
            <div className={css.space} aria-hidden="true">
              <span className={css.stars} />
              <span className={css.planet}>
                <span className={css.lights} />
              </span>
              <span className={css.flare} />
            </div>
            <div className={css.heroText}>
              <h1 id="tm-hero" data-intro="rise">
                Здесь Кыргызстан торгует ценными бумагами
              </h1>
              <p data-intro="fade" style={{ "--kc-d": "140ms" } as CSSProperties}>
                Котировки, итоги торгов и отчёты эмитентов — открыто для каждого инвестора.
              </p>
              <div data-intro="fade" style={{ "--kc-d": "240ms" } as CSSProperties}>
                <Link href="/investors" className={css.heroBtn}>
                  Начать инвестировать
                </Link>
                <small>Бесплатно, без регистрации на сайте</small>
              </div>
            </div>
            <a href="#tm-supercharts" className={css.down} aria-label="Дальше">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 9 7 7 7-7" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </a>
          </section>

          {/* Окно терминала: четыре графика на тёмном фоне. */}
          <section className={css.charts} aria-labelledby="tm-supercharts">
            <h2 id="tm-supercharts" data-reveal="rise">
              Весь рынок
              <br />
              на одном экране
            </h2>
            <div className={css.window} data-reveal="rise">
              <div className={css.toolbar} aria-hidden="true">
                <span className={css.tbBrand}>
                  <Image src="/brand/kse-mark.png" alt="" width={18} height={17} />
                </span>
                <span className={css.tbPill}>KSE</span>
                <span>1Д</span>
                <span>Индикаторы</span>
                <span>Сравнить</span>
                <span className={css.tbRight}>{data.session.date || data.session.clock}</span>
                <span className={css.tbLight}>Итоги</span>
              </div>
              <div className={css.workspace}>
              <span className={css.tools} aria-hidden="true">
                {["chart", "search", "file", "clock", "pin", "building"].map((name) => (
                  <Icon key={name} name={name as "chart"} />
                ))}
              </span>
              <div className={css.panes}>
                <Pane title="Индекс KSE · 1Д · KSE" value={num(data.index.value, 2)}>
                  <Candles values={data.history.slice(-40)} />
                </Pane>
                <Pane title="Капитализация · млрд сом" value={num(data.index.capitalization, 1)}>
                  {paneCap ? (
                    <svg viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true">
                      <path d={paneCap.area} className={css.areaTeal} />
                      <path d={paneCap.line} className={css.lineTeal} />
                    </svg>
                  ) : null}
                </Pane>
                <Pane title="Лидеры недели · объём, сом" value={leaders[0]?.ticker ?? "—"}>
                  <div className={css.bars} aria-hidden="true">
                    {data.leaders.map((row) => (
                      <span key={row.ticker} style={{ "--h": `${Math.max(6, (row.volume / topLeader) * 100)}%` } as CSSProperties}>
                        <i>{row.ticker}</i>
                      </span>
                    ))}
                  </div>
                </Pane>
                <Pane title="Итоги сессии" value={data.session.label}>
                  <dl className={css.paneStats}>
                    {data.tradingRows.slice(0, 5).map((row) => (
                      <div key={row.label}>
                        <dt>{row.label}</dt>
                        <dd>{mln(row.value)} сом</dd>
                      </div>
                    ))}
                  </dl>
                </Pane>
              </div>
              <span className={css.tools} aria-hidden="true">
                {["book", "megaphone", "users", "wallet", "bank"].map((name) => (
                  <Icon key={name} name={name as "chart"} />
                ))}
              </span>
              </div>
              <Link href="/market" className={css.explore}>
                <span className={css.exploreIcon}>
                  <Icon name="chart" />
                </span>
                <span>
                  <b>Все итоги торгов ›</b>
                  <small>Для любого уровня анализа</small>
                </span>
              </Link>
            </div>
          </section>

          <div className={css.light} id="tm-light">
            {/* Обзор рынка: большой график индекса и список бумаг справа. */}
            <section className={css.wrap} aria-labelledby="tm-summary">
              <Title id="tm-summary" href="/market">
                Обзор рынка
              </Title>
              <div className={css.summary}>
                <article className={css.card}>
                  <div className={css.bigHead}>
                    <Logo text="KSE" size="lg" />
                    <div>
                      <span className={css.bigName}>
                        Индекс KSE <em>KSE</em>
                      </span>
                      <span className={css.bigValue}>
                        {num(data.index.value, 2)} <small>ПУНКТ</small>
                        <span data-tone={tone(data.index.change)}>{pct(data.index.change)}</span>
                      </span>
                    </div>
                  </div>
                  {big ? (
                    <div className={css.bigChart}>
                      <svg viewBox="0 0 900 400" preserveAspectRatio="none" aria-hidden="true">
                        <defs>
                          <linearGradient id="tm-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="#57b6c0" stopOpacity="0.35" />
                            <stop offset="1" stopColor="#57b6c0" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>
                        <path d={big.area} fill="url(#tm-fill)" />
                        <path d={big.line} className={css.bigLine} />
                      </svg>
                      <span className={css.yAxis} aria-hidden="true">
                        <span>{num(big.max, 2)}</span>
                        <span>{num((big.max + big.min) / 2, 2)}</span>
                        <span>{num(big.min, 2)}</span>
                      </span>
                      <span className={css.xAxis} aria-hidden="true">
                        {dates.map((d, i) => (
                          <span key={i}>{d}</span>
                        ))}
                      </span>
                    </div>
                  ) : (
                    <p className={css.empty}>История индекса пока недоступна.</p>
                  )}
                </article>
                <article className={css.card}>
                  <h3 className={css.cardTitle}>Самые активные бумаги</h3>
                  <ul className={css.symbols}>
                    {mainList.map((row) => (
                      <SymbolRow key={row.ticker} row={row} />
                    ))}
                  </ul>
                  <Link href="/market/quotes" className={css.seeAll}>
                    Все котировки ›
                  </Link>
                </article>
              </div>

              <div className={css.trio}>
                <article className={css.card}>
                  <h3 className={css.cardTitle}>
                    Объём торгов <em>KGS</em>
                  </h3>
                  <p className={css.cardValue}>
                    {volumeK ? num(data.volume.volumeMln * 1000) : num(data.volume.volumeMln, 1)} <small>{volumeK ? "тыс. сом" : "млн сом"}</small>
                  </p>
                  <p className={css.cardSub}>
                    Сделок: {num(data.volume.trades)} · {data.session.date || data.session.clock}
                  </p>
                  <div className={css.split} aria-hidden="true">
                    <span style={{ flex: Math.max(1, data.quotes.stocks.length) }} />
                    <span style={{ flex: Math.max(1, data.quotes.bonds.length) }} />
                    <span style={{ flex: Math.max(1, data.quotes.metals.length) }} />
                  </div>
                  <ul className={css.legend}>
                    <li>
                      <i data-c="1" /> Акции <b>{data.quotes.stocks.length}</b>
                    </li>
                    <li>
                      <i data-c="2" /> Облигации <b>{data.quotes.bonds.length}</b>
                    </li>
                    <li>
                      <i data-c="3" /> Металлы <b>{data.quotes.metals.length}</b>
                    </li>
                  </ul>
                  <Link href="/market" className={css.seeAll}>
                    Все итоги торгов ›
                  </Link>
                </article>
                <article className={css.card}>
                  <h3 className={css.cardTitle}>Облигации и ГЦБ</h3>
                  {data.quotes.bonds.length ? (
                    <ul className={css.symbols}>
                      {data.quotes.bonds.slice(0, 4).map((row) => (
                        <SymbolRow key={row.ticker} row={row} />
                      ))}
                    </ul>
                  ) : (
                    <p className={css.empty}>Сделок с облигациями пока нет.</p>
                  )}
                  <Link href="/gcb" className={css.seeAll}>
                    Все облигации ›
                  </Link>
                </article>
                <article className={css.card}>
                  <h3 className={css.cardTitle}>Аукционы ГЦБ</h3>
                  {data.auctions.length ? (
                    <ul className={css.auctions}>
                      {data.auctions.map((row, i) => (
                        <li key={`${row.date}-${i}`}>
                          <span>
                            <b>{row.type}</b>
                            <small>{row.date}</small>
                          </span>
                          <span>
                            <b>{row.volume}</b>
                            <small>{row.status}</small>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={css.empty}>Ближайших аукционов нет.</p>
                  )}
                  <Link href="/gcb" className={css.seeAll}>
                    Календарь аукционов ›
                  </Link>
                </article>
              </div>
            </section>

            {/* Лидеры недели карточками. */}
            {leaders.length ? (
              <section className={css.wrap} aria-labelledby="tm-leaders">
                <Title id="tm-leaders" href="/market">
                  Лидеры недели
                </Title>
                <div className={css.leaders}>
                  {leaders.map((row) => (
                    <Link key={row.ticker} href="/market" className={css.leader}>
                      <span className={css.leaderHead}>
                        <Logo text={row.ticker} />
                        <span>
                          <b>{row.ticker}</b>
                          <small>{row.name}</small>
                        </span>
                      </span>
                      <span className={css.leaderNums}>
                        <span>
                          <small>Цена</small>
                          {row.price > 0 ? num(row.price, 2) : "—"} <em>KGS</em>
                        </span>
                        <span>
                          <small>Объём за неделю</small>
                          {num(row.volume)} <em>KGS</em>
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {/* События: карточки с фото и вкладками. */}
            {ideas.length ? (
              <section className={css.wrap} aria-labelledby="tm-ideas">
                <Title id="tm-ideas" href="/news">
                  События рынка
                </Title>
                <Tabs
                  label="Источник событий"
                  css={css}
                  tabs={[
                    { label: "Новости биржи", content: ideaCards(ideas, ideaPhotos, (i) => `КФБ · ${ideas[i]?.tag || "Новости"}`) },
                    ...(companyIdeas.length
                      ? [{ label: "Эмитенты", content: ideaCards(companyIdeas, companyPhotos, (i) => companyIdeas[i]?.company || "Эмитент") }]
                      : []),
                  ]}
                />
              </section>
            ) : null}

            {/* Разделы рынка с плавающей панелью. */}
            <nav className={css.sectionNav} aria-label="Разделы рынка">
              {sections.map((item) => (
                <a key={item.id} href={`#${item.id}`}>
                  {item.label}
                </a>
              ))}
            </nav>

            <section className={css.wrap} aria-labelledby="tm-stocks">
              <h2 id="tm-stocks" className={css.bigSection}>
                <Logo text="Акции" size="lg" />
                <Link href="/market/quotes">
                  Акции <span aria-hidden="true">›</span>
                </Link>
              </h2>
              <div className={css.twoCols}>
                <div>
                  <Title id="tm-active" href="/market/quotes">
                    Самые активные
                  </Title>
                  {data.quotes.stocks.length ? (
                    <ul className={css.symbols}>
                      {data.quotes.stocks.slice(0, 5).map((row) => (
                        <SymbolRow key={row.ticker} row={row} />
                      ))}
                    </ul>
                  ) : (
                    <p className={css.empty}>Сделок с акциями пока нет.</p>
                  )}
                  <Link href="/market/quotes" className={css.seeAll}>
                    Все акции ›
                  </Link>
                </div>
                <div>
                  <Title id="tm-movers" href="/market">
                    Изменение цен
                  </Title>
                  {data.gainers.length || data.losers.length ? (
                    <ul className={css.symbols}>
                      {[...data.gainers.slice(0, 3), ...data.losers.slice(0, 2)].map((row) => (
                        <SymbolRow key={row.ticker} row={row} />
                      ))}
                    </ul>
                  ) : (
                    <p className={css.empty}>Сегодня цены бумаг не менялись.</p>
                  )}
                  <Link href="/market" className={css.seeAll}>
                    Все итоги торгов ›
                  </Link>
                </div>
              </div>
            </section>

            <section className={css.wrap} aria-labelledby="tm-bonds">
              <h2 id="tm-bonds" className={css.bigSection}>
                <Logo text="ГЦБ" size="lg" />
                <Link href="/gcb">
                  Облигации и ГЦБ <span aria-hidden="true">›</span>
                </Link>
              </h2>
              <div className={css.twoCols}>
                <div>
                  <Title id="tm-bondlist" href="/market/quotes">
                    Облигации в торгах
                  </Title>
                  {data.quotes.bonds.length ? (
                    <ul className={css.symbols}>
                      {data.quotes.bonds.slice(0, 5).map((row) => (
                        <SymbolRow key={row.ticker} row={row} />
                      ))}
                    </ul>
                  ) : (
                    <p className={css.empty}>Сделок с облигациями пока нет.</p>
                  )}
                </div>
                <div id="tm-metals">
                  <Title id="tm-metal" href="/commodity">
                    Драгоценные металлы
                  </Title>
                  {data.quotes.metals.length ? (
                    <ul className={css.symbols}>
                      {data.quotes.metals.slice(0, 5).map((row) => (
                        <SymbolRow key={row.ticker} row={row} />
                      ))}
                    </ul>
                  ) : (
                    <p className={css.empty}>Сделок с металлами пока нет.</p>
                  )}
                </div>
              </div>
            </section>

            {/* Брокеры. */}
            <section className={css.wrap} aria-labelledby="tm-brokers">
              <div className={css.brokerHead}>
                <Title id="tm-brokers" href="/members">
                  Торги и брокеры
                </Title>
                <p>Покупать и продавать бумаги на бирже можно через лицензированных брокеров — участников торгов КФБ.</p>
              </div>
              {brokers.length ? (
                <ul className={css.brokers}>
                  {brokers.map((row) => (
                    <li key={row.name} className={css.broker}>
                      <span className={css.brokerTop}>
                        <span className={css.stack} aria-hidden="true">
                          <Logo text={row.name} size="lg" />
                        </span>
                        <span>
                          <b>{row.name}</b>
                          <small>Брокер, дилер</small>
                        </span>
                      </span>
                      <span className={css.brokerBottom}>
                        <span className={css.verified}>
                          <Icon name="building" /> Участник торгов
                        </span>
                        <Link href="/members" className={css.brokerBtn}>
                          Контакты <Icon name="arrowUpRight" />
                        </Link>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Link href="/members" className={css.seeAll}>
                  Список участников торгов ›
                </Link>
              )}
            </section>

            {/* Главные новости: текстовая сетка. */}
            {stories.length ? (
              <section className={css.wrap} aria-labelledby="tm-stories">
                <Title id="tm-stories" href="/news">
                  Главные новости
                </Title>
                <ul className={css.stories}>
                  {stories.map((item) => (
                    <li key={item.slug}>
                      <Link href={`/news/${item.slug}`}>
                        <span className={css.storyMeta}>
                          <Logo text={item.by} size="sm" />
                          {longDate(item.date)} · {item.by}
                        </span>
                        <b>{item.title}</b>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/news" className={css.seeAll}>
                  Читать дальше ›
                </Link>
              </section>
            ) : null}
          </div>
        </main>

        {/* Светлый подвал с огромной надписью. */}
        <footer className={css.footer}>
          <div className={css.footInner}>
            <div className={css.footBrand}>
              <span className={css.footLogo}>
                <Image src="/brand/kse-mark.png" alt="" width={32} height={30} />
                Фондовая биржа
                <em>С 1994 ГОДА</em>
              </span>
              <p>{data.contacts.address}</p>
              <p>{data.contacts.phones.join(" · ")}</p>
              {data.contacts.email ? <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a> : null}
              <p className={css.legal}>
                {data.contacts.copyright}. {data.contacts.license ? `Лицензия ${data.contacts.license}.` : ""}
              </p>
            </div>
            <div>
              <h3>Рынок</h3>
              <Link href="/market">Итоги торгов</Link>
              <Link href="/market/quotes">Котировки</Link>
              <Link href="/market/index">Индекс KSE</Link>
              <Link href="/market/archive">Архив торгов</Link>
              <h3>ГЦБ</h3>
              <Link href="/gcb">Аукционы</Link>
              <Link href="/commodity">Драгоценные металлы</Link>
            </div>
            <div>
              <h3>Компаниям</h3>
              <Link href="/listing">Листинг</Link>
              <Link href="/disclosure">Раскрытие информации</Link>
              <Link href="/documents">Документы</Link>
              <h3>Инвесторам</h3>
              <Link href="/investors">Как начать</Link>
              <Link href="/members">Участники торгов</Link>
            </div>
            <div>
              <h3>О бирже</h3>
              <Link href="/about">Кто мы</Link>
              <Link href="/news">Новости</Link>
              <Link href="/contacts">Контакты</Link>
            </div>
          </div>
          <p className={css.giant} aria-hidden="true">
            ОТКРЫТЫЙ / РЫНОК
          </p>
        </footer>

        <ConceptSwitch current="terminal" />
      </div>
    </ConceptPage>
  );
}
