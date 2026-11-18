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
import { MarketChart, SideToggle, SlideDeck, ThemeToggle, type Slide } from "./Interactive";
import css from "./obzor.module.css";

/*
 * Концепция 65 — «Обзор». Всё содержимое текущей главной в другой раскладке:
 * закреплённая боковая панель (логотип, меню, статус сессии, язык, поиск, тема, вход), срочное объявление полосой сверху,
 * «гармошка» из 4 слайдов вместо слайдера, рынок с вкладками разделов сверху и графиком во всю ширину,
 * услуги нумерованным списком, аукционы карточками над котировками, шаги на линии, стена логотипов партнёров.
 * Палитра — тёплый светлый фон, графит и тёмно-винный акцент. Шрифты сайта, данные — те же источники, что у главной.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "65 · Обзор" };

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
    photo: "/bg/mountains.jpg",
    primary: { label: "Торговать", href: "/market" },
    secondary: { label: "Подробнее", href: "/about" },
  },
  {
    title: "Как начать инвестировать",
    text: "Частному инвестору нужен счёт у участника торгов. Дальше — выбор акций, облигаций, ГЦБ или драгоценных металлов.",
    photo: "/landing/sust-process-img-2.jpg",
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
    photo: "/carousel/office.jpg",
    primary: { label: "Листинг", href: "/listing" },
    secondary: { label: "Центр раскрытия информации", href: "/disclosure" },
  },
];

const services = [
  { title: "Организация торгов", text: "Биржевые торги акциями, облигациями и другими ценными бумагами.", href: "/market", photo: "/carousel/meeting.jpg" },
  { title: "Листинг", text: "Включение компаний в биржевой список и сопровождение эмитентов.", href: "/listing", photo: "/landing/sust-service-img-2.jpg" },
  { title: "Аукционы ГЦБ", text: "Размещение и обращение государственных ценных бумаг и депозитов.", href: "/gcb", photo: "/hub/hub-gcb.jpg" },
  { title: "Товарно-сырьевой сектор", text: "Торги драгоценными металлами и биржевыми товарами.", href: "https://ts.kse.kg/", photo: "/carousel/gold.jpg" },
  { title: "Раскрытие информации", text: "Публикация отчётов и существенных фактов эмитентов.", href: "/disclosure", photo: "/landing/sust-service-img-1.jpg" },
  { title: "Учебный центр", text: "Курсы и семинары по рынку ценных бумаг для специалистов и инвесторов.", href: EDU_URL, photo: "/landing/sust-process-img-1.jpg" },
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

type FeedItem = { key: string; date: string; title: string; href: string; external: boolean; company?: string };

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
    <ol className={css.feed}>
      {items.map((item) => (
        <li key={item.key}>
          <time>{longDate(item.date)}</time>
          <Link href={item.href} {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {item.title}
            {item.company ? <small> · {item.company}</small> : null}
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default async function ObzorConcept() {
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
  const byDate = (a: FeedItem, b: FeedItem) => dateKey(b.date).localeCompare(dateKey(a.date));
  const [lead, ...restNews] = data.news;
  const exchangeFeed = [...restNews.map((n) => ({ key: n.slug, date: n.date, title: n.title, href: `/news/${n.slug}`, external: false })), ...archive.exchange.map(fromArchive)].sort(byDate).slice(0, 8);
  const companyFeed = [
    ...data.companyNews.map((n) => ({ key: n.slug, date: n.date, title: n.title, href: `/news/${n.slug}`, external: false, company: n.company })),
    ...archive.company.map(fromArchive),
  ]
    .sort(byDate)
    .slice(0, 8);
  const urgent = [...data.urgent.map((u) => ({ key: u.slug, date: u.date, title: u.title, href: `/news/${u.slug}`, external: false })), ...archive.urgent.map(fromArchive)].sort(byDate).slice(0, 2);
  const socials = [
    { label: "Facebook", href: settings.facebookUrl },
    { label: "Instagram", href: settings.instagramUrl },
    { label: "Telegram", href: settings.telegramUrl },
  ].filter((s) => s.href);

  return (
    <ConceptPage accent="#2c7e87">
      <div className={css.page} id="obzor-root" data-theme="light">
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        {/* ——— Боковая панель: шапка сайта ——— */}
        <aside className={css.side}>
          <div className={css.sideTop}>
            <Link href="/design-concepts/obzor" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={48} height={45} priority />
              <span>
                Кыргызская
                <br />
                фондовая биржа
              </span>
            </Link>
            <SideToggle>
              <nav aria-label="Основные разделы" className={css.sideNav}>
                {nav.map((item, i) => (
                  <Link key={item.label} href={item.href} {...linkProps(item.href)}>
                    <small>{String(i + 1).padStart(2, "0")}</small>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <Link href="/market/index" className={css.sideIndex}>
                <span className={css.live} data-open={data.session.open ? "" : undefined}>
                  <i aria-hidden="true" /> {data.session.label}
                </span>
                <b>{num(data.index.value, 2)}</b>
                <span>
                  Индекс KSE <Delta value={data.index.change} />
                </span>
              </Link>
              <div className={css.tools}>
                <span className={css.tool}>RU</span>
                <Link href="/search" className={css.tool} aria-label="Поиск">
                  ⌕
                </Link>
                <ThemeToggle />
              </div>
              <Link href="/login" className={css.btnDark}>
                Войти
              </Link>
            </SideToggle>
          </div>
        </aside>

        <main id="main" className={css.main}>
          {/* ——— Лента бумаг ——— */}
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

          {/* ——— Первый экран: гармошка слайдов + цифры ——— */}
          <section className={css.top}>
            <SlideDeck slides={slides} />
            <dl className={css.figures}>
              <div>
                <dt>Индекс KSE</dt>
                <dd>
                  <Link href="/market/index">{num(data.index.value, 2)}</Link>
                  <Delta value={data.index.change} />
                </dd>
              </div>
              <div>
                <dt>Капитализация, млрд сом</dt>
                <dd>
                  <Link href="/market/index">{num(data.index.capitalization, 1)}</Link>
                </dd>
              </div>
              <div>
                <dt>Объём торгов, млн сом</dt>
                <dd>
                  <Link href="/market">{num(data.volume.volumeMln, 4)}</Link>
                  <Delta value={data.volume.volumeChange} />
                </dd>
              </div>
              <div>
                <dt>Инструменты</dt>
                <dd>
                  <Link href="/market/quotes">{data.quotes.total}</Link>
                  <small>{num(data.volume.trades)} сделок</small>
                </dd>
              </div>
            </dl>
          </section>

          {/* ——— Рынок ——— */}
          {/* ——— Срочное объявление под первым экраном ——— */}
          {urgent.length ? (
            <section className={css.urgent} aria-label="Срочное объявление">
              <span className={css.urgentTag}>Срочное объявление</span>
              {urgent.map((u) => (
                <Link key={u.key} href={u.href} {...(u.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  <time>{u.date}</time> {u.title} <em>Подробнее ↗</em>
                </Link>
              ))}
            </section>
          ) : null}

          <section className={css.section} aria-label="Рынок">
            <div className={css.sectionHead}>
              <h2>Рынок</h2>
              <nav aria-label="Разделы рынка" className={css.marketMenu}>
                {marketMenu.map((m, i) => (
                  <Link key={m.label} href={m.href} aria-current={i === 0 ? "page" : undefined}>
                    {m.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className={css.marketTop}>
              {data.indexSeries.length > 1 ? <MarketChart series={data.indexSeries} change={pct(data.index.change)} /> : null}
              <div className={css.card}>
                <div className={css.cardHead}>
                  <h3>Итоги торгов</h3>
                  <Link href="/market">→</Link>
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
                    <dd>{num(data.index.capitalization, 1)} млрд</dd>
                  </div>
                  <div>
                    <dt>Сделок за сессию</dt>
                    <dd>{num(data.volume.trades)}</dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className={css.marketBottom}>
              <div className={css.card}>
                <div className={css.cardHead}>
                  <h3>Рынки</h3>
                  <Link href="/market/quotes">→</Link>
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
              <div className={css.card}>
                <div className={css.cardHead}>
                  <h3>Сделки {sessionShort}</h3>
                  <Link href="/market">→</Link>
                </div>
                {market.lastTrades.length ? (
                  <ul className={css.trades}>
                    {market.lastTrades.slice(0, 6).map((t) => (
                      <li key={`${t.ticker}-${t.price}`}>
                        <b>{t.ticker}</b>
                        <span>{num(t.price, 2)} сом</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={css.muted}>Сделок в последней сессии не было.</p>
                )}
              </div>
              <div className={css.card}>
                <div className={css.cardHead}>
                  <h3>Лидеры недели, тыс. сом</h3>
                  <Link href="/market">→</Link>
                </div>
                <ol className={css.leaders}>
                  {data.leaders.map((row) => (
                    <li key={row.ticker}>
                      <span>
                        <b>{row.ticker}</b>
                        <em>{num(row.volume, 2)}</em>
                      </span>
                      <i style={{ "--w": `${(row.volume / maxLeader) * 100}%` } as CSSProperties} aria-hidden="true" />
                    </li>
                  ))}
                </ol>
                <dl className={css.week}>
                  <div>
                    <dt>Итого за неделю</dt>
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
            </div>
          </section>

          {/* ——— Наши услуги: нумерованный список ——— */}
          <section className={css.section}>
            <div className={css.sectionHead}>
              <h2>Наши услуги</h2>
            </div>
            <ol className={css.services} data-stagger>
              {services.map((s, i) => (
                <li key={s.title}>
                  <Link href={s.href} {...linkProps(s.href)}>
                    <span className={css.serviceN}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={css.servicePhoto}>
                      <Image src={s.photo} alt="" fill sizes="200px" />
                    </span>
                    <span className={css.serviceText}>
                      <b>{s.title}</b>
                      <span>{s.text}</span>
                    </span>
                    <em aria-hidden="true">→</em>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          {/* ——— Аукционы ГЦБ карточками + котировки ——— */}
          <section className={css.section}>
            <div className={css.sectionHead}>
              <h2>Аукционы ГЦБ</h2>
              <Link href="/gcb" className={css.more}>
                Календарь →
              </Link>
            </div>
            {data.auctions.length ? (
              <div className={css.auctions} data-stagger>
                {data.auctions.map((a) => {
                  const [d, m, y] = a.date.split(".");
                  return (
                    <div key={`${a.date}-${a.type}`} className={css.auction}>
                      <span className={css.aDate}>
                        <b>{d}</b>
                        <small>
                          {m}.{y}
                        </small>
                      </span>
                      <span>
                        <b>{a.type}</b>
                        <small>{a.volume}</small>
                      </span>
                      <em>{a.status}</em>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={css.muted}>Расписание аукционов публикуется на странице ГЦБ.</p>
            )}

            <div className={`${css.sectionHead} ${css.sub}`}>
              <h2>Котировки</h2>
              <Link href="/market/quotes" className={css.more}>
                Все инструменты →
              </Link>
            </div>
            <div className={css.card}>
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
          </section>

          {/* ——— Новости ——— */}
          <section className={css.section}>
            <div className={css.sectionHead}>
              <div>
                <p className={css.kicker}>Новости и обновления</p>
                <h2>Будьте в курсе последних событий</h2>
              </div>
              <p className={css.muted}>Объявления площадки, изменения правил и события рынка</p>
            </div>
            <div className={css.news}>
              {lead ? (
                <Link href={`/news/${lead.slug}`} className={css.lead}>
                  <Image src={lead.photo} alt="" fill sizes="(max-width: 1100px) 100vw, 50vw" />
                  <span className={css.leadText}>
                    <span className={css.badge}>Главное</span>
                    <small>{longDate(lead.date)}</small>
                    <b>{lead.title}</b>
                    <span>{lead.excerpt}</span>
                    <em>Читать далее ↗</em>
                  </span>
                </Link>
              ) : null}
              <div className={css.card}>
                <Tabs
                  label="Новости"
                  css={css}
                  tabs={[
                    { label: "Новости биржи", content: <Feed items={exchangeFeed} />, aside: <Link href="/news" className={css.more}>Все новости →</Link> },
                    { label: "Новости компаний", content: <Feed items={companyFeed} />, aside: <Link href="/disclosure" className={css.more}>Все →</Link> },
                  ]}
                />
              </div>
            </div>
          </section>

          {/* ——— Как начать: линия с точками ——— */}
          <section className={`${css.section} ${css.steps}`}>
            <div className={css.sectionHead}>
              <div>
                <p className={css.kicker}>Первые шаги</p>
                <h2>Как начать инвестировать</h2>
              </div>
              <p>Четыре шага от выбора брокера до первой сделки на бирже</p>
            </div>
            <ol>
              {steps.map((s, i) => (
                <li key={s.title}>
                  <span className={css.dot} aria-hidden="true">
                    {i + 1}
                  </span>
                  <b>{s.title}</b>
                  <span>{s.text}</span>
                  <Link href={s.href} {...linkProps(s.href)}>
                    {s.link} →
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          {/* ——— Партнёры: стена логотипов ——— */}
          {data.partners.length ? (
            <section className={css.section}>
              <div className={css.sectionHead}>
                <div>
                  <h2>Наши партнеры</h2>
                  <p className={css.muted}>Регуляторы, инфраструктура и биржи-партнёры, с которыми работает КФБ</p>
                </div>
                <Link href="/about/partners" className={css.more}>
                  Все партнеры →
                </Link>
              </div>
              <ul className={css.partners}>
                {data.partners.slice(0, 8).map((p) => (
                  <li key={p.slug}>
                    <Link href={`/about/partners/${p.slug}`} title={p.name}>
                      <span className={css.partnerLogo} data-wide={p.logoWide ? "" : undefined}>
                        {p.logo ? <Image src={p.logo} alt={p.mark} fill sizes="200px" unoptimized /> : <b>{p.mark}</b>}
                      </span>
                      <b>{p.mark}</b>
                      <small>{p.caption}</small>
                      <span className={css.partnerName}>{p.name}</span>
                    </Link>
                    {p.site ? (
                      <a href={p.site.startsWith("http") ? p.site : `https://${p.site}`} target="_blank" rel="noopener noreferrer" className={css.partnerSite}>
                        {p.site.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* ——— Подвал ——— */}
          <footer className={css.footer}>
            <div className={css.footGrid}>
              <div className={css.footAbout}>
                <b>Кыргызская фондовая биржа</b>
                <p>{tagline}</p>
              </div>
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
          </footer>
        </main>

        <ConceptSwitch current="obzor" />
      </div>
    </ConceptPage>
  );
}
