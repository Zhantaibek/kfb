import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { EDU_URL } from "@/lib/edu";
import { loadPublicContent } from "@/lib/cms/public";
import { loadArchiveLatest, type ArchiveNews } from "@/lib/kse-live";
import { loadMarketData } from "@/lib/market-data";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { dateKey, linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import { Tabs } from "../_shared/Tabs";
import { Burger, HeroSlider, MarketChart, ThemeToggle, type Slide } from "./Interactive";
import css from "./kanon.module.css";

/*
 * Концепция 64 — «Канон». Строгий вариант, в котором собрано всё, что видно на текущей главной:
 * бегущая лента бумаг, шапка со всеми разделами, слайдер на 4 слайда, полоса цифр, «Наши услуги»,
 * блок рынка (меню, итоги торгов, график индекса и капитализации, сделки дня, лидеры недели, «Рынки» с вкладками),
 * котировки и аукционы ГЦБ, новости с вкладками, «Как начать инвестировать», партнёры, срочное объявление и подвал.
 * Палитра — тёмно-синий, белый и приглушённое золото; первый экран поделён на текст и фото. Шрифты сайта, данные — те же источники, что у главной.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "64 · Канон" };

const nav = [
  { label: "О Бирже", href: "/about" },
  { label: "Листинг", href: "/listing" },
  { label: "Статистика торгов", href: "/statistics" },
  { label: "Центр раскрытия информации", href: "/disclosure" },
  { label: "Сектор устойчивого развития", href: "/sustainable" },
  { label: "Инвестиции в ГЦБ", href: "/gcb" },
  { label: "Учебный центр", href: EDU_URL },
];

const slides: Slide[] = [
  {
    title: "Инвестиции в стабильное будущее",
    text: "Кыргызская фондовая биржа — это прозрачный и надежный механизм для привлечения капитала, развития бизнеса и роста экономики страны.",
    photo: "/carousel/city.jpg",
    primary: { label: "Торговать", href: "/market" },
    secondary: { label: "Подробнее", href: "/about" },
  },
  {
    title: "Как начать инвестировать",
    text: "Частному инвестору нужен счёт у участника торгов. Дальше — выбор акций, облигаций, ГЦБ или драгоценных металлов.",
    photo: "/carousel/phone.jpg",
    primary: { label: "Выбрать брокера", href: "/members" },
    secondary: { label: "Инвестируйте в ГЦБ", href: "/gcb" },
  },
  {
    title: "Итоги торгов",
    text: "Объём торгов по рынкам и сделки по ценным бумагам: последний торговый день, неделя, месяц и год.",
    photo: "/carousel/trading.jpg",
    primary: { label: "Смотреть итоги", href: "/market" },
    secondary: { label: "Все котировки", href: "/market/quotes" },
  },
  {
    title: "Листинг и раскрытие информации",
    text: "Официальный список ценных бумаг, допущенных к торгам на Кыргызской фондовой бирже.",
    photo: "/landing/sust-service-img-3.jpg",
    primary: { label: "Листинг", href: "/listing" },
    secondary: { label: "Центр раскрытия информации", href: "/disclosure" },
  },
];

const services = [
  { n: "01", title: "Организация торгов", text: "Биржевые торги акциями, облигациями и другими ценными бумагами.", href: "/market", photo: "/carousel/meeting.jpg" },
  { n: "02", title: "Листинг", text: "Включение компаний в биржевой список и сопровождение эмитентов.", href: "/listing", photo: "/landing/sust-service-img-2.jpg" },
  { n: "03", title: "Аукционы ГЦБ", text: "Размещение и обращение государственных ценных бумаг и депозитов.", href: "/gcb", photo: "/hub/hub-gcb.jpg" },
  { n: "04", title: "Товарно-сырьевой сектор", text: "Торги драгоценными металлами и биржевыми товарами.", href: "https://ts.kse.kg/", photo: "/carousel/gold.jpg" },
  { n: "05", title: "Раскрытие информации", text: "Публикация отчётов и существенных фактов эмитентов.", href: "/disclosure", photo: "/landing/sust-service-img-1.jpg" },
  { n: "06", title: "Учебный центр", text: "Курсы и семинары по рынку ценных бумаг для специалистов и инвесторов.", href: EDU_URL, photo: "/landing/sust-process-img-1.jpg" },
];

const marketMenu = [
  { label: "Обзор", href: "/market" },
  { label: "Акции", href: "/market/quotes" },
  { label: "Облигации", href: "/gcb" },
  { label: "Драгметаллы", href: "/market/metals" },
  { label: "Архив торгов", href: "/market/archive" },
  { label: "Индексы", href: "/market/index" },
];

const steps = [
  { title: "Выберите брокера", text: "Сделки на бирже заключаются только через лицензированных участников торгов.", link: "Участники торгов", href: "/members" },
  { title: "Разберитесь в основах", text: "Курсы учебного центра объяснят, как устроен рынок ценных бумаг.", link: "Учебный центр", href: EDU_URL },
  { title: "Выберите инструменты", text: "Акции, облигации, ГЦБ и драгоценные металлы — котировки по каждой бумаге.", link: "Котировки", href: "/market/quotes" },
  { title: "Подайте заявку", text: "Поручите брокеру купить или продать бумаги — сделка пройдёт на торговой сессии.", link: "Итоги торгов", href: "/market" },
];

const marketTabs = [
  { label: "Все", types: ["stock", "bond", "gcb", "metal"] },
  { label: "Акции", types: ["stock"] },
  { label: "Облигации", types: ["bond", "gcb"] },
  { label: "Драгметаллы", types: ["metal"] },
] as const;

const typeName = { stock: "акция", bond: "облигация", gcb: "ГЦБ", metal: "металл" } as const;

type FeedItem = { key: string; date: string; title: string; href: string; external: boolean; photo?: string; company?: string };

function Delta({ value }: { value: number }) {
  return (
    <span className={css.delta} data-dir={value > 0 ? "up" : value < 0 ? "down" : undefined}>
      {pct(value)}
    </span>
  );
}

function fromArchive(item: ArchiveNews): FeedItem {
  return {
    key: `a-${item.slug}`,
    date: item.date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3.$2.$1"),
    title: item.title,
    href: item.url,
    external: true,
    company: item.company || undefined,
  };
}

function Feed({ items }: { items: FeedItem[] }) {
  if (!items.length) return <p className={css.muted}>Пока нет публикаций.</p>;
  return (
    <ul className={css.feed}>
      {items.map((item) => (
        <li key={item.key}>
          <Link href={item.href} {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            <span className={css.feedIcon} aria-hidden="true">
              {item.photo ? <Image src={item.photo} alt="" fill sizes="80px" /> : <i />}
            </span>
            <span>
              <small>
                {longDate(item.date)}
                {item.company ? ` · ${item.company}` : ""}
              </small>
              <b>{item.title}</b>
            </span>
            <em aria-hidden="true">↗</em>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function KanonConcept() {
  const [data, market, content, archiveAll] = await Promise.all([loadHomeData(), loadMarketData(), loadPublicContent(), loadArchiveLatest()]);
  const archive = archiveAll.ru;
  const settings = content.settings;
  const all = data.instruments;
  const priced = all.filter((item) => item.price > 0);
  const sessionShort = data.session.date || "";
  const phones = data.contacts.phones.length ? data.contacts.phones : ["+996 312 31 14 84", "+996 551 31 14 84"];
  const address = data.contacts.address || "720010, Кыргызская Республика, г. Бишкек, ул. Московская, 172";
  const email = data.contacts.email || "office@kse.kg";
  const tagline =
    data.tagline ||
    "Кыргызская фондовая биржа основана в 1994 году. Первые торги акциями прошли в мае 1995 года, а с июля 1995 года биржа рассчитывает Индекс КФБ — важнейший показатель деловой активности на рынке ценных бумаг.";
  const maxLeader = Math.max(1, ...data.leaders.map((row) => row.volume));
  const kinds = [
    { label: "Акции", count: all.filter((i) => i.type === "stock").length },
    { label: "Облигации", count: all.filter((i) => i.type === "bond").length },
    { label: "ГЦБ", count: all.filter((i) => i.type === "gcb").length },
    { label: "Драгметаллы", count: all.filter((i) => i.type === "metal").length },
  ];
  const byDate = (a: FeedItem, b: FeedItem) => dateKey(b.date).localeCompare(dateKey(a.date));

  // Новости: «Главное» — первая новость с фото, остальные смешаны с архивом старого сайта по дате, как на главной.
  const [lead, ...restNews] = data.news;
  const exchangeFeed = [
    ...restNews.map((n) => ({ key: n.slug, date: n.date, title: n.title, href: `/news/${n.slug}`, external: false, photo: n.photo })),
    ...archive.exchange.map(fromArchive),
  ]
    .sort(byDate)
    .slice(0, 8);
  const companyFeed = [
    ...data.companyNews.map((n) => ({ key: n.slug, date: n.date, title: n.title, href: `/news/${n.slug}`, external: false, photo: n.photo, company: n.company })),
    ...archive.company.map(fromArchive),
  ]
    .sort(byDate)
    .slice(0, 8);
  const urgent = [
    ...data.urgent.map((u) => ({ key: u.slug, date: u.date, title: u.title, href: `/news/${u.slug}`, external: false })),
    ...archive.urgent.map(fromArchive),
  ]
    .sort(byDate)
    .slice(0, 3);
  const socials = [
    { label: "Facebook", href: settings.facebookUrl },
    { label: "Instagram", href: settings.instagramUrl },
    { label: "Telegram", href: settings.telegramUrl },
  ].filter((s) => s.href);

  return (
    <ConceptPage accent="#1c3d6e">
      <div className={css.page} id="kanon-root" data-theme="light">
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        {/* ——— 1. Бегущая лента бумаг ——— */}
        <div className={css.tape} aria-label="Котировки последней сессии">
          <div className={css.tapeTrack}>
            {[...priced, ...priced].map((item, i) => (
              <Link key={`${item.ticker}-${i}`} href={item.href} aria-hidden={i >= priced.length || undefined} tabIndex={i >= priced.length ? -1 : undefined}>
                <b>{item.ticker}</b> {num(item.price, 2)}
                {item.volume ? <small>{num(item.volume, 2)}</small> : null}
              </Link>
            ))}
          </div>
        </div>

        {/* ——— 2. Шапка ——— */}
        <header className={css.header}>
          <div className={css.wrap}>
            <Link href="/design-concepts/kanon" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={52} height={49} priority />
              <span>
                Кыргызская
                <br />
                фондовая биржа
              </span>
            </Link>
            <nav aria-label="Основные разделы" className={css.nav}>
              {nav.map((item) => (
                <Link key={item.label} href={item.href} {...linkProps(item.href)}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className={css.tools}>
              <span className={css.lang}>RU</span>
              <Link href="/search" className={css.iconBtn} aria-label="Поиск">
                ⌕
              </Link>
              <ThemeToggle />
              <Link href="/login" className={css.btn}>
                Войти
              </Link>
              <Burger>
                <nav aria-label="Все разделы" className={css.drawerNav}>
                  {nav.map((item) => (
                    <Link key={item.label} href={item.href} {...linkProps(item.href)}>
                      {item.label}
                    </Link>
                  ))}
                  <Link href="/news">Новости</Link>
                  <Link href="/members">Участники торгов</Link>
                  <Link href="/contacts">Контакты</Link>
                </nav>
              </Burger>
            </div>
          </div>
        </header>

        <main id="main">
          {/* ——— 3. Слайдер ——— */}
          <HeroSlider slides={slides} />

          {/* ——— 4. Полоса цифр ——— */}
          <section className={css.stats} aria-label="Рынок сегодня">
            <div className={css.wrap}>
              <Link href="/market/index">
                <small>Индекс KSE</small>
                <span>
                  <b>{num(data.index.value, 2)}</b>
                  <Delta value={data.index.change} />
                </span>
              </Link>
              <Link href="/market/index">
                <small>Капитализация</small>
                <span>
                  <b>{num(data.index.capitalization, 1)}</b>
                  <i>млрд сом</i>
                </span>
              </Link>
              <Link href="/market">
                <small>Объём торгов</small>
                <span>
                  <b>{num(data.volume.volumeMln, 4)}</b>
                  <i>млн сом</i>
                  <Delta value={data.volume.volumeChange} />
                </span>
              </Link>
              <Link href="/market/quotes">
                <small>Инструменты</small>
                <span>
                  <b>{data.quotes.total}</b>
                  <i>{num(data.volume.trades)} сделок</i>
                </span>
              </Link>
            </div>
          </section>

          <div className={css.wrap}>
            {/* ——— 5. Наши услуги ——— */}
            <section className={css.section}>
              <h2 className={css.h2} data-reveal>
                Наши услуги
              </h2>
              <div className={css.services} data-stagger>
                {services.map((s) => (
                  <Link key={s.title} href={s.href} className={css.service} {...linkProps(s.href)}>
                    <span className={css.servicePhoto}>
                      <Image src={s.photo} alt="" fill sizes="(max-width: 700px) 100vw, (max-width: 1600px) 33vw, 16vw" />
                    </span>
                    <small>{s.n}</small>
                    <b>{s.title}</b>
                    <span>{s.text}</span>
                    <i aria-hidden="true">→</i>
                  </Link>
                ))}
              </div>
            </section>

            {/* ——— 6. Рынок ——— */}
            <section className={`${css.section} ${css.market}`} aria-label="Рынок">
              <aside className={css.marketSide}>
                <nav aria-label="Разделы рынка" className={css.marketMenu}>
                  {marketMenu.map((m, i) => (
                    <Link key={m.label} href={m.href} aria-current={i === 0 ? "page" : undefined}>
                      {m.label}
                    </Link>
                  ))}
                </nav>
                <div className={css.panel}>
                  <div className={css.panelHead}>
                    <h3>Итоги торгов</h3>
                    <Link href="/market" aria-label="Все итоги торгов">
                      →
                    </Link>
                  </div>
                  <p className={css.muted}>
                    {sessionShort} · {data.session.hours}
                  </p>
                  <dl className={css.results}>
                    {data.tradingRows.map((row) => (
                      <div key={row.label}>
                        <dt>{row.label}</dt>
                        <dd>
                          {num(row.value, 4)} <Delta value={row.change} />
                        </dd>
                      </div>
                    ))}
                    <div>
                      <dt>Индекс KSE</dt>
                      <dd>
                        {num(data.index.value, 2)} <Delta value={data.index.change} />
                      </dd>
                    </div>
                    <div>
                      <dt>Капитализация</dt>
                      <dd>{num(data.index.capitalization, 1)} млрд сом</dd>
                    </div>
                    <div>
                      <dt>Сделок за сессию</dt>
                      <dd>{num(data.volume.trades)}</dd>
                    </div>
                  </dl>
                </div>
              </aside>

              <div className={css.marketMain}>
                {data.indexSeries.length > 1 ? <MarketChart series={data.indexSeries} change={pct(data.index.change)} /> : null}
                <div className={css.panel}>
                  <div className={css.panelHead}>
                    <h3>Рынки</h3>
                    <Link href="/market/quotes" aria-label="Все рынки">
                      →
                    </Link>
                  </div>
                  <Tabs
                    label="Рынки"
                    css={css}
                    tabs={marketTabs.map((t) => {
                      const rows = priced.filter((item) => (t.types as readonly string[]).includes(item.type)).slice(0, 6);
                      return {
                        label: t.label,
                        content: rows.length ? (
                          <table className={css.table}>
                            <thead>
                              <tr>
                                <th scope="col">Инструмент</th>
                                <th scope="col">Цена</th>
                                <th scope="col">Вид</th>
                                <th scope="col">Объём, тыс.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((item) => (
                                <tr key={item.ticker}>
                                  <th scope="row">
                                    <Link href={item.href}>
                                      <b>{item.ticker}</b> <small>{item.issuer || item.name}</small>
                                    </Link>
                                  </th>
                                  <td>{num(item.price, 2)}</td>
                                  <td>{item.description || typeName[item.type]}</td>
                                  <td>{item.volume ? num(item.volume, 2) : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className={css.muted}>В этой секции сделок в сессии не было.</p>
                        ),
                      };
                    })}
                  />
                </div>
              </div>

              <aside className={css.marketAside}>
                <div className={css.panel}>
                  <div className={css.panelHead}>
                    <h3>Сделки {sessionShort}</h3>
                    <Link href="/market" aria-label="Все сделки">
                      →
                    </Link>
                  </div>
                  {market.lastTrades.length ? (
                    <ul className={css.trades}>
                      {market.lastTrades.slice(0, 6).map((t) => (
                        <li key={`${t.ticker}-${t.price}`}>
                          <span className={css.mark} aria-hidden="true">
                            {t.ticker[0]}
                          </span>
                          <b>{t.ticker}</b>
                          <span>{num(t.price, 2)} сом</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={css.muted}>Сделок в последней сессии не было.</p>
                  )}
                </div>
                <div className={css.panel}>
                  <div className={css.panelHead}>
                    <h3>Лидеры недели по объёму, тыс. сом</h3>
                    <Link href="/market" aria-label="Итоги недели">
                      →
                    </Link>
                  </div>
                  <ol className={css.leaders}>
                    {data.leaders.map((row) => (
                      <li key={row.ticker}>
                        <span>
                          <span className={css.mark} aria-hidden="true">
                            {row.ticker[0]}
                          </span>
                          <b>{row.ticker}</b>
                          <em>{num(row.volume, 2)}</em>
                        </span>
                        <i style={{ "--w": `${(row.volume / maxLeader) * 100}%` } as CSSProperties} aria-hidden="true" />
                      </li>
                    ))}
                  </ol>
                  <dl className={css.week}>
                    <div>
                      <dt>Итого за неделю, тыс. сом</dt>
                      <dd>{num(market.weekTotal.volume, 2)}</dd>
                    </div>
                    <div>
                      <dt>Сделок</dt>
                      <dd>{num(market.weekTotal.deals)}</dd>
                    </div>
                    <div>
                      <dt>Бумаг с объёмом</dt>
                      <dd>{num(market.weekTotal.papers)}</dd>
                    </div>
                  </dl>
                </div>
              </aside>
            </section>

            {/* ——— 7. Котировки и аукционы ГЦБ ——— */}
            <section className={`${css.section} ${css.quotesRow}`}>
              <div className={css.panel} data-reveal>
                <div className={css.panelHead}>
                  <h2 className={css.h3}>Котировки</h2>
                  <Link href="/market/quotes">Все инструменты →</Link>
                </div>
                <table className={css.table}>
                  <thead>
                    <tr>
                      <th scope="col">Тикер</th>
                      <th scope="col">Бумага</th>
                      <th scope="col">Цена</th>
                      <th scope="col">Вид</th>
                      <th scope="col">Объём, тыс.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {all.slice(0, 12).map((item) => (
                      <tr key={item.ticker}>
                        <th scope="row">
                          <Link href={item.href}>
                            <b>{item.ticker}</b>
                          </Link>
                        </th>
                        <td className={css.left}>{item.issuer || item.name}</td>
                        <td>{item.price ? num(item.price, 2) : "—"}</td>
                        <td>{item.description || typeName[item.type]}</td>
                        <td>{item.volume ? num(item.volume, 2) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={css.panel} data-reveal style={{ "--kc-d": "120ms" } as CSSProperties}>
                <div className={css.panelHead}>
                  <h2 className={css.h3}>Аукционы ГЦБ</h2>
                  <Link href="/gcb">Календарь →</Link>
                </div>
                {data.auctions.length ? (
                  <table className={css.table}>
                    <thead>
                      <tr>
                        <th scope="col">Выпуск</th>
                        <th scope="col">Дата</th>
                        <th scope="col">Объём</th>
                        <th scope="col">Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.auctions.map((a) => (
                        <tr key={`${a.date}-${a.type}`}>
                          <th scope="row">
                            <b>{a.type}</b>
                          </th>
                          <td>{a.date}</td>
                          <td>{a.volume}</td>
                          <td>
                            <span className={css.status}>{a.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className={css.muted}>Расписание аукционов публикуется на странице ГЦБ.</p>
                )}
                <div className={css.kinds}>
                  <div className={css.panelHead}>
                    <h3>Инструменты в котировках</h3>
                    <Link href="/market/quotes" aria-label="Все инструменты">
                      →
                    </Link>
                  </div>
                  <dl>
                    {kinds.map((k) => (
                      <div key={k.label}>
                        <dt>{k.label}</dt>
                        <dd>{k.count}</dd>
                      </div>
                    ))}
                    <div className={css.kindsTotal}>
                      <dt>Всего</dt>
                      <dd>{all.length}</dd>
                    </div>
                    <div>
                      <dt>Сделок за сессию</dt>
                      <dd>{num(data.volume.trades)}</dd>
                    </div>
                    <div>
                      <dt>Эмитентов · в листинге</dt>
                      <dd>
                        {data.issuers} · {data.listed}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </section>

            {/* ——— 8. Новости ——— */}
            <section className={css.section}>
              <header className={css.center} data-reveal>
                <p className={css.kicker}>Новости и обновления</p>
                <h2 className={css.h2}>Будьте в курсе последних событий</h2>
                <p className={css.muted}>Объявления площадки, изменения правил и события рынка</p>
              </header>
              <div className={css.news}>
                {lead ? (
                  <Link href={`/news/${lead.slug}`} className={css.lead} data-reveal>
                    <span className={css.leadPhoto}>
                      <Image src={lead.photo} alt="" fill sizes="(max-width: 1100px) 100vw, 50vw" />
                      <span className={css.badge}>Главное</span>
                    </span>
                    <small>{longDate(lead.date)}</small>
                    <b>{lead.title}</b>
                    <span>{lead.excerpt}</span>
                    <em>Читать далее ↗</em>
                  </Link>
                ) : null}
                <div className={css.newsTabs} data-reveal style={{ "--kc-d": "120ms" } as CSSProperties}>
                  <Tabs
                    label="Новости"
                    css={css}
                    tabs={[
                      { label: "Новости биржи", content: <Feed items={exchangeFeed} />, aside: <Link href="/news" className={css.more}>Все новости →</Link> },
                      { label: "Новости компаний", content: <Feed items={companyFeed} />, aside: <Link href="/disclosure" className={css.more}>Все сообщения →</Link> },
                    ]}
                  />
                </div>
              </div>
            </section>

            {/* ——— 9. Как начать инвестировать ——— */}
            <section className={`${css.section} ${css.steps}`} data-reveal>
              <div className={css.stepsHead}>
                <div>
                  <p className={css.kicker}>Первые шаги</p>
                  <h2 className={css.h2}>Как начать инвестировать</h2>
                </div>
                <p>Четыре шага от выбора брокера до первой сделки на бирже</p>
              </div>
              <ol>
                {steps.map((s, i) => (
                  <li key={s.title}>
                    <span className={css.stepN}>{String(i + 1).padStart(2, "0")}</span>
                    <b>{s.title}</b>
                    <span>{s.text}</span>
                    <Link href={s.href} {...linkProps(s.href)}>
                      {s.link} →
                    </Link>
                  </li>
                ))}
              </ol>
            </section>

            {/* ——— 10. Партнёры ——— */}
            {data.partners.length ? (
              <section className={css.section}>
                <div className={css.rowHead} data-reveal>
                  <div>
                    <h2 className={css.h2}>Наши партнеры</h2>
                    <p className={css.muted}>Регуляторы, инфраструктура и биржи-партнёры, с которыми работает КФБ</p>
                  </div>
                  <Link href="/about/partners" className={css.btnLine}>
                    Все партнеры →
                  </Link>
                </div>
                <div className={css.partners} data-stagger>
                  {data.partners.slice(0, 8).map((p) => (
                    <article key={p.slug} className={css.partner}>
                      <div className={css.partnerTop}>
                        <span className={css.partnerLogo} data-wide={p.logoWide ? "" : undefined}>
                          {p.logo ? <Image src={p.logo} alt={p.mark} fill sizes="160px" unoptimized /> : <b>{p.mark}</b>}
                        </span>
                        <span className={css.partnerMark}>
                          <b>{p.mark}</b>
                          <small>{p.caption}</small>
                        </span>
                      </div>
                      <h3>{p.name}</h3>
                      <p>{p.lead}</p>
                      <div className={css.partnerFoot}>
                        <Link href={`/about/partners/${p.slug}`}>Подробнее →</Link>
                        {p.site ? (
                          <a href={p.site.startsWith("http") ? p.site : `https://${p.site}`} target="_blank" rel="noopener noreferrer">
                            {p.site.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
                          </a>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {/* ——— 11. Срочное объявление ——— */}
            {urgent.length ? (
              <section className={`${css.section} ${css.urgent}`} aria-label="Срочное объявление" data-reveal>
                <div className={css.urgentHead}>
                  <span className={css.urgentTag}>
                    <i aria-hidden="true" /> Срочно
                  </span>
                  <h2 className={css.h3}>Срочное объявление</h2>
                </div>
                <ul>
                  {urgent.map((u) => (
                    <li key={u.key}>
                      <time>{u.date}</time>
                      <b>{u.title}</b>
                      <Link href={u.href} {...(u.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                        Подробнее ↗
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </main>

        {/* ——— 12. Подвал ——— */}
        <footer className={css.footer}>
          <div className={css.wrap}>
            <div className={css.footTop}>
              <div className={css.footAbout}>
                <Link href="/design-concepts/kanon" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
                  <Image src="/brand/kse-mark.png" alt="" width={52} height={49} />
                  <span>
                    Кыргызская
                    <br />
                    фондовая биржа
                  </span>
                </Link>
                <p>{tagline}</p>
              </div>
              <div className={css.footIndex}>
                <small>KSE Index</small>
                <b>{num(data.index.value, 2)}</b>
                <Delta value={data.index.change} />
              </div>
            </div>
            <div className={css.footGrid}>
              <div>
                <h3>Контакты</h3>
                {phones.map((phone) => (
                  <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                    {phone}
                  </a>
                ))}
                <a href={`mailto:${email}`}>{email}</a>
                <span>{address}</span>
              </div>
              <div>
                <h3>Разделы</h3>
                {nav.slice(0, 4).map((item) => (
                  <Link key={item.label} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </div>
              <div>
                <h3>Инвесторам</h3>
                {nav.slice(4).map((item) => (
                  <Link key={item.label} href={item.href} {...linkProps(item.href)}>
                    {item.label}
                  </Link>
                ))}
                <Link href="/members">Участники торгов</Link>
              </div>
              <div>
                <h3>Мы в соцсетях</h3>
                {socials.length ? (
                  socials.map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
                      {s.label} ↗
                    </a>
                  ))
                ) : (
                  <span>Ссылки на соцсети задаются в админке</span>
                )}
              </div>
            </div>
            <p className={css.legal}>
              {data.contacts.copyright}
              {data.contacts.license ? ` · Лицензия ${data.contacts.license}` : ""}
            </p>
          </div>
        </footer>

        <ConceptSwitch current="kanon" />
      </div>
    </ConceptPage>
  );
}
