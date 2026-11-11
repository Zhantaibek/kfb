import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, nav, num, pct } from "../_shared/data";
import { loadHomeData, smoothPath, type HomeData } from "../_shared/home-data";
import { Icon, type IconName } from "../_shared/Icon";
import { pickNewsPhotos } from "../_shared/news-photos";
import { Tabs } from "../_shared/Tabs";
import css from "./tablo.module.css";

/*
 * Концепция 47 — «Табло»: по мотивам сайта Варшавской биржи (GPW). Рынок — прямо на первом экране: слева название и
 * быстрые переходы, справа панель с индексом и таблицей котировок по вкладкам. Ниже — полоса итогов сессии,
 * сообщения эмитентов и календарь аукционов, лидеры недели, новости и сетка быстрых ссылок. Плотная, деловая подача;
 * цвета и шрифты основного сайта.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "47 · Табло" };

type Row = HomeData["instruments"][number];

function QuoteTable({ rows }: { rows: Row[] }) {
  if (!rows.length) return <p className={css.empty}>Сделок по этой группе пока нет.</p>;
  return (
    <table className={css.quotes}>
      <thead>
        <tr>
          <th>Бумага</th>
          <th>Цена, сом</th>
          <th>Объём</th>
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 6).map((row) => (
          <tr key={row.ticker}>
            <td>
              <Link href={row.href}>
                <b>{row.ticker}</b>
                <span>{row.name}</span>
              </Link>
            </td>
            <td>{row.price > 0 ? num(row.price, 2) : "—"}</td>
            <td>{row.volume > 0 ? num(row.volume) : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const quick: { label: string; href: string; icon: IconName }[] = [
  { label: "Котировки", href: "/market/quotes", icon: "chart" },
  { label: "Итоги торгов", href: "/market", icon: "file" },
  { label: "Аукционы ГЦБ", href: "/gcb", icon: "bank" },
];

const links: { label: string; href: string; icon: IconName }[] = [
  { label: "Индекс KSE", href: "/market/index", icon: "chart" },
  { label: "Архив торгов", href: "/market/archive", icon: "clock" },
  { label: "Листинг", href: "/listing", icon: "building" },
  { label: "Раскрытие информации", href: "/disclosure", icon: "file" },
  { label: "Участники торгов", href: "/members", icon: "users" },
  { label: "Драгоценные металлы", href: "/commodity", icon: "coin" },
  { label: "Учебный центр", href: EDU_URL, icon: "book" },
  { label: "Контакты", href: "/contacts", icon: "phone" },
];

export default async function TabloConcept() {
  const data = await loadHomeData();
  const chart = smoothPath(data.history, 420, 90, 4);
  const news = data.news.slice(0, 3);
  const photos = pickNewsPhotos(news);
  const topLeader = Math.max(1, ...data.leaders.map((row) => row.volume));
  const up = data.index.change >= 0;
  const feed = data.companyNews.length
    ? data.companyNews.slice(0, 5).map((item) => ({ slug: item.slug, date: item.date, title: item.title, label: item.company }))
    : data.news.slice(0, 5).map((item) => ({ slug: item.slug, date: item.date, title: item.title, label: item.tag }));

  return (
    <ConceptPage accent="#57b6c0">
      <div className={css.page}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <div className={css.headTop}>
            <Link href="/design-concepts/tablo" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={40} height={38} priority />
              <span>
                <b>Кыргызская фондовая биржа</b>
                <small>Kyrgyz Stock Exchange</small>
              </span>
            </Link>
            <form action="/search" className={css.search} role="search">
              <Icon name="search" />
              <input type="search" name="q" placeholder="Тикер, компания или раздел" aria-label="Поиск по сайту" />
            </form>
            <span className={css.session} data-open={data.session.open || undefined}>
              <i aria-hidden="true" />
              {data.session.label}
              <small>{data.session.hours}</small>
            </span>
          </div>
          <nav className={css.nav} aria-label="Основное меню">
            {nav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main id="main">
          {/* Первый экран: слева название и быстрые переходы, справа панель рынка. */}
          <section className={css.hero} aria-labelledby="tb-hero">
            <div className={css.heroText} data-intro="rise">
              <p className={css.kicker}>Рынок ценных бумаг Кыргызстана</p>
              <h1 id="tb-hero">Котировки, итоги торгов и сообщения эмитентов — в одном месте</h1>
              <p className={css.lead}>Акции, облигации, государственные ценные бумаги и драгоценные металлы. Данные обновляются по итогам каждой торговой сессии.</p>
              <div className={css.quick}>
                {quick.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Icon name={item.icon} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className={css.panel} data-intro="fade">
              <div className={css.indexRow}>
                <div>
                  <span>Индекс KSE</span>
                  <b>{num(data.index.value, 2)}</b>
                </div>
                <em data-up={up || undefined} data-down={data.index.change < 0 || undefined}>
                  {pct(data.index.change)}
                </em>
                {chart ? (
                  <svg className={css.spark} viewBox="0 0 420 90" preserveAspectRatio="none" aria-hidden="true">
                    <path d={chart.area} className={css.sparkArea} />
                    <path d={chart.line} className={css.sparkLine} />
                  </svg>
                ) : null}
              </div>
              <Tabs
                css={css}
                label="Котировки"
                tabs={[
                  { label: "Акции", content: <QuoteTable rows={data.quotes.stocks} /> },
                  { label: "Облигации и ГЦБ", content: <QuoteTable rows={data.quotes.bonds} /> },
                  { label: "Металлы", content: <QuoteTable rows={data.quotes.metals} /> },
                ]}
              />
              <Link href="/market/quotes" className={css.panelLink}>
                Все {num(data.quotes.total)} инструментов <Icon name="arrowRight" />
              </Link>
            </div>
          </section>

          {/* Итоги сессии. */}
          {data.tradingRows.length ? (
            <section className={css.wrap} aria-labelledby="tb-session">
              <div className={css.sessionStrip} data-reveal="rise">
                <h2 id="tb-session">
                  Итоги сессии
                  <small>{data.session.date || "последний торговый день"}</small>
                </h2>
                <dl>
                  {data.tradingRows.slice(0, 5).map((row) => (
                    <div key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>
                        {num(row.value, 2)}
                        <small data-up={row.change > 0 || undefined} data-down={row.change < 0 || undefined}>
                          {pct(row.change)}
                        </small>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>
          ) : null}

          {/* Сообщения эмитентов и календарь аукционов. */}
          <section className={`${css.wrap} ${css.twoCols}`} aria-label="Сообщения и календарь">
            <div className={css.block} data-reveal="rise">
              <div className={css.blockHead}>
                <h2>Сообщения эмитентов</h2>
                <Link href="/disclosure">
                  Все <Icon name="arrowRight" />
                </Link>
              </div>
              <ul className={css.feed}>
                {feed.map((item) => (
                  <li key={item.slug}>
                    <time>{longDate(item.date)}</time>
                    <Link href={`/news/${item.slug}`}>
                      {item.label ? <small>{item.label}</small> : null}
                      <b>{item.title}</b>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={css.block} data-reveal="rise">
              <div className={css.blockHead}>
                <h2>Календарь аукционов ГЦБ</h2>
                <Link href="/gcb">
                  Все <Icon name="arrowRight" />
                </Link>
              </div>
              {data.auctions.length ? (
                <ul className={css.calendar}>
                  {data.auctions.map((row) => {
                    const [d, m] = longDate(row.date).split(" ");
                    return (
                      <li key={row.date + row.type}>
                        <span className={css.dateBox}>
                          <b>{d}</b>
                          <small>{m}</small>
                        </span>
                        <span>
                          <b>{row.type}</b>
                          <small>{row.volume ? `Объём ${row.volume}` : "Государственные ценные бумаги"}</small>
                        </span>
                        <em>{row.status || "Запланирован"}</em>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className={css.empty}>Ближайших аукционов нет.</p>
              )}
            </div>
          </section>

          {/* Лидеры недели. */}
          {data.leaders.length ? (
            <section className={css.wrap} aria-labelledby="tb-leaders">
              <div className={css.block} data-reveal="rise">
                <div className={css.blockHead}>
                  <h2 id="tb-leaders">Лидеры недели по объёму, тыс. сом</h2>
                  <Link href="/market/archive">
                    Архив <Icon name="arrowRight" />
                  </Link>
                </div>
                <ol className={css.leaders}>
                  {data.leaders.map((row, i) => (
                    <li key={row.ticker}>
                      <span className={css.rank}>{i + 1}</span>
                      <b>{row.ticker}</b>
                      <span className={css.leaderName}>{row.name}</span>
                      <span className={css.bar}>
                        <i style={{ width: `${Math.max(3, (row.volume / topLeader) * 100)}%` }} />
                      </span>
                      <em>{num(row.volume, 2)}</em>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          ) : null}

          {/* Новости. */}
          {news.length ? (
            <section className={css.wrap} aria-labelledby="tb-news">
              <div className={css.sectionHead}>
                <h2 id="tb-news">Новости биржи</h2>
                <Link href="/news">
                  Все новости <Icon name="arrowRight" />
                </Link>
              </div>
              <div className={css.news} data-stagger="">
                {news.map((item, i) => (
                  <Link key={item.slug} href={`/news/${item.slug}`} className={css.newsCard}>
                    <span className={css.newsPhoto}>
                      <Image src={photos[i]} alt="" fill sizes="(max-width: 900px) 100vw, 400px" />
                    </span>
                    <time>{longDate(item.date)}</time>
                    <b>{item.title}</b>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* Быстрые ссылки. */}
          <section className={css.wrap} aria-labelledby="tb-links">
            <h2 id="tb-links" className={css.sectionTitle}>
              Разделы сайта
            </h2>
            <div className={css.links} data-stagger="">
              {links.map((item) => (
                <Link key={item.href} href={item.href} {...linkProps(item.href)}>
                  <span>
                    <Icon name={item.icon} />
                  </span>
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        </main>

        <footer className={css.footer}>
          <div className={`${css.wrap} ${css.footInner}`}>
            <div>
              <b>Кыргызская фондовая биржа</b>
              <p>{data.contacts.address}</p>
              <p>
                {data.contacts.phones.join(", ")}
                {data.contacts.email ? ` · ${data.contacts.email}` : ""}
              </p>
            </div>
            <nav aria-label="Ссылки подвала">
              <Link href="/about">О бирже</Link>
              <Link href="/documents">Правила и документы</Link>
              <Link href="/tariffs">Тарифы</Link>
              <Link href="/contacts">Контакты</Link>
            </nav>
          </div>
          <p className={`${css.wrap} ${css.legal}`}>
            {data.contacts.copyright}. {data.contacts.license ? `Лицензия ${data.contacts.license}.` : ""}
          </p>
        </footer>

        <ConceptSwitch current="tablo" />
      </div>
    </ConceptPage>
  );
}
