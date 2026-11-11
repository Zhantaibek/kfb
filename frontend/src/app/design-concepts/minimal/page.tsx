import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { mediaSrc } from "@/lib/cms/media-src";
import { ConceptPage, Words } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linePath, longDate, nav, num, pct } from "../_shared/data";
import { loadHomeData, type HomeData } from "../_shared/home-data";
import { Tabs } from "./Tabs";
import css from "./minimal.module.css";

// Концепция 4 — Minimalist Functional: сервис для инвестора в духе современных финтех-продуктов.
// Реальные данные сайта: рынок (loadMarketData), новости и контакты из админки, аукционы ГЦБ.
const sans = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--m-sans",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--m-mono",
});

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "4 · Minimalist Functional" };

type Row = HomeData["instruments"][number];

const steps = [
  {
    n: "01",
    title: "Выберите брокера",
    text: "Сделки на бирже заключаются только через лицензированных участников торгов.",
    href: "/members",
    photo: "/hub/hub-members.jpg",
  },
  {
    n: "02",
    title: "Откройте счёт",
    text: "Брокер откроет брокерский счёт и счёт депо для ваших ценных бумаг.",
    href: "/investors",
    photo: "/carousel/office.jpg",
  },
  {
    n: "03",
    title: "Купите первые бумаги",
    text: "Акции, облигации, ГЦБ или золото — поручение исполнит брокер на торговой сессии.",
    href: "/market/quotes",
    photo: "/hub/hub-analytics.jpg",
  },
];

const monthsShort = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

function Change({ value }: { value: number }) {
  // Рост в разы (после почти пустой сессии) читается лучше, чем «+647 527,00%».
  const text = value >= 1000 ? `в ${num(value / 100 + 1)} раз` : pct(value);
  return <span className={value > 0 ? css.up : value < 0 ? css.down : css.flat}>{text}</span>;
}

