import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import css from "./yantar.module.css";

/*
 * Концепция 57 — «Янтарь». Тёмный графит и тёплый янтарь, фото в тёплом тоне.
 * Плотные панели: поиск бумаги, индекс с осью, лидеры роста и снижения, объём по бумагам полосами,
 * лента аукционов, новости. Шрифты сайта, данные — loadHomeData().
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "57 · Янтарь" };

const nav = [
  { label: "Рынок", href: "/market" },
  { label: "Котировки", href: "/market/quotes" },
  { label: "ГЦБ", href: "/gcb" },
  { label: "Листинг", href: "/listing" },
  { label: "Раскрытие", href: "/disclosure" },
  { label: "Новости", href: "/news" },
];

function Delta({ value }: { value: number }) {
  return (
    <span className={css.delta} data-dir={value > 0 ? "up" : value < 0 ? "down" : undefined}>
      {pct(value)}
    </span>
  );
}

export default async function YantarConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const series = data.indexSeries.map((row) => row.value);
  const chart = smoothPath(series, 520, 170, 10);
  const first = data.indexSeries[0]?.date ?? "";
  const last = data.indexSeries.at(-1)?.date ?? "";
  const sessionDate = data.session.date ? longDate(data.session.date) : "последней сессии";
  const byVolume = priced.filter((item) => item.volume > 0).slice(0, 9);
  const bars = byVolume.length ? byVolume : priced.slice(0, 9);
  const maxVol = Math.max(1, ...bars.map((item) => item.volume));
  const movers = [
    { title: "Рост", rows: data.gainers.filter((r) => r.ticker !== "KSE").slice(0, 4) },
    { title: "Снижение", rows: data.losers.filter((r) => r.ticker !== "KSE").slice(0, 4) },
  ];
  const noMovers = movers.every((m) => !m.rows.length);
  const phones = data.contacts.phones.length ? data.contacts.phones : ["+996 312 31 14 84"];
  const address = data.contacts.address || "г. Бишкек, ул. Московская, 172";
  const email = data.contacts.email || "office@kse.kg";
  const chips = priced.slice(0, 6);

  return (
    <ConceptPage accent="#f0a73a">
      <div className={css.page}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <div className={css.wrap}>
            <Link href="/design-concepts/yantar" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={32} height={30} priority />
              <span>Кыргызская фондовая биржа</span>
            </Link>
            <nav aria-label="Основные разделы" className={css.nav}>
              {nav.map((item) => (
                <Link key={item.label} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link href="/members" className={css.btn}>
              Открыть счёт
            </Link>
          </div>
          <div className={css.stats}>
            <div className={css.wrap}>
              <span className={css.live} data-open={data.session.open ? "" : undefined}>
                <i aria-hidden="true" /> {data.session.label} · {data.session.hours}
              </span>
              <span>
                KSE <b>{num(data.index.value, 2)}</b> <Delta value={data.index.change} />
              </span>
              <span>
                Объём <b>{num(data.volume.volumeMln, 1)} млн сом</b>
              </span>
              <span className={css.hideS}>
                Сделок <b>{num(data.volume.trades)}</b>
              </span>
              <span className={css.hideS}>
                Капитализация <b>{num(data.index.capitalization, 1)} млн сом</b>
              </span>
            </div>
          </div>
        </header>

        <main id="main" className={css.wrap}>
          {/* ——— Первый экран ——— */}
          <section className={css.hero}>
            <div className={css.heroMain} data-intro="fade">
              <Image src="/hero/bishkek-ala-too.jpg" alt="" fill priority sizes="(max-width: 1000px) 100vw, 58vw" className={css.heroImg} />
              <div className={css.heroText}>
                <p className={css.kicker}>Торги {sessionDate}</p>
                <h1>
                  Инвестиции, <em>которые видно</em>
                </h1>
                <p>Цены, объёмы и отчётность каждого эмитента — открыто и по итогам каждой сессии.</p>
                <form action="/search" className={css.search} role="search">
                  <label htmlFor="yantar-q" className={css.sr}>
                    Найти бумагу или эмитента
                  </label>
                  <input id="yantar-q" name="q" placeholder="Найти бумагу или эмитента" />
                  <button type="submit">Найти</button>
                </form>
                <div className={css.chips}>
                  {chips.map((item) => (
                    <Link key={item.ticker} href={item.href} title={item.name}>
                      {item.ticker} <span>{num(item.price, 2)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className={css.heroSide}>
              <Link href="/market/index" className={`${css.panel} ${css.indexPanel}`} data-intro="rise" style={{ "--kc-d": "120ms" } as CSSProperties}>
                <span className={css.panelHead}>
                  <span>Индекс KSE</span>
                  <Delta value={data.index.change} />
                </span>
                <b className={css.indexValue}>{num(data.index.value, 2)}</b>
                {chart ? (
                  <svg viewBox="0 0 520 170" preserveAspectRatio="none" className={css.chart} aria-hidden="true">
                    <defs>
                      <linearGradient id="yantar-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0" stopColor="#f0a73a" stopOpacity="0.45" />
                        <stop offset="1" stopColor="#f0a73a" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[0.25, 0.5, 0.75].map((y) => (
                      <line key={y} x1="0" x2="520" y1={170 * y} y2={170 * y} className={css.gridLine} />
                    ))}
                    <path d={chart.area} fill="url(#yantar-fill)" />
                    <path d={chart.line} pathLength={1} className={css.line} />
                    <circle cx={chart.last[0]} cy={chart.last[1]} r="5" className={css.dot} />
                  </svg>
                ) : null}
                <span className={css.axis}>
                  <span>{first}</span>
                  <span>
                    мин {chart ? num(chart.min, 0) : "—"} · макс {chart ? num(chart.max, 0) : "—"}
                  </span>
                  <span>{last}</span>
                </span>
              </Link>

              <div className={`${css.panel} ${css.movers}`} data-intro="rise" style={{ "--kc-d": "200ms" } as CSSProperties}>
                {noMovers ? (
                  <div>
                    <span className={css.panelHead}>
                      <span>Самые активные</span>
                      <Link href="/market/quotes">Все</Link>
                    </span>
                    <ul className={css.rows}>
                      {priced.slice(0, 4).map((item) => (
                        <li key={item.ticker}>
                          <Link href={item.href} title={item.name}>
                            <b>{item.ticker}</b>
                            <span>{num(item.price, 2)}</span>
                            <Delta value={item.change} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  movers.map((group) => (
                    <div key={group.title}>
                      <span className={css.panelHead}>
                        <span>{group.title}</span>
                      </span>
                      <ul className={css.rows}>
                        {group.rows.length ? (
                          group.rows.map((item) => (
                            <li key={item.ticker}>
                              <Link href={item.href} title={item.name}>
                                <b>{item.ticker}</b>
                                <Delta value={item.change} />
                              </Link>
                            </li>
                          ))
                        ) : (
                          <li className={css.muted}>Нет бумаг</li>
                        )}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* ——— Объём и аукционы ——— */}
          <section className={css.duo}>
            <div className={css.panel} data-reveal>
              <span className={css.panelHead}>
                <span>Объём торгов по бумагам, сом</span>
                <Link href="/market/quotes">Все котировки</Link>
              </span>
              <ol className={css.bars} data-stagger>
                {bars.map((item) => (
                  <li key={item.ticker}>
                    <Link href={item.href} title={item.name}>
                      <b>{item.ticker}</b>
                      <span className={css.track}>
                        <i style={{ "--w": `${Math.max(2, (item.volume / maxVol) * 100)}%` } as CSSProperties} />
                      </span>
                      <span className={css.vol}>{num(item.volume)}</span>
                      <span className={css.price}>{num(item.price, 2)}</span>
                      <Delta value={item.change} />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>

            <div className={css.panel} data-reveal style={{ "--kc-d": "120ms" } as CSSProperties}>
              <span className={css.panelHead}>
                <span>Аукционы ГЦБ</span>
                <Link href="/gcb">Календарь</Link>
              </span>
              {data.auctions.length ? (
                <ol className={css.timeline}>
                  {data.auctions.map((item) => (
                    <li key={`${item.date}-${item.type}`}>
                      <span className={css.tDate}>{longDate(item.date)}</span>
                      <b>{item.type}</b>
                      <span>
                        {item.volume} · {item.status}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={css.muted}>Расписание аукционов Минфина публикуется на странице ГЦБ.</p>
              )}
              <div className={css.facts}>
                <div>
                  <b>{data.quotes.total}</b>
                  <span>бумаг в котировках</span>
                </div>
                <div>
                  <b>{data.issuers}</b>
                  <span>эмитентов</span>
                </div>
                <div>
                  <b>{data.listed}</b>
                  <span>в листинге</span>
                </div>
              </div>
            </div>
          </section>

          {/* ——— Новости ——— */}
          {data.news.length ? (
            <section className={css.block}>
              <header className={css.blockHead} data-reveal>
                <h2>Новости биржи</h2>
                <Link href="/news">Все новости →</Link>
              </header>
              <div className={css.news} data-stagger>
                {data.news.slice(0, 4).map((item) => (
                  <Link key={item.slug} href={`/news/${item.slug}`} className={css.newsCard}>
                    <span className={css.newsPhoto}>
                      <Image src={item.photo} alt="" fill sizes="(max-width: 700px) 100vw, 25vw" />
                    </span>
                    <small>
                      {longDate(item.date)} · {item.tag}
                    </small>
                    <b>{item.title}</b>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* ——— Нижний ряд ——— */}
          <section className={css.trio}>
            <div className={css.panel} data-reveal>
              <span className={css.panelHead}>
                <span>Инвестору — за 4 шага</span>
              </span>
              <ol className={css.steps}>
                <li>
                  <b>01</b> Выберите брокера среди участников торгов
                </li>
                <li>
                  <b>02</b> Откройте брокерский счёт и счёт депо
                </li>
                <li>
                  <b>03</b> Подайте заявку на покупку бумаги
                </li>
                <li>
                  <b>04</b> Сделка проходит на бирже
                </li>
              </ol>
              <Link href="/members" className={css.btn}>
                Участники торгов
              </Link>
            </div>
            <Link href={EDU_URL} className={`${css.panel} ${css.edu}`} data-reveal style={{ "--kc-d": "100ms" } as CSSProperties} {...linkProps(EDU_URL)}>
              <Image src="/hub/hub-education.jpg" alt="" fill sizes="(max-width: 900px) 100vw, 33vw" />
              <span className={css.eduText}>
                <small>Учебный центр</small>
                <b>Курсы для инвесторов и специалистов рынка</b>
                <span>Выбрать курс →</span>
              </span>
            </Link>
            <div className={css.panel} data-reveal style={{ "--kc-d": "200ms" } as CSSProperties}>
              <span className={css.panelHead}>
                <span>Эмитентам</span>
              </span>
              <ul className={css.links}>
                <li>
                  <Link href="/listing">Листинг и требования</Link>
                </li>
                <li>
                  <Link href="/disclosure">Раскрытие информации</Link>
                </li>
                <li>
                  <Link href="/tariffs">Тарифы</Link>
                </li>
                <li>
                  <Link href="/documents">Документы и правила</Link>
                </li>
              </ul>
              <div className={css.contact}>
                {phones.slice(0, 2).map((phone) => (
                  <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                    {phone}
                  </a>
                ))}
                <a href={`mailto:${email}`}>{email}</a>
              </div>
            </div>
          </section>
        </main>

        <footer className={css.footer}>
          <div className={css.wrap}>
            <span>{data.contacts.copyright}</span>
            <span>{address}</span>
            {data.contacts.license ? <span>Лицензия {data.contacts.license}</span> : null}
          </div>
        </footer>

        <ConceptSwitch current="yantar" />
      </div>
    </ConceptPage>
  );
}
