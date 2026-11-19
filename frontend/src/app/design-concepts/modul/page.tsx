import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import css from "./modul.module.css";

/*
 * Концепция 56 — «Модуль». Швейцарская типографика: белый, чёрный и сигнальный красный,
 * модульная сетка с чёрными линейками, где каждая ячейка заполнена данными. Шрифты сайта, данные — loadHomeData().
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "56 · Модуль" };

const nav = [
  { label: "Торги", href: "/market" },
  { label: "Котировки", href: "/market/quotes" },
  { label: "ГЦБ", href: "/gcb" },
  { label: "Листинг", href: "/listing" },
  { label: "Раскрытие", href: "/disclosure" },
  { label: "О бирже", href: "/about" },
];

const services = [
  { title: "Организация торгов", text: "Акции, облигации и драгоценные металлы в едином торговом окне.", href: "/market" },
  { title: "Аукционы ГЦБ", text: "Размещение государственных ценных бумаг Министерства финансов.", href: "/gcb" },
  { title: "Листинг", text: "Включение компаний в биржевой список и сопровождение эмитентов.", href: "/listing" },
  { title: "Раскрытие", text: "Отчётность и существенные факты эмитентов в открытом доступе.", href: "/disclosure" },
  { title: "Участники торгов", text: "Брокеры и дилеры с лицензией — точка входа для инвестора.", href: "/members" },
  { title: "Учебный центр", text: "Курсы для инвесторов и специалистов рынка ценных бумаг.", href: EDU_URL },
];

function Delta({ value }: { value: number }) {
  return (
    <span className={css.delta} data-dir={value > 0 ? "up" : value < 0 ? "down" : undefined}>
      {pct(value)}
    </span>
  );
}

export default async function ModulConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const chart = smoothPath(
    data.indexSeries.map((row) => row.value),
    300,
    120,
    6,
  );
  const sessionDate = data.session.date ? longDate(data.session.date) : "последней сессии";
  const phones = data.contacts.phones.length ? data.contacts.phones : ["+996 312 31 14 84"];
  const address = data.contacts.address || "г. Бишкек, ул. Московская, 172";
  const email = data.contacts.email || "office@kse.kg";
  const stocks = data.quotes.stocks.filter((r) => r.price > 0);
  const left = (stocks.length ? stocks : priced).slice(0, 6);
  // Облигаций с ценой мало — добираем правую таблицу остальными бумагами сессии.
  const right = [...data.quotes.bonds, ...data.quotes.metals, ...priced]
    .filter((r) => r.price > 0 && !left.some((l) => l.ticker === r.ticker))
    .filter((r, i, list) => list.findIndex((x) => x.ticker === r.ticker) === i)
    .slice(0, 6);
  const halves = [
    { title: "Акции", rows: left },
    { title: "Облигации и другие бумаги", rows: right },
  ].filter((h) => h.rows.length);
  const maxLeader = Math.max(1, ...data.leaders.map((row) => row.volume));
  const feed = [...data.news, ...data.companyNews].slice(0, 6);
  const decimals = num(data.index.value, 2).split(",")[1] ?? "00";

  return (
    <ConceptPage accent="#e1251b">
      <div className={css.page}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <div className={css.top}>
          <div className={css.wrap}>
            <span className={css.live} data-open={data.session.open ? "" : undefined}>
              <i aria-hidden="true" />
              {data.session.label}
            </span>
            <span>Торги {sessionDate}</span>
            <span>
              KSE <b>{num(data.index.value, 2)}</b> <Delta value={data.index.change} />
            </span>
            <span className={css.topHide}>
              Объём <b>{num(data.volume.volumeMln, 1)} млн сом</b>
            </span>
            <a href={`tel:${phones[0].replace(/[^\d+]/g, "")}`} className={css.topHide}>
              {phones[0]}
            </a>
          </div>
        </div>

        <header className={css.header}>
          <div className={css.wrap}>
            <Link href="/design-concepts/modul" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
              <span className={css.logoBox} aria-hidden="true">
                КФБ
              </span>
              <span>
                Кыргызская
                <br />
                фондовая биржа
              </span>
            </Link>
            <nav aria-label="Основные разделы" className={css.nav}>
              {nav.map((item, i) => (
                <Link key={item.label} href={item.href}>
                  <small>0{i + 1}</small>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main id="main" className={css.wrap}>
          {/* ——— Модульная сетка первого экрана ——— */}
          <section className={css.grid}>
            <div className={`${css.cell} ${css.title}`} data-intro="rise">
              <p className={css.label}>Рынок капитала · Кыргызстан</p>
              <h1>
                Рынок
                <br />
                капитала<span className={css.dot}>.</span>
                <br />
                Открыто.
              </h1>
              <div className={css.titleFoot}>
                <p>Акции, облигации, ГЦБ и драгоценные металлы — котировки, аукционы и отчётность эмитентов в одной сетке.</p>
                <div className={css.btns}>
                  <Link href="/members" className={css.btnRed}>
                    Начать инвестировать →
                  </Link>
                  <Link href="/listing" className={css.btnLine}>
                    Разместить выпуск
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/market/index" className={`${css.cell} ${css.index}`} data-intro="fade" style={{ "--kc-d": "120ms" } as CSSProperties}>
              <p className={css.label}>Индекс KSE</p>
              <b className={css.giant}>{num(Math.trunc(data.index.value))}</b>
              <span className={css.indexRow}>
                <span>,{decimals}</span>
                <Delta value={data.index.change} />
              </span>
              {chart ? (
                <svg viewBox="0 0 300 120" preserveAspectRatio="none" className={css.chart} aria-hidden="true">
                  <path d={chart.line} pathLength={1} />
                </svg>
              ) : null}
              <span className={css.indexFoot}>Капитализация {num(data.index.capitalization, 1)} млн сом</span>
            </Link>

            <div className={`${css.cell} ${css.photo}`} data-intro="fade" style={{ "--kc-d": "180ms" } as CSSProperties}>
              <Image src="/hero/kse-entrance-garden.jpg" alt="Вход в здание Кыргызской фондовой биржи" fill sizes="(max-width: 900px) 100vw, 33vw" priority />
              <span className={css.photoCap}>{address}</span>
            </div>

            <div className={`${css.cell} ${css.stats}`}>
              <p className={css.label}>Сессия в цифрах</p>
              <dl data-stagger>
                <div>
                  <dt>Объём, млн сом</dt>
                  <dd>{num(data.volume.volumeMln, 1)}</dd>
                </div>
                <div>
                  <dt>Сделок</dt>
                  <dd>{num(data.volume.trades)}</dd>
                </div>
                <div>
                  <dt>Бумаг в котировках</dt>
                  <dd>{data.quotes.total}</dd>
                </div>
                <div>
                  <dt>Эмитентов</dt>
                  <dd>{data.issuers}</dd>
                </div>
              </dl>
            </div>

            <div className={`${css.cell} ${css.auctions}`}>
              <p className={css.label}>
                Аукционы ГЦБ <Link href="/gcb">Все →</Link>
              </p>
              {data.auctions.length ? (
                <ol data-stagger>
                  {data.auctions.slice(0, 4).map((item) => (
                    <li key={`${item.date}-${item.type}`}>
                      <b>{item.date.slice(0, 5)}</b>
                      <span>{item.type}</span>
                      <em>{item.volume}</em>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={css.note}>Календарь аукционов Минфина — на странице ГЦБ.</p>
              )}
              {data.leaders.length ? (
                <div className={css.leaders}>
                  <p className={css.label}>Лидеры недели по объёму</p>
                  <ol>
                    {data.leaders.slice(0, 3).map((row) => (
                      <li key={row.ticker}>
                        <b>{row.ticker}</b>
                        <i style={{ "--w": `${(row.volume / maxLeader) * 100}%` } as CSSProperties} aria-hidden="true" />
                        <span>{num(row.volume)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>

            <div className={`${css.cell} ${css.quotes}`}>
              {halves.map((half) => (
                <div key={half.title}>
                  <p className={css.label}>
                    {half.title} <Link href="/market/quotes">Все →</Link>
                  </p>
                  <table className={css.table}>
                    <thead>
                      <tr>
                        <th scope="col">Тикер</th>
                        <th scope="col">Цена</th>
                        <th scope="col">Изм.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {half.rows.slice(0, 6).map((item) => (
                        <tr key={item.ticker}>
                          <th scope="row">
                            <Link href={item.href} title={item.name}>
                              {item.ticker}
                            </Link>
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
              ))}
            </div>

            <div className={`${css.cell} ${css.feed}`}>
              <p className={css.label}>
                Новости <Link href="/news">Все →</Link>
              </p>
              <ol>
                {feed.map((item, i) => (
                  <li key={item.slug}>
                    <span className={css.feedN}>{String(i + 1).padStart(2, "0")}</span>
                    <Link href={`/news/${item.slug}`}>
                      {item.title}
                      <small>{longDate(item.date)}</small>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ——— Услуги ——— */}
          <section className={css.section}>
            <h2 className={css.h2} data-reveal>
              <span>A</span> Услуги биржи
            </h2>
            <div className={css.services} data-stagger>
              {services.map((item, i) => (
                <Link key={item.title} href={item.href} className={css.service} {...linkProps(item.href)}>
                  <span className={css.serviceN}>0{i + 1}</span>
                  <b>{item.title}</b>
                  <span>{item.text}</span>
                  <span className={css.arrow} aria-hidden="true">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* ——— Новости с фото ——— */}
          {data.news.length ? (
            <section className={css.section}>
              <h2 className={css.h2} data-reveal>
                <span>B</span> Пресс-центр
              </h2>
              <div className={css.news} data-stagger>
                {data.news.slice(0, 3).map((item, i) => (
                  <Link key={item.slug} href={`/news/${item.slug}`} className={css.newsCard}>
                    <span className={css.newsPhoto}>
                      <Image src={item.photo} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" />
                      <span className={css.newsN}>{String(i + 1).padStart(2, "0")}</span>
                    </span>
                    <small>
                      {longDate(item.date)} — {item.tag}
                    </small>
                    <b>{item.title}</b>
                    <span>{item.excerpt}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* ——— Призыв ——— */}
          <section className={css.cta} data-reveal>
            <div>
              <p className={css.label}>
                <span>C</span> Инвесторам
              </p>
              <h2>
                Первая сделка —<br />
                через брокера.
              </h2>
            </div>
            <ol className={css.steps}>
              <li>
                <b>1</b> Выберите участника торгов
              </li>
              <li>
                <b>2</b> Откройте счёт по паспорту
              </li>
              <li>
                <b>3</b> Подайте заявку на покупку
              </li>
            </ol>
            <Link href="/members" className={css.ctaBtn}>
              Список брокеров →
            </Link>
          </section>
        </main>

        <footer className={css.footer}>
          <div className={css.wrap}>
            <div>
              <span className={css.logoBox} aria-hidden="true">
                КФБ
              </span>
            </div>
            <div>
              <p className={css.label}>Адрес</p>
              <p>{address}</p>
            </div>
            <div>
              <p className={css.label}>Связь</p>
              {phones.slice(0, 2).map((phone) => (
                <p key={phone}>
                  <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>
                </p>
              ))}
              <p>
                <a href={`mailto:${email}`}>{email}</a>
              </p>
            </div>
            <div>
              <p className={css.label}>Разделы</p>
              {nav.map((item) => (
                <p key={item.label}>
                  <Link href={item.href}>{item.label}</Link>
                </p>
              ))}
            </div>
            <p className={css.copy}>
              {data.contacts.copyright}
              {data.contacts.license ? ` · Лицензия ${data.contacts.license}` : ""}
            </p>
          </div>
        </footer>

        <ConceptSwitch current="modul" />
      </div>
    </ConceptPage>
  );
}
