import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { dateKey, linkProps, longDate, nav, num, pct } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import { Icon, type IconName } from "../_shared/Icon";
import css from "./vestnik.module.css";

/*
 * Концепция 48 — «Вестник»: по мотивам сайта Японской биржи (JPX). Строгий информационный портал: тонкая служебная
 * полоса с датой и статусом сессии, срочное объявление, тёмная полоса с названием и тремя «входами» по аудиториям
 * (инвесторам, компаниям, участникам торгов) со списками ссылок, затем лента уведомлений с рубриками и боковая
 * колонка с рынком и аукционами, ниже — статистика и карта сайта. Цвета и шрифты основного сайта.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "48 · Вестник" };

const audiences: { title: string; icon: IconName; links: { label: string; href: string }[] }[] = [
  {
    title: "Инвесторам",
    icon: "wallet",
    links: [
      { label: "Как начать инвестировать", href: "/investors" },
      { label: "Котировки ценных бумаг", href: "/market/quotes" },
      { label: "Инвестиции в ГЦБ", href: "/gcb/invest" },
      { label: "Учебный центр", href: EDU_URL },
    ],
  },
  {
    title: "Компаниям",
    icon: "building",
    links: [
      { label: "Листинг ценных бумаг", href: "/listing" },
      { label: "Раскрытие информации", href: "/disclosure" },
      { label: "Правила и документы", href: "/documents" },
      { label: "Тарифы", href: "/tariffs" },
    ],
  },
  {
    title: "Участникам торгов",
    icon: "users",
    links: [
      { label: "Список участников", href: "/members" },
      { label: "Рейтинг участников", href: "/members/rating" },
      { label: "Итоги торгов", href: "/market" },
      { label: "Архив торгов", href: "/market/archive" },
    ],
  },
];

const stats: { label: string; text: string; href: string; icon: IconName }[] = [
  { label: "Итоги торгов", text: "Объёмы по рынкам и сделки за день, неделю, месяц и год", href: "/market", icon: "chart" },
  { label: "Индекс KSE", text: "Значение, динамика и капитализация рынка", href: "/market/index", icon: "chart" },
  { label: "Архив торгов", text: "Сделки и котировки за прошлые периоды", href: "/market/archive", icon: "clock" },
  { label: "Объём ГЦБ", text: "Размещение государственных ценных бумаг", href: "/gcb/volume", icon: "bank" },
];

export default async function VestnikConcept() {
  const data = await loadHomeData();
  const urgent = data.urgent[0];
  // Лента уведомлений: новости биржи и сообщения эмитентов вместе, новые сверху.
  const feed = [
    ...data.news.map((item) => ({ slug: item.slug, date: item.date, title: item.title, tag: "Биржа", company: "" })),
    ...data.companyNews.map((item) => ({ slug: item.slug, date: item.date, title: item.title, tag: "Эмитенты", company: item.company })),
  ]
    .sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)))
    .slice(0, 8);
  const volumeK = data.volume.volumeMln < 1;
  const today = new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Bishkek", day: "numeric", month: "long", year: "numeric", weekday: "long" }).format(new Date());

  return (
    <ConceptPage accent="#57b6c0">
      <div className={css.page}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        {/* Служебная полоса. */}
        <div className={css.topbar}>
          <div className={css.wrap}>
            <span>{today}</span>
            <span className={css.status} data-open={data.session.open || undefined}>
              <i aria-hidden="true" />
              {data.session.label} · {data.session.hours}
            </span>
            <span className={css.topLinks}>
              <Link href="/contacts">Контакты</Link>
              <Link href="/login">Вход для сотрудников</Link>
            </span>
          </div>
        </div>

        <header className={css.header}>
          <div className={`${css.wrap} ${css.headInner}`}>
            <Link href="/design-concepts/vestnik" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={44} height={42} priority />
              <span>
                <b>Кыргызская фондовая биржа</b>
                <small>Официальный портал рынка ценных бумаг</small>
              </span>
            </Link>
            <form action="/search" className={css.search} role="search">
              <input type="search" name="q" placeholder="Поиск" aria-label="Поиск по сайту" />
              <button type="submit" aria-label="Найти">
                <Icon name="search" />
              </button>
            </form>
          </div>
          <nav className={css.nav} aria-label="Основное меню">
            <div className={css.wrap}>
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>

        <main id="main">
          {urgent ? (
            <div className={css.wrap}>
              <Link href={`/news/${urgent.slug}`} className={css.urgent}>
                <em>Важно</em>
                <time>{urgent.date}</time>
                <b>{urgent.title}</b>
                <Icon name="arrowRight" />
              </Link>
            </div>
          ) : null}

          {/* Полоса с названием и входами по аудиториям. */}
          <section className={css.hero} aria-labelledby="vs-hero">
            <div className={`${css.wrap} ${css.heroInner}`}>
              <div className={css.heroText} data-intro="rise">
                <h1 id="vs-hero">Рынок ценных бумаг Кыргызстана</h1>
                <p>Торги, листинг и раскрытие информации эмитентов. Официальные данные биржи — открыто для всех.</p>
              </div>
              <div className={css.audiences} data-stagger="">
                {audiences.map((group) => (
                  <div key={group.title} className={css.audience}>
                    <h2>
                      <span>
                        <Icon name={group.icon} />
                      </span>
                      {group.title}
                    </h2>
                    <ul>
                      {group.links.map((link) => (
                        <li key={link.href}>
                          <Link href={link.href} {...linkProps(link.href)}>
                            {link.label}
                            <Icon name="arrowRight" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Лента уведомлений и боковая колонка. */}
          <div className={`${css.wrap} ${css.columns}`}>
            <section className={css.feedBox} aria-labelledby="vs-feed" data-reveal="rise">
              <div className={css.boxHead}>
                <h2 id="vs-feed">Уведомления и новости</h2>
                <nav className={css.rubrics} aria-label="Рубрики">
                  <Link href="/news" aria-current="page">
                    Все
                  </Link>
                  <Link href="/news">Биржа</Link>
                  <Link href="/disclosure">Эмитенты</Link>
                  <Link href="/gcb">ГЦБ</Link>
                </nav>
              </div>
              <ul className={css.feed}>
                {feed.map((item) => (
                  <li key={item.tag + item.slug}>
                    <time>{longDate(item.date)}</time>
                    <span className={css.tag} data-kind={item.tag === "Эмитенты" ? "issuer" : undefined}>
                      {item.tag}
                    </span>
                    <Link href={`/news/${item.slug}`}>
                      {item.company ? <small>{item.company}</small> : null}
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/news" className={css.more}>
                Все уведомления <Icon name="arrowRight" />
              </Link>
            </section>

            <aside className={css.side} aria-label="Рынок">
              <section className={css.sideBox} data-reveal="rise">
                <h2>Рынок</h2>
                <dl className={css.market}>
                  <div>
                    <dt>Индекс KSE</dt>
                    <dd>
                      {num(data.index.value, 2)}
                      <small data-up={data.index.change > 0 || undefined} data-down={data.index.change < 0 || undefined}>
                        {pct(data.index.change)}
                      </small>
                    </dd>
                  </div>
                  <div>
                    <dt>Объём торгов</dt>
                    <dd>
                      {volumeK ? num(data.volume.volumeMln * 1000) : num(data.volume.volumeMln, 1)}
                      <small>{volumeK ? "тыс. сом" : "млн сом"}</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Капитализация</dt>
                    <dd>
                      {num(data.index.capitalization, 1)}
                      <small>млрд сом</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Сделок</dt>
                    <dd>{num(data.volume.trades)}</dd>
                  </div>
                </dl>
                <Link href="/market" className={css.more}>
                  Итоги торгов <Icon name="arrowRight" />
                </Link>
              </section>

              {data.auctions.length ? (
                <section className={css.sideBox} data-reveal="rise">
                  <h2>Аукционы ГЦБ</h2>
                  <ul className={css.auctions}>
                    {data.auctions.slice(0, 3).map((row) => (
                      <li key={row.date + row.type}>
                        <time>{longDate(row.date)}</time>
                        <b>{row.type}</b>
                        <small>
                          {row.volume ? `${row.volume} · ` : ""}
                          {row.status || "Запланирован"}
                        </small>
                      </li>
                    ))}
                  </ul>
                  <Link href="/gcb" className={css.more}>
                    Календарь <Icon name="arrowRight" />
                  </Link>
                </section>
              ) : null}
            </aside>
          </div>

          {/* Статистика. */}
          <section className={css.wrap} aria-labelledby="vs-stats">
            <h2 id="vs-stats" className={css.sectionTitle}>
              Статистика рынка
            </h2>
            <div className={css.stats} data-stagger="">
              {stats.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Icon name={item.icon} />
                  <b>{item.label}</b>
                  <span>{item.text}</span>
                </Link>
              ))}
            </div>
          </section>
        </main>

        {/* Карта сайта в подвале. */}
        <footer className={css.footer}>
          <div className={`${css.wrap} ${css.sitemap}`}>
            {audiences.map((group) => (
              <div key={group.title}>
                <h3>{group.title}</h3>
                {group.links.map((link) => (
                  <Link key={link.href} href={link.href} {...linkProps(link.href)}>
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
            <div>
              <h3>Биржа</h3>
              <Link href="/about">О бирже</Link>
              <Link href="/about/management">Руководство</Link>
              <Link href="/news">Новости</Link>
              <Link href="/contacts">Контакты</Link>
            </div>
          </div>
          <div className={`${css.wrap} ${css.footBottom}`}>
            <span>
              {data.contacts.address} · {data.contacts.phones[0]}
            </span>
            <span>{data.contacts.copyright}</span>
          </div>
        </footer>

        <ConceptSwitch current="vestnik" />
      </div>
    </ConceptPage>
  );
}