function QuoteTable({ rows, live }: { rows: Row[]; live: boolean }) {
  if (!rows.length) return <p className={css.empty}>Сделок по этим инструментам не было</p>;
  return (
    <table className={css.table}>
      <thead>
        <tr>
          <th scope="col">Бумага</th>
          <th scope="col" className={css.num}>
            Цена, сом
          </th>
          <th scope="col" className={css.num}>
            Изм.
          </th>
          <th scope="col" className={`${css.num} ${css.hideSm}`}>
            {live ? "Объём, тыс. сом" : "Объём"}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((q, i) => (
          <tr key={q.ticker} style={{ "--r": i } as CSSProperties}>
            <td>
              <Link href={q.href} className={css.ticker}>
                <span className={css.badge}>{q.ticker.slice(0, 2)}</span>
                <span>
                  <b>{q.ticker}</b>
                  <small>{q.name}</small>
                </span>
              </Link>
            </td>
            <td className={`${css.num} ${css.mono}`}>{num(q.price, 2)}</td>
            <td className={css.num}>
              <Change value={q.change} />
            </td>
            <td className={`${css.num} ${css.mono} ${css.hideSm}`}>{num(q.volume, 1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** «13.11.2026» → { day: "13", month: "ноя" }. */
function dayMonth(value: string) {
  const match = value.match(/^(\d{2})\.(\d{2})\.\d{4}$/);
  return match ? { day: String(Number(match[1])), month: monthsShort[Number(match[2]) - 1] } : { day: value, month: "" };
}

export default async function MinimalConcept() {
  const data = await loadHomeData();
  const traded = data.instruments.filter((item) => item.volume > 0);
  const top = traded[0];
  const chips = traded.slice(0, 4).map((item) => item.ticker);
  // В списках роста и снижения первой строкой может идти индекс KSE — в таблицу бумаг он не входит.
  const gainers = data.gainers.filter((item): item is Row => "price" in item);
  const losers = data.losers.filter((item): item is Row => "price" in item);

  const tabs = [
    { label: "Самые активные", content: <QuoteTable rows={traded.slice(0, 6)} live={data.live} /> },
    { label: "Акции", content: <QuoteTable rows={data.quotes.stocks} live={data.live} /> },
    { label: "Облигации и ГЦБ", content: <QuoteTable rows={data.quotes.bonds} live={data.live} /> },
    ...(gainers.length ? [{ label: "Растут", content: <QuoteTable rows={gainers} live={data.live} /> }] : []),
    ...(losers.length ? [{ label: "Падают", content: <QuoteTable rows={losers} live={data.live} /> }] : []),
  ];

  return (
    <ConceptPage accent="#1f7a83">
      <div className={`${css.page} ${sans.variable} ${mono.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>
        <header className={css.header}>
          <div className={css.wrap}>
            <Link href="/design-concepts/minimal" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={32} height={30} priority />
              <span>KSE</span>
            </Link>
            <nav className={css.nav} aria-label="Основное меню">
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <form action="/search" role="search" className={css.headSearch}>
              <label htmlFor="m-head-q" className={css.srOnly}>
                Поиск по сайту
              </label>
              <input id="m-head-q" name="q" type="search" placeholder="Поиск" />
            </form>
            <Link href="/members" className={css.headCta}>
              Начать
            </Link>
            <details className={css.menu}>
              <summary>Меню</summary>
              <nav aria-label="Меню (мобильное)">
                {nav.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
                <Link href="/members">Участники торгов</Link>
                <Link href="/contacts">Контакты</Link>
              </nav>
            </details>
          </div>
        </header>

        <main id="main">
          <section className={`${css.wrap} ${css.hero}`} aria-labelledby="m-hero">
            <div className={css.heroText}>
              <p className={css.pill} data-intro="fade" style={{ "--kc-d": "100ms" } as CSSProperties}>
                <i aria-hidden="true" data-closed={!data.session.open || undefined} /> {data.session.label} · {data.session.hours}
              </p>
              <h1 id="m-hero" data-intro="words" style={{ "--kc-d": "200ms" } as CSSProperties}>
                <Words text="Инвестируйте в компании Кыргызстана" />
              </h1>
              <p className={css.lead} data-intro style={{ "--kc-d": "550ms" } as CSSProperties}>
                Котировки, итоги торгов и отчётность эмитентов — в одном месте. Сделки — через лицензированных брокеров.
              </p>
              <form action="/search" role="search" className={css.search} data-intro style={{ "--kc-d": "700ms" } as CSSProperties}>
                <label htmlFor="m-q" className={css.srOnly}>
                  Найти бумагу или эмитента
                </label>
                <input id="m-q" name="q" type="search" placeholder="Тикер или эмитент" autoComplete="off" />
                <button type="submit">Найти</button>
              </form>
              {chips.length ? (
                <ul className={css.chips} data-intro style={{ "--kc-d": "850ms" } as CSSProperties} aria-label="Самые активные бумаги">
                  {chips.map((t) => (
                    <li key={t}>
                      <Link href={`/search?q=${encodeURIComponent(t)}`}>{t}</Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className={css.heroVisual}>
              <span className={css.heroPhoto} data-intro="mask" style={{ "--kc-d": "250ms" } as CSSProperties}>
                <Image src="/hub/hub-market.jpg" alt="Графики торгов на планшете" fill priority sizes="(max-width: 960px) 100vw, 46vw" />
              </span>
              <Link
                href="/market/index"
                className={css.floatIndex}
                aria-label="Индекс KSE — подробнее"
                data-intro="left"
                data-tilt
                style={{ "--kc-d": "900ms" } as CSSProperties}
              >
                <small>Индекс KSE</small>
                <b className={css.mono}>{num(data.index.value, 2)}</b>
                <Change value={data.index.change} />
                {data.history.length > 1 ? (
                  <svg viewBox="0 0 160 44" preserveAspectRatio="none" aria-hidden="true" data-intro="draw" style={{ "--kc-d": "1300ms" } as CSSProperties}>
                    <path d={linePath(data.history.slice(-30), 160, 44, 3)} />
                  </svg>
                ) : null}
              </Link>
              {top ? (
                <Link href={top.href} className={css.floatQuote} aria-label={`${top.ticker} — лидер сессии по объёму`}>
                  <span className={css.badge}>{top.ticker.slice(0, 2)}</span>
                  <span>
                    <b>{top.ticker}</b>
                    <small>{top.name}</small>
                  </span>
                  <span className={css.mono}>{num(top.price, 2)}</span>
                </Link>
              ) : null}
            </div>
          </section>

          <section className={`${css.wrap} ${css.overview}`} aria-label="Рынок сегодня" data-stagger>
            <div className={css.statCard} data-spotlight>
              <small>Капитализация</small>
              <b className={css.mono} data-count={data.index.capitalization} data-digits="1">
                {num(data.index.capitalization, 1)}
              </b>
              <span>млрд сом</span>
            </div>
            <div className={css.statCard} data-spotlight>
              <small>Объём торгов</small>
              <b className={css.mono} data-count={data.volume.volumeMln} data-digits="2">
                {num(data.volume.volumeMln, 2)}
              </b>
              <span>
                млн сом · <Change value={data.volume.volumeChange} />
              </span>
            </div>
            <div className={css.statCard} data-spotlight>
              <small>Сделок за сессию</small>
              <b className={css.mono} data-count={data.volume.trades}>
                {num(data.volume.trades)}
              </b>
              <span>{data.live ? longDate(data.session.date) : "Демонстрационные значения"}</span>
            </div>
            <div className={css.statCard} data-spotlight>
              <small>Эмитентов</small>
              <b className={css.mono} data-count={data.issuers}>
                {num(data.issuers)}
              </b>
              <span>{num(data.listed)} в листинге</span>
            </div>
          </section>

          <section className={`${css.wrap} ${css.block}`} aria-labelledby="m-quotes">
            <div className={css.blockHead} data-reveal>
              <h2 id="m-quotes">Котировки</h2>
              <Link href="/market/quotes">Все бумаги →</Link>
            </div>
            <div className={css.panel} data-reveal>
              <Tabs tabs={tabs} />
            </div>
          </section>

          <section className={`${css.wrap} ${css.block}`} aria-labelledby="m-steps">
            <div className={css.blockHead} data-reveal>
              <h2 id="m-steps">Три шага до первой сделки</h2>
            </div>
            <ol className={css.steps} data-stagger>
              {steps.map((s) => (
                <li key={s.n}>
                  <Link href={s.href}>
                    <span className={css.stepPhoto}>
                      <Image src={s.photo} alt="" fill sizes="(max-width: 960px) 100vw, 33vw" />
                    </span>
                    <span className={css.stepBody}>
                      <span className={css.stepNo}>{s.n}</span>
                      <b>{s.title}</b>
                      <span>{s.text}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section className={`${css.wrap} ${css.block} ${css.split}`} aria-label="Новости и аукционы ГЦБ">
            <div>
              <div className={css.blockHead} data-reveal>
                <h2>Новости</h2>
                <Link href="/news">Все →</Link>
              </div>
              {data.news.length ? (
                <ul className={css.news} data-stagger>
                  {data.news.slice(0, 4).map((n) => (
                    <li key={n.slug}>
                      <Link href={`/news/${n.slug}`}>
                        <span className={css.newsThumb}>
                          <Image src={mediaSrc(n.photo)} alt="" fill sizes="120px" unoptimized />
                        </span>
                        <span>
                          <small>
                            {n.tag} · {longDate(n.date)}
                          </small>
                          <b>{n.title}</b>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={css.empty}>Новостей пока нет</p>
              )}
            </div>
            <div>
              <div className={css.blockHead} data-reveal>
                <h2>Аукционы ГЦБ</h2>
                <Link href="/gcb">Календарь →</Link>
              </div>
              {data.auctions.length ? (
                <ul className={css.events} data-stagger>
                  {data.auctions.map((a) => {
                    const { day, month } = dayMonth(a.date);
                    return (
                      <li key={`${a.date}-${a.type}`}>
                        <span className={css.eventDate}>
                          <b>{day}</b>
                          <small>{month}</small>
                        </span>
                        <span>
                          <b>{a.type}</b>
                          <small>
                            {a.volume} · {a.status}
                          </small>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className={css.empty}>Ближайших аукционов нет</p>
              )}
            </div>
          </section>

          <section className={`${css.wrap} ${css.block}`} aria-labelledby="m-cta">
            <div className={css.cta} data-reveal="zoom">
              <span className={css.ctaPhoto}>
                <Image src="/carousel/meeting.jpg" alt="" fill sizes="(max-width: 960px) 100vw, 50vw" />
              </span>
              <div>
                <h2 id="m-cta">Компаниям: привлеките капитал через листинг</h2>
                <p>Размещение акций и облигаций, сопровождение эмитента и раскрытие информации по правилам биржи.</p>
                <div className={css.ctaActions}>
                  <Link href="/listing" className={css.btnDark}>
                    Условия листинга
                  </Link>
                  <Link href="/contacts" className={css.btnGhost}>
                    Связаться
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className={css.footer}>
          <div className={`${css.wrap} ${css.footGrid}`} data-stagger>
            <div>
              <b>ЗАО «Кыргызская фондовая биржа»</b>
              {data.contacts.address ? <p>{data.contacts.address}</p> : null}
            </div>
            <nav aria-label="Разделы">
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href="/contacts">Контакты</Link>
            </nav>
            <div>
              {data.contacts.phones.map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                  {phone}
                </a>
              ))}
              {data.contacts.email ? <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a> : null}
            </div>
          </div>
          <p className={`${css.wrap} ${css.demo}`}>
            {data.contacts.copyright}
            {data.contacts.license ? ` · ${data.contacts.license}` : ""}
          </p>
        </footer>
        <ConceptSwitch current="minimal" />
      </div>
    </ConceptPage>
  );
}
