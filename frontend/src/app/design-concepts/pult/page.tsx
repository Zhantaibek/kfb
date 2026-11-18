import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import css from "./pult.module.css";

/*
 * Концепция 55 — «Пульт». Плотная мозаика плиток: весь рынок на первом экране без прокрутки.
 * Палитра — кремовая бумага, винный и охра. Шрифты сайта, данные — loadHomeData().
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "55 · Пульт" };

const nav = [
  { label: "Торги", href: "/market" },
  { label: "Котировки", href: "/market/quotes" },
  { label: "ГЦБ", href: "/gcb" },
  { label: "Листинг", href: "/listing" },
  { label: "Раскрытие", href: "/disclosure" },
  { label: "Новости", href: "/news" },
  { label: "О бирже", href: "/about" },
];

const services = [
  { title: "Торги", text: "Акции, облигации, металлы", href: "/market", photo: "/hub/hub-market.jpg" },
  { title: "ГЦБ", text: "Аукционы Минфина", href: "/gcb", photo: "/hub/hub-gcb.jpg" },
  { title: "Листинг", text: "Выход на биржу", href: "/listing", photo: "/hub/hub-listing.jpg" },
  { title: "Раскрытие", text: "Отчёты эмитентов", href: "/disclosure", photo: "/hub/hub-disclosure.jpg" },
  { title: "Участники", text: "Брокеры и дилеры", href: "/members", photo: "/hub/hub-members.jpg" },
  { title: "Обучение", text: "Учебный центр", href: EDU_URL, photo: "/hub/hub-education.jpg" },
];

const typeName = { stock: "Акция", bond: "Облигация", gcb: "ГЦБ", metal: "Металл" } as const;

function Delta({ value }: { value: number }) {
  return (
    <span className={css.delta} data-dir={value > 0 ? "up" : value < 0 ? "down" : undefined}>
      {pct(value)}
    </span>
  );
}

export default async function PultConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const series = data.indexSeries.map((row) => row.value);
  const spark = smoothPath(series, 400, 110, 8);
  const sessionDate = data.session.date ? longDate(data.session.date) : "последней сессии";
  const tape = priced.slice(0, 14);
  const [lead, ...rest] = data.news;
  const phones = data.contacts.phones.length ? data.contacts.phones : ["+996 312 31 14 84"];
  const address = data.contacts.address || "г. Бишкек, ул. Московская, 172";
  const email = data.contacts.email || "office@kse.kg";
  // Облигаций с ценой мало — добираем таблицу остальными бумагами сессии, чтобы панель не пустовала.
  const stockRows = data.quotes.stocks.slice(0, 6);
  const otherRows = [...data.quotes.bonds, ...data.quotes.metals, ...priced.filter((item) => !stockRows.some((s) => s.ticker === item.ticker))]
    .filter((item, i, list) => list.findIndex((x) => x.ticker === item.ticker) === i)
    .slice(0, 6);
  const tables = [
    { title: "Акции", rows: stockRows },
    { title: "Облигации и другие бумаги", rows: otherRows },
  ].filter((t) => t.rows.length);
  const maxLeader = Math.max(1, ...data.leaders.map((row) => row.volume));

  return (
    <ConceptPage accent="#6d1630">
      <div className={css.page}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        {/* ——— Лента котировок ——— */}
        <div className={css.tape} aria-label="Котировки последней сессии">
          <div className={css.tapeTrack}>
            {[...tape, ...tape].map((item, i) => (
              <Link key={`${item.ticker}-${i}`} href={item.href} aria-hidden={i >= tape.length || undefined} tabIndex={i >= tape.length ? -1 : undefined}>
                <b>{item.ticker}</b> {num(item.price, 2)} <Delta value={item.change} />
              </Link>
            ))}
          </div>
        </div>

        <header className={css.header}>
          <div className={css.wrap}>
            <Link href="/design-concepts/pult" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={34} height={32} priority />
              <span>
                <b>КФБ</b>
                <small>Кыргызская фондовая биржа</small>
              </span>
            </Link>
            <nav aria-label="Основные разделы" className={css.nav}>
              {nav.map((item) => (
                <Link key={item.label} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <form action="/search" className={css.search} role="search">
              <label className={css.sr} htmlFor="pult-q">
                Поиск по сайту
              </label>
              <input id="pult-q" name="q" placeholder="Тикер, эмитент, документ" />
              <button type="submit" aria-label="Найти">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
              </button>
            </form>
          </div>
        </header>

        <main id="main" className={css.wrap}>
          {/* ——— Мозаика первого экрана ——— */}
          <section className={css.bento} aria-label="Рынок сегодня">
            <div className={`${css.tile} ${css.hero}`} data-intro="fade">
              <Image src="/hero/bishkek-ala-too.jpg" alt="" fill priority sizes="(max-width: 1000px) 100vw, 42vw" />
              <div className={css.heroText}>
                <p className={css.kicker}>Рынок капитала Кыргызстана</p>
                <h1>Весь рынок — на одном экране</h1>
                <p>Котировки, индекс, аукционы ГЦБ и раскрытие эмитентов. Данные последней торговой сессии.</p>
                <div className={css.heroBtns}>
                  <Link href="/members" className={css.btnOchre}>
                    Начать инвестировать
                  </Link>
                  <Link href="/listing" className={css.btnGhost}>
                    Эмитентам
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/market/index" className={`${css.tile} ${css.index}`} data-intro="rise" style={{ "--kc-d": "80ms" } as CSSProperties}>
              <span className={css.tileHead}>
                <span>Индекс KSE</span>
                <Delta value={data.index.change} />
              </span>
              <b className={css.indexValue}>{num(data.index.value, 2)}</b>
              {spark ? (
                <svg viewBox="0 0 400 110" preserveAspectRatio="none" className={css.spark} aria-hidden="true">
                  <path d={spark.area} className={css.sparkArea} />
                  <path d={spark.line} pathLength={1} className={css.sparkLine} />
                </svg>
              ) : null}
              <span className={css.tileFoot}>
                <span>Капитализация</span>
                <b>{num(data.index.capitalization, 1)} млн сом</b>
              </span>
            </Link>

            <div className={`${css.tile} ${css.session}`} data-intro="rise" style={{ "--kc-d": "140ms" } as CSSProperties}>
              <span className={css.tileHead}>
                <span className={css.live} data-open={data.session.open ? "" : undefined}>
                  <i aria-hidden="true" /> {data.session.label}
                </span>
              </span>
              <dl>
                <div>
                  <dt>Торги</dt>
                  <dd>{sessionDate}</dd>
                </div>
                <div>
                  <dt>Объём</dt>
                  <dd>{num(data.volume.volumeMln, 1)} млн</dd>
                </div>
                <div>
                  <dt>Сделок</dt>
                  <dd>{num(data.volume.trades)}</dd>
                </div>
                <div>
                  <dt>Часы</dt>
                  <dd>{data.session.hours}</dd>
                </div>
              </dl>
            </div>

            <div className={`${css.tile} ${css.quotes}`} data-intro="rise" style={{ "--kc-d": "200ms" } as CSSProperties}>
              <span className={css.tileHead}>
                <span>Самые активные</span>
                <Link href="/market/quotes">Все</Link>
              </span>
              <table className={css.mini}>
                <tbody>
                  {priced.slice(0, 7).map((item) => (
                    <tr key={item.ticker}>
                      <th scope="row">
                        <Link href={item.href} title={item.name}>
                          {item.ticker}
                        </Link>
                        <small>{typeName[item.type]}</small>
                      </th>
                      <td>{num(item.price, 2)}</td>
                      <td>
                        <Delta value={item.change} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`${css.tile} ${css.auctions}`} data-intro="rise" style={{ "--kc-d": "260ms" } as CSSProperties}>
              <span className={css.tileHead}>
                <span>Аукционы ГЦБ</span>
                <Link href="/gcb">Календарь</Link>
              </span>
              {data.auctions.length ? (
                <ol>
                  {data.auctions.slice(0, 4).map((item) => {
                    const [d, m] = item.date.split(".");
                    return (
                      <li key={`${item.date}-${item.type}`}>
                        <span className={css.aDate}>
                          {d}.{m}
                        </span>
                        <span>
                          <b>{item.type}</b>
                          <small>
                            {item.volume} · {item.status}
                          </small>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className={css.empty}>Расписание аукционов публикуется Минфином на странице ГЦБ.</p>
              )}
              {data.leaders.length ? (
                <div className={css.leaders}>
                  <span className={css.tileHead}>
                    <span>Лидеры недели</span>
                  </span>
                  <ol className={css.bars}>
                    {data.leaders.slice(0, 4).map((row) => (
                      <li key={row.ticker}>
                        <span>
                          <b>{row.ticker}</b>
                          <small>{num(row.volume)} сом</small>
                        </span>
                        <i style={{ "--w": `${(row.volume / maxLeader) * 100}%` } as CSSProperties} aria-hidden="true" />
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>

            <div className={`${css.tile} ${css.numbers}`} data-intro="rise" style={{ "--kc-d": "320ms" } as CSSProperties}>
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
          </section>

          {/* ——— Новости полосой ——— */}
          {data.news.length ? (
            <section className={css.strip} data-stagger aria-label="Последние новости">
              {data.news.slice(0, 4).map((item) => (
                <Link key={item.slug} href={`/news/${item.slug}`} className={css.stripItem}>
                  <span className={css.stripPhoto}>
                    <Image src={item.photo} alt="" fill sizes="120px" />
                  </span>
                  <span>
                    <small>
                      {longDate(item.date)} · {item.tag}
                    </small>
                    <b>{item.title}</b>
                  </span>
                </Link>
              ))}
            </section>
          ) : null}

          {/* ——— Таблицы рынка ——— */}
          <section className={css.block}>
            <header className={css.blockHead} data-reveal>
              <h2>Рынок по секциям</h2>
              <p>Цены и изменения по итогам торгов {sessionDate}</p>
            </header>
            <div className={css.tables} data-stagger>
              {tables.map((table) => (
                <div key={table.title} className={css.panel}>
                  <span className={css.tileHead}>
                    <span>{table.title}</span>
                    <Link href="/market/quotes">Все</Link>
                  </span>
                  <table className={css.mini}>
                    <thead>
                      <tr>
                        <th scope="col">Бумага</th>
                        <th scope="col">Цена</th>
                        <th scope="col">Изм.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.slice(0, 6).map((item) => (
                        <tr key={item.ticker}>
                          <th scope="row">
                            <Link href={item.href} title={item.name}>
                              {item.ticker}
                            </Link>
                            <small>{item.name}</small>
                          </th>
                          <td>{item.price ? num(item.price, 2) : "—"}</td>
                          <td>
                            <Delta value={item.change} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </section>

          {/* ——— Сервисы ——— */}
          <section className={css.block}>
            <header className={css.blockHead} data-reveal>
              <h2>Сервисы биржи</h2>
              <p>Для инвесторов, эмитентов и участников торгов</p>
            </header>
            <div className={css.services} data-stagger>
              {services.map((item, i) => (
                <Link key={item.title} href={item.href} className={css.service} {...linkProps(item.href)}>
                  <span className={css.servicePhoto}>
                    <Image src={item.photo} alt="" fill sizes="(max-width: 700px) 50vw, 16vw" />
                  </span>
                  <small>0{i + 1}</small>
                  <b>{item.title}</b>
                  <span>{item.text}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* ——— Пресс-центр ——— */}
          <section className={`${css.block} ${css.press}`}>
            {lead ? (
              <Link href={`/news/${lead.slug}`} className={css.lead} data-reveal>
                <span className={css.leadPhoto}>
                  <Image src={lead.photo} alt="" fill sizes="(max-width: 1000px) 100vw, 40vw" />
                </span>
                <span className={css.leadText}>
                  <small>
                    {longDate(lead.date)} · {lead.tag}
                  </small>
                  <b>{lead.title}</b>
                  <span>{lead.excerpt}</span>
                </span>
              </Link>
            ) : null}
            <div className={css.pressSide}>
            <div className={css.panel} data-reveal>
              <span className={css.tileHead}>
                <span>Ещё новости</span>
                <Link href="/news">Все новости</Link>
              </span>
              <ul className={css.list}>
                {[...rest, ...data.companyNews].slice(0, 6).map((item) => (
                  <li key={item.slug}>
                    <Link href={`/news/${item.slug}`}>
                      <small>{longDate(item.date)}</small>
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className={css.side} data-reveal>
              <Link href={EDU_URL} className={css.edu} {...linkProps(EDU_URL)}>
                <small>Учебный центр</small>
                <b>Курсы для начинающих инвесторов</b>
                <span>Записаться →</span>
              </Link>
              <div className={css.contact}>
                <small>Контакты</small>
                {phones.slice(0, 2).map((phone) => (
                  <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                    {phone}
                  </a>
                ))}
                <a href={`mailto:${email}`}>{email}</a>
                <span>{address}</span>
              </div>
            </div>
            </div>
          </section>
        </main>

        <footer className={css.footer}>
          <div className={css.wrap}>
            <span>{data.contacts.copyright}</span>
            <nav aria-label="Нижнее меню">
              {nav.slice(0, 6).map((item) => (
                <Link key={item.label} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </footer>

        <ConceptSwitch current="pult" />
      </div>
    </ConceptPage>
  );
}
