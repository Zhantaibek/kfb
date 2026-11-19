import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { IBM_Plex_Sans } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import { Icon } from "../_shared/Icon";
import { pickNewsPhotos } from "../_shared/news-photos";
import css from "./portal.module.css";

/*
 * Концепция 35 — «Портал»: устройство сайтов мировых бирж (по мотивам lseg.com и nasdaq.com) в фирменной бирюзе КФБ.
 * Служебная полоса со статусом сессии и индексом, строгая шапка, первый экран: фото с заголовком слева и виджет
 * рынка справа, лента бумаг, разделы для аудиторий с фото, данные рынка и аукционы ГЦБ, новости с главной темой.
 */
const plex = IBM_Plex_Sans({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--pt-font" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "35 · Портал" };

const audiences = [
  {
    title: "Инвесторам",
    photo: "/hub/hub-market.jpg",
    links: [
      { label: "Как начать инвестировать", href: "/members" },
      { label: "Котировки и итоги торгов", href: "/market/quotes" },
      { label: "Государственные ценные бумаги", href: "/gcb" },
    ],
  },
  {
    title: "Эмитентам",
    photo: "/hub/hub-listing.jpg",
    links: [
      { label: "Листинг акций и облигаций", href: "/listing" },
      { label: "Раскрытие информации", href: "/disclosure" },
      { label: "Документы и тарифы", href: "/documents" },
    ],
  },
  {
    title: "Участникам торгов",
    photo: "/hub/hub-members.jpg",
    links: [
      { label: "Список участников", href: "/members" },
      { label: "Правила торгов", href: "/documents" },
      { label: "Обучение специалистов", href: EDU_URL },
    ],
  },
];

export default async function PortalConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const news = data.news.slice(0, 4);
  const photos = pickNewsPhotos(news);
  const [lead, ...rest] = news;

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${plex.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        {/* Служебная полоса. */}
        <div className={css.utility}>
          <div className={css.wrap}>
            <p>
              <i data-open={data.session.open || undefined} aria-hidden="true" />
              {data.session.label} · {data.session.clock} Бишкек
              <span>
                Индекс KSE <b>{num(data.index.value, 2)}</b> <em className={data.index.change >= 0 ? css.up : css.down}>{pct(data.index.change)}</em>
              </span>
            </p>
            <nav aria-label="Служебное меню">
              <Link href="/members">Участникам торгов</Link>
              <Link href="/documents">Документы</Link>
              <Link href="/contacts">Контакты</Link>
              <span>RU</span>
            </nav>
          </div>
        </div>

        <header className={css.header}>
          <div className={css.wrap}>
            <Link href="/design-concepts/portal" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={38} height={36} priority />
              <span>
                <b>Кыргызская фондовая биржа</b>
                <small>Kyrgyz Stock Exchange</small>
              </span>
            </Link>
            <nav className={css.nav} aria-label="Основное меню">
              <Link href="/market">Рынок</Link>
              <Link href="/members">Инвесторам</Link>
              <Link href="/listing">Эмитентам</Link>
              <Link href="/gcb">ГЦБ</Link>
              <Link href="/disclosure">Раскрытие</Link>
              <Link href="/about">О бирже</Link>
            </nav>
            <Link href="/search" className={css.searchBtn} aria-label="Поиск по сайту">
              <Icon name="search" />
            </Link>
          </div>
        </header>

        <main id="main">
          {/* 1. Первый экран: фото с заголовком и виджет рынка. */}
          <section className={css.hero} aria-labelledby="pt-hero">
            <div className={css.wrap}>
              <div className={css.heroPanel} data-intro="fade">
                <Image src="/hero/market-charts.jpg" alt="" fill priority sizes="(max-width: 1000px) 100vw, 60vw" />
                <div className={css.heroText}>
                  <p className={css.kicker}>Биржевая инфраструктура с 1994 года</p>
                  <h1 id="pt-hero" data-intro="rise" style={{ "--kc-d": "80ms" } as CSSProperties}>
                    Надёжная инфраструктура рынка ценных бумаг Кыргызстана
                  </h1>
                  <p>Организованные торги, листинг, раскрытие информации и размещение государственных ценных бумаг.</p>
                  <div className={css.heroActions}>
                    <Link href="/market" className={css.btn}>
                      Данные рынка
                    </Link>
                    <Link href="/listing" className={css.btnOutline}>
                      Выйти на биржу
                    </Link>
                  </div>
                </div>
              </div>

              <aside className={css.widget} aria-labelledby="pt-widget" data-intro="rise" style={{ "--kc-d": "160ms" } as CSSProperties}>
                <div className={css.widgetHead}>
                  <h2 id="pt-widget">Рынок</h2>
                  <span>Сессия {longDate(data.session.date)}</span>
                </div>
                <p className={css.widgetTabs} aria-hidden="true">
                  <b>Лидеры по объёму</b>
                  <span>Акции</span>
                  <span>Облигации</span>
                </p>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Бумага</th>
                      <th scope="col">Цена</th>
                      <th scope="col">Изм.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priced.slice(0, 6).map((item) => (
                      <tr key={item.ticker}>
                        <th scope="row">
                          <Link href={item.href}>
                            {item.ticker}
                            <small>{item.name}</small>
                          </Link>
                        </th>
                        <td>{num(item.price, 2)}</td>
                        <td className={item.change > 0 ? css.up : item.change < 0 ? css.down : css.flat}>{item.change ? pct(item.change) : "0,00%"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Link href="/market/quotes" className={css.widgetMore}>
                  Все котировки →
                </Link>
              </aside>
            </div>
          </section>

          {/* 2. Лента бумаг: список повторён дважды для бесшовной прокрутки. */}
          <section className={css.ticker} aria-label="Бумаги последней сессии">
            <ul>
              {[...priced, ...priced].map((item, i) => (
                <li key={`${item.ticker}-${i}`} aria-hidden={i >= priced.length || undefined}>
                  <b>{item.ticker}</b>
                  <span>{num(item.price, 2)}</span>
                  <em className={item.change > 0 ? css.up : item.change < 0 ? css.down : undefined}>{item.change ? pct(item.change) : "0,00%"}</em>
                </li>
              ))}
            </ul>
          </section>

          {/* 3. Аудитории. */}
          <section className={css.section} aria-labelledby="pt-aud">
            <div className={css.wrap}>
              <h2 id="pt-aud" className={css.h2}>
                Наши услуги
              </h2>
              <ul className={css.audiences} data-stagger>
                {audiences.map((item) => (
                  <li key={item.title}>
                    <span className={css.audPhoto}>
                      <Image src={item.photo} alt="" fill sizes="(max-width: 900px) 100vw, 380px" />
                    </span>
                    <div>
                      <b>{item.title}</b>
                      <ul>
                        {item.links.map((link) => (
                          <li key={link.label}>
                            <Link href={link.href} {...linkProps(link.href)}>
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 4. Данные рынка. */}
          <section className={`${css.section} ${css.grey}`} aria-labelledby="pt-data">
            <div className={css.wrap}>
              <h2 id="pt-data" className={css.h2}>
                Рынок в цифрах
              </h2>
              <dl className={css.kpis} data-stagger>
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
                  <dt>Объём сессии</dt>
                  <dd>{num(data.volume.volumeMln, 1)}</dd>
                  <small>млн сом · {num(data.volume.trades)} сделок</small>
                </div>
                <div>
                  <dt>Эмитентов</dt>
                  <dd>{num(data.issuers)}</dd>
                  <small>{num(data.listed)} бумаг в листинге</small>
                </div>
              </dl>
              {data.auctions.length ? (
                <div className={css.tableWrap}>
                  <table>
                    <caption>Аукционы государственных ценных бумаг</caption>
                    <thead>
                      <tr>
                        <th scope="col">Дата</th>
                        <th scope="col">Выпуск</th>
                        <th scope="col">Объём</th>
                        <th scope="col">Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.auctions.map((item) => (
                        <tr key={`${item.date}-${item.type}`}>
                          <td>{item.date}</td>
                          <td>{item.type}</td>
                          <td>{item.volume}</td>
                          <td>
                            <span className={css.status}>{item.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Link href="/gcb" className={css.widgetMore}>
                    Календарь аукционов →
                  </Link>
                </div>
              ) : null}
            </div>
          </section>

          {/* 5. Новости: главная тема и список. */}
          {lead ? (
            <section className={css.section} aria-labelledby="pt-news">
              <div className={css.wrap}>
                <div className={css.titleRow}>
                  <h2 id="pt-news" className={css.h2}>
                    Новости и события
                  </h2>
                  <Link href="/news">Все новости →</Link>
                </div>
                <div className={css.newsGrid}>
                  <Link href={`/news/${lead.slug}`} className={css.leadNews}>
                    <span className={css.leadPhoto}>
                      <Image src={photos[0]} alt="" fill sizes="(max-width: 900px) 100vw, 640px" />
                    </span>
                    <small>
                      {lead.tag} · {longDate(lead.date)}
                    </small>
                    <b>{lead.title}</b>
                    <span>{lead.excerpt}</span>
                  </Link>
                  <ul className={css.newsList}>
                    {rest.map((item, i) => (
                      <li key={item.slug}>
                        <Link href={`/news/${item.slug}`}>
                          <span className={css.thumb}>
                            <Image src={photos[i + 1]} alt="" fill sizes="140px" />
                          </span>
                          <span>
                            <small>
                              {item.tag} · {longDate(item.date)}
                            </small>
                            <b>{item.title}</b>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}
        </main>

        <footer className={css.footer}>
          <div className={`${css.wrap} ${css.footGrid}`}>
            <div className={css.footBrand}>
              <b>Кыргызская фондовая биржа</b>
              <p>{data.contacts.address}</p>
              <p>{data.contacts.phones.join(", ")}</p>
              {data.contacts.email ? <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a> : null}
            </div>
            <nav aria-label="Рынок">
              <b>Рынок</b>
              <Link href="/market">Итоги торгов</Link>
              <Link href="/market/quotes">Котировки</Link>
              <Link href="/market/index">Индекс KSE</Link>
              <Link href="/gcb">ГЦБ</Link>
            </nav>
            <nav aria-label="Эмитентам">
              <b>Эмитентам</b>
              <Link href="/listing">Листинг</Link>
              <Link href="/disclosure">Раскрытие информации</Link>
              <Link href="/documents">Документы</Link>
            </nav>
            <nav aria-label="О бирже">
              <b>О бирже</b>
              <Link href="/about">О компании</Link>
              <Link href="/news">Новости</Link>
              <Link href="/members">Участники торгов</Link>
              <Link href={EDU_URL} {...linkProps(EDU_URL)}>
                Учебный центр
              </Link>
            </nav>
          </div>
          <p className={`${css.wrap} ${css.legal}`}>
            {data.contacts.copyright}. {data.contacts.license ? `Лицензия ${data.contacts.license}. ` : ""}Информация на сайте не является инвестиционной рекомендацией.
          </p>
        </footer>
        <ConceptSwitch current="portal" />
      </div>
    </ConceptPage>
  );
}
