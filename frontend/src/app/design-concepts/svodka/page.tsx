import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Roboto, Roboto_Condensed } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { dateKey, linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import { Icon } from "../_shared/Icon";
import { pickNewsPhotos } from "../_shared/news-photos";
import css from "./svodka.module.css";

/*
 * Концепция 39 — «Сводка»: плотный деловой портал новостей и данных (по мотивам bloomberg.com) в фирменной бирюзе.
 * Чёрная шапка, полоса рынка, главная тема с фото, вторичные материалы, сообщения эмитентов; справа — колонка
 * данных: котировки, лидеры недели, индекс, аукционы ГЦБ. Roboto Condensed в заголовках, Roboto в тексте.
 * Логотип, тексты и изображения Bloomberg не используются.
 */
const cond = Roboto_Condensed({ subsets: ["latin", "cyrillic"], weight: ["500", "700", "800"], variable: "--sv-cond" });
const roboto = Roboto({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "700"], variable: "--sv-text" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "39 · Сводка" };

export default async function SvodkaConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const news = data.news.slice(0, 3);
  const photos = pickNewsPhotos(news);
  const [lead, ...second] = news;
  const chart = smoothPath(data.history, 300, 80, 6);
  // Лента «Последнее»: новости биржи и сообщения эмитентов вместе, свежие сверху.
  const latest = [...data.news.map((item) => ({ ...item, source: item.tag })), ...data.companyNews.map((item) => ({ ...item, source: item.company }))]
    .sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)))
    .slice(0, 8);

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${cond.variable} ${roboto.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <div className={css.wrap}>
            <Link href="/design-concepts/svodka" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
              КФБ<span>Сводка</span>
            </Link>
            <nav className={css.nav} aria-label="Разделы">
              <Link href="/market">Рынки</Link>
              <Link href="/market/quotes">Котировки</Link>
              <Link href="/disclosure">Компании</Link>
              <Link href="/gcb">ГЦБ</Link>
              <Link href="/listing">Листинг</Link>
              <Link href="/news">Новости</Link>
              <Link href="/about">О бирже</Link>
            </nav>
            <Link href="/search" className={css.search} aria-label="Поиск">
              <Icon name="search" />
            </Link>
          </div>
        </header>

        {/* Полоса рынка. */}
        <div className={css.strip}>
          <div className={css.wrap}>
            <Link href="/market/index" className={css.stripIndex}>
              <b>KSE</b>
              <span>{num(data.index.value, 2)}</span>
              <em className={data.index.change >= 0 ? css.up : css.down}>{pct(data.index.change)}</em>
            </Link>
            <ul>
              {priced.slice(0, 6).map((item) => (
                <li key={item.ticker}>
                  <Link href={item.href}>
                    <b>{item.ticker}</b>
                    <span>{num(item.price, 2)}</span>
                    <em className={item.change > 0 ? css.up : item.change < 0 ? css.down : undefined}>{item.change ? pct(item.change) : "0,00%"}</em>
                  </Link>
                </li>
              ))}
            </ul>
            <span className={css.session} data-open={data.session.open || undefined}>
              {data.session.label}
            </span>
          </div>
        </div>

        <main id="main" className={`${css.wrap} ${css.grid}`}>
          {/* Левая часть: материалы. */}
          <div className={css.stories}>
            {lead ? (
              <Link href={`/news/${lead.slug}`} className={css.lead}>
                <span className={css.leadPhoto}>
                  <Image src={photos[0]} alt="" fill priority sizes="(max-width: 1000px) 100vw, 760px" />
                </span>
                <span className={css.leadText}>
                  <small>{lead.tag}</small>
                  <b>{lead.title}</b>
                  <span>{lead.excerpt}</span>
                  <time>{longDate(lead.date)}</time>
                </span>
              </Link>
            ) : null}

            <div className={css.second}>
              {second.map((item, i) => (
                <Link key={item.slug} href={`/news/${item.slug}`} className={css.story}>
                  <span className={css.storyPhoto}>
                    <Image src={photos[i + 1]} alt="" fill sizes="(max-width: 700px) 100vw, 360px" />
                  </span>
                  <small>{item.tag}</small>
                  <b>{item.title}</b>
                  <time>{longDate(item.date)}</time>
                </Link>
              ))}
            </div>

            <section className={css.block} aria-labelledby="sv-latest">
              <h2 id="sv-latest" className={css.blockTitle}>
                Последнее
              </h2>
              <ol className={css.latest}>
                {latest.map((item) => (
                  <li key={item.slug}>
                    <time>{item.date}</time>
                    <Link href={`/news/${item.slug}`}>
                      <small>{item.source}</small>
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ol>
            </section>

            <section className={css.block} aria-labelledby="sv-sections">
              <h2 id="sv-sections" className={css.blockTitle}>
                Разделы биржи
              </h2>
              <ul className={css.sections}>
                <li>
                  <Link href="/members">
                    <b>Инвесторам</b>
                    <span>Как купить ценные бумаги через брокера</span>
                  </Link>
                </li>
                <li>
                  <Link href="/listing">
                    <b>Эмитентам</b>
                    <span>Листинг акций и облигаций</span>
                  </Link>
                </li>
                <li>
                  <Link href="/disclosure">
                    <b>Раскрытие</b>
                    <span>Отчётность {num(data.issuers)} компаний</span>
                  </Link>
                </li>
                <li>
                  <Link href={EDU_URL} {...linkProps(EDU_URL)}>
                    <b>Обучение</b>
                    <span>Курсы учебного центра</span>
                  </Link>
                </li>
              </ul>
            </section>
          </div>

          {/* Правая колонка: данные. */}
          <aside className={css.rail} aria-label="Данные рынка">
            <section className={css.railBox} aria-labelledby="sv-index">
              <h2 id="sv-index" className={css.railTitle}>
                Индекс KSE
              </h2>
              <p className={css.railBig}>
                {num(data.index.value, 2)} <em className={data.index.change >= 0 ? css.up : css.down}>{pct(data.index.change)}</em>
              </p>
              {chart ? (
                <svg viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true">
                  <path d={chart.area} className={css.area} />
                  <path d={chart.line} className={css.line} />
                </svg>
              ) : null}
              <p className={css.railNote}>
                Капитализация {num(data.index.capitalization, 1)} млрд сом · сессия {longDate(data.session.date)}
              </p>
            </section>

            <section className={css.railBox} aria-labelledby="sv-quotes">
              <h2 id="sv-quotes" className={css.railTitle}>
                Котировки
              </h2>
              <table>
                <tbody>
                  {priced.slice(0, 8).map((item) => (
                    <tr key={item.ticker}>
                      <th scope="row">
                        <Link href={item.href}>{item.ticker}</Link>
                      </th>
                      <td>{num(item.price, 2)}</td>
                      <td className={item.change > 0 ? css.up : item.change < 0 ? css.down : css.flat}>{item.change ? pct(item.change) : "0,00%"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Link href="/market/quotes" className={css.railMore}>
                Все котировки →
              </Link>
            </section>

            {data.leaders.length ? (
              <section className={css.railBox} aria-labelledby="sv-leaders">
                <h2 id="sv-leaders" className={css.railTitle}>
                  Лидеры недели
                </h2>
                <table>
                  <tbody>
                    {data.leaders.slice(0, 5).map((row) => (
                      <tr key={row.ticker}>
                        <th scope="row">{row.ticker}</th>
                        <td>{num(row.volume, 1)}</td>
                        <td className={css.flat}>{num(row.deals)} сд.</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className={css.railNote}>Объём, тыс. сом</p>
              </section>
            ) : null}

            {data.auctions.length ? (
              <section className={css.railBox} aria-labelledby="sv-gcb">
                <h2 id="sv-gcb" className={css.railTitle}>
                  Аукционы ГЦБ
                </h2>
                <ul className={css.auctions}>
                  {data.auctions.map((item) => (
                    <li key={`${item.date}-${item.type}`}>
                      <b>{item.date}</b>
                      <span>
                        {item.type} · {item.volume}
                      </span>
                      <small>{item.status}</small>
                    </li>
                  ))}
                </ul>
                <Link href="/gcb" className={css.railMore}>
                  Календарь →
                </Link>
              </section>
            ) : null}
          </aside>
        </main>

        <footer className={css.footer}>
          <div className={css.wrap}>
            <b className={css.footBrand}>
              КФБ<span>Сводка</span>
            </b>
            <nav aria-label="Подвал">
              <Link href="/about">О бирже</Link>
              <Link href="/documents">Документы</Link>
              <Link href="/members">Участники торгов</Link>
              <Link href="/contacts">Контакты</Link>
            </nav>
            <p>
              {data.contacts.copyright}. {data.contacts.address}. {data.contacts.license ? `Лицензия ${data.contacts.license}. ` : ""}Информация не является инвестиционной рекомендацией.
            </p>
          </div>
        </footer>
        <ConceptSwitch current="svodka" />
      </div>
    </ConceptPage>
  );
}
