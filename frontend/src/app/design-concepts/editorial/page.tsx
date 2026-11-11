import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Playfair_Display } from "next/font/google";
import { mediaSrc } from "@/lib/cms/media-src";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage, Words } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linePath, linkProps, longDate, nav, num, pct } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import css from "./editorial.module.css";

// Концепция 2 — Modern Editorial: сайт биржи как деловое издание. Реальные данные сайта: рынок (loadMarketData),
// новости, сообщения компаний, срочные объявления и контакты из админки, аукционы ГЦБ.
const display = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700", "900"],
  variable: "--e-display",
});

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "2 · Modern Editorial" };

const rubrics = [
  { label: "Торги", href: "/market" },
  { label: "Котировки", href: "/market/quotes" },
  { label: "Листинг", href: "/listing" },
  { label: "ГЦБ", href: "/gcb" },
  { label: "Раскрытие информации", href: "/disclosure" },
  { label: "Учебный центр", href: EDU_URL },
];

const monthsShort = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

function Change({ value }: { value: number }) {
  // Рост в разы (после почти пустой сессии) читается лучше, чем «+647 527,00%».
  const text = value >= 1000 ? `в ${num(value / 100 + 1)} раз` : pct(value);
  return <b className={value > 0 ? css.up : value < 0 ? css.down : css.flat}>{text}</b>;
}

/** «13.11.2026» → { day: "13", month: "ноя" }. */
function dayMonth(value: string) {
  const match = value.match(/^(\d{2})\.(\d{2})\.\d{4}$/);
  return match ? { day: String(Number(match[1])), month: monthsShort[Number(match[2]) - 1] } : { day: value, month: "" };
}

export default async function EditorialConcept() {
  const data = await loadHomeData();
  const [lead, second, third, ...rest] = data.news;
  const today = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bishkek" }).format(new Date());
  const active = data.instruments.filter((item) => item.price > 0).slice(0, 7);
  const hrefOf = new Map(data.instruments.map((item) => [item.ticker, item.href]));
  const urgent = data.urgent[0];
  // Колонка «Эмитент» — только если у сообщений указана компания (иначе там повторилась бы рубрика).
  const withCompany = data.companyNews.some((item) => item.company !== item.tag);

  return (
    <ConceptPage accent="#b3261e">
      <div className={`${css.page} ${display.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <div className={css.topline}>
          <div className={css.wrap}>
            <span className={css.today}>{today}</span>
            <span className={css.toplineQuotes}>
              <Link href="/market/index">
                KSE {num(data.index.value, 2)} <Change value={data.index.change} />
              </Link>
              {active.slice(0, 3).map((q) => (
                <Link key={q.ticker} href={q.href}>
                  {q.ticker} {num(q.price, 2)}
                </Link>
              ))}
            </span>
            <Link href="/search">Поиск</Link>
          </div>
        </div>

        <header className={css.masthead}>
          <div className={css.wrap}>
            <h1 className={css.titleH1}>
              <Link href="/design-concepts/editorial" className={css.title} data-intro="words" style={{ "--kc-d": "100ms" } as CSSProperties}>
                <Words text="Кыргызская фондовая биржа" />
              </Link>
            </h1>
            <p className={css.motto} data-intro="fade" style={{ "--kc-d": "500ms" } as CSSProperties}>
              Рынок ценных бумаг Кыргызстана · Бишкек · с 1994 года
            </p>
            <nav className={css.nav} aria-label="Основное меню" data-intro="fade" style={{ "--kc-d": "650ms" } as CSSProperties}>
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href="/members">Участники торгов</Link>
            </nav>
            <details className={css.menu}>
              <summary>Разделы</summary>
              <nav aria-label="Разделы (мобильное меню)">
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

        {urgent ? (
          <div className={css.breaking} data-intro="fade" style={{ "--kc-d": "800ms" } as CSSProperties}>
            <div className={css.wrap}>
              <b>Срочно</b>
              <Link href={`/news/${urgent.slug}`}>
                {urgent.date} — {urgent.title}
              </Link>
            </div>
          </div>
        ) : null}

        <main id="main" className={css.wrap}>
          <section className={css.front} aria-label="Главные новости">
            {lead ? (
              <Link href={`/news/${lead.slug}`} className={css.lead}>
                <span className={css.leadPhoto} data-intro="mask" style={{ "--kc-d": "350ms" } as CSSProperties}>
                  <Image src={mediaSrc(lead.photo)} alt="" fill priority sizes="(max-width: 1000px) 100vw, 60vw" unoptimized />
                </span>
                <span className={css.leadText} data-intro style={{ "--kc-d": "750ms" } as CSSProperties}>
                  <span className={css.rubric}>
                    {lead.tag} · {longDate(lead.date)}
                  </span>
                  <span className={css.leadTitle}>{lead.title}</span>
                  <span className={css.dek}>{lead.excerpt}</span>
                </span>
              </Link>
            ) : (
              <p className={css.lead}>Новостей пока нет</p>
            )}

            <div className={css.secondary}>
              {[second, third]
                .filter((n) => n)
                .map((n, i) => (
                  <Link key={n.slug} href={`/news/${n.slug}`} className={css.card} data-intro style={{ "--kc-d": `${600 + i * 150}ms` } as CSSProperties}>
                    <span className={css.cardPhoto}>
                      <Image src={mediaSrc(n.photo)} alt="" fill sizes="(max-width: 1000px) 100vw, 25vw" unoptimized />
                    </span>
                    <span className={css.rubric}>
                      {n.tag} · {longDate(n.date)}
                    </span>
                    <span className={css.cardTitle}>{n.title}</span>
                  </Link>
                ))}
            </div>

            <aside className={css.marketCol} aria-label="Рынок" data-intro="right" style={{ "--kc-d": "700ms" } as CSSProperties}>
              <h2 className={css.boxTitle}>Рынок</h2>
              <p className={css.bigNumber}>{num(data.index.value, 2)}</p>
              <p className={css.bigLabel}>
                Индекс KSE · <Change value={data.index.change} />
              </p>
              {data.history.length > 1 ? (
                <svg
                  className={css.spark}
                  viewBox="0 0 300 70"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  data-intro="draw"
                  style={{ "--kc-d": "1100ms" } as CSSProperties}
                >
                  <path d={linePath(data.history, 300, 70, 4)} />
                </svg>
              ) : null}
              <p className={css.asOf}>{data.live ? `Сессия ${longDate(data.session.date)}` : "Демонстрационные значения"}</p>
              <table className={css.mini}>
                <caption className={css.srOnly}>Самые активные бумаги сессии</caption>
                <tbody>
                  {active.map((q) => (
                    <tr key={q.ticker}>
                      <th scope="row">
                        <Link href={q.href} title={q.name}>
                          {q.ticker}
                        </Link>
                      </th>
                      <td>{num(q.price, 2)}</td>
                      <td>
                        <Change value={q.change} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={css.asOf}>
                Объём сессии {num(data.volume.volumeMln, 2)} млн сом · {num(data.volume.trades)} сделок
              </p>
              <Link className={css.inlineLink} href="/market/quotes">
                Все котировки →
              </Link>
            </aside>
          </section>

          <nav className={css.rubrics} aria-label="Рубрики" data-stagger>
            {rubrics.map((r) => (
              <Link key={r.href} href={r.href} {...linkProps(r.href)}>
                {r.label}
              </Link>
            ))}
          </nav>

          <section className={css.feature} aria-labelledby="e-feature">
            <span className={css.featurePhoto} data-reveal="mask">
              <Image src="/hero/bishkek-ala-too.jpg" alt="Бишкек и хребет Ала-Тоо" fill sizes="(max-width: 1000px) 100vw, 55vw" />
            </span>
            <div className={css.featureText} data-reveal="right">
              <p className={css.rubric}>Частному инвестору</p>
              <h2 id="e-feature">Как начать работать на бирже</h2>
              <p>
                Сделки на бирже заключаются только через лицензированных участников торгов. Счёт открывается у брокера, а котировки и отчётность эмитентов
                публикуются на сайте биржи.
              </p>
              <ol data-stagger>
                <li>Выберите лицензированного брокера</li>
                <li>Откройте брокерский счёт</li>
                <li>Изучите котировки и отчётность эмитентов</li>
                <li>Подайте поручение на сделку</li>
              </ol>
              <Link className={css.button} href="/members">
                Список участников торгов
              </Link>
            </div>
          </section>

          {rest.length ? (
            <section className={css.latest} aria-labelledby="e-latest">
              <h2 id="e-latest" className={css.sectionTitle} data-reveal>
                Последние новости
              </h2>
              <ul data-stagger>
                {rest.map((n) => (
                  <li key={n.slug}>
                    <Link href={`/news/${n.slug}`}>
                      <span className={css.cardPhoto}>
                        <Image src={mediaSrc(n.photo)} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" unoptimized />
                      </span>
                      <span className={css.rubric}>
                        {n.tag} · {longDate(n.date)}
                      </span>
                      <span className={css.cardTitle}>{n.title}</span>
                      <span className={css.cardExcerpt}>{n.excerpt}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link className={css.inlineLink} href="/news">
                Все новости →
              </Link>
            </section>
          ) : null}

          <section className={css.columns} aria-label="Сообщения эмитентов, аукционы ГЦБ и лидеры недели">
            <div>
              <h2 className={css.sectionTitle} data-reveal>
                Сообщения эмитентов
              </h2>
              {data.companyNews.length ? (
                <table className={css.feed}>
                  <thead>
                    <tr>
                      <th scope="col">Дата</th>
                      {withCompany ? <th scope="col">Эмитент</th> : null}
                      <th scope="col">Сообщение</th>
                    </tr>
                  </thead>
                  <tbody data-stagger>
                    {data.companyNews.map((d) => (
                      <tr key={d.slug}>
                        <td>{d.date}</td>
                        {withCompany ? <td>{d.company}</td> : null}
                        <td>
                          <Link href={`/news/${d.slug}`}>{d.title}</Link>
                          <small>{d.tag}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Сообщений эмитентов пока нет.</p>
              )}
              <Link className={css.inlineLink} href="/disclosure">
                Раскрытие информации →
              </Link>
            </div>
            <div>
              <h2 className={css.sectionTitle} data-reveal>
                Аукционы ГЦБ
              </h2>
              {data.auctions.length ? (
                <ul className={css.calendar} data-stagger>
                  {data.auctions.map((a) => {
                    const { day, month } = dayMonth(a.date);
                    return (
                      <li key={`${a.date}-${a.type}`}>
                        <span className={css.calDate}>
                          {day} {month}
                        </span>
                        <b>{a.type}</b>
                        <small>
                          {a.volume} · {a.status}
                        </small>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>Ближайших аукционов нет.</p>
              )}
              {data.leaders.length ? (
                <>
                  <h2 className={css.sectionTitle} data-reveal>
                    Лидеры недели
                  </h2>
                  <ul className={css.docs} data-stagger>
                    {data.leaders.map((row) => (
                      <li key={row.ticker}>
                        <Link href={hrefOf.get(row.ticker) ?? "/market/quotes"}>{row.ticker}</Link>
                        <small>
                          {num(row.volume, 1)}
                          {data.live ? " тыс. сом" : ""} · {num(row.deals)} сделок
                        </small>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          </section>

          <section className={css.promo} aria-labelledby="e-promo">
            <Image src="/hub/hub-education.jpg" alt="" fill sizes="100vw" className={css.promoImg} data-parallax="0.12" />
            <div data-reveal>
              <p className={css.rubricLight}>Учебный центр</p>
              <h2 id="e-promo">Курсы по рынку ценных бумаг</h2>
              <p>Учебный центр биржи проводит курсы и семинары для инвесторов и специалистов рынка: как устроены торги, как выбрать брокера и читать отчётность.</p>
              <Link className={css.buttonLight} href={EDU_URL} {...linkProps(EDU_URL)}>
                Перейти в учебный центр
              </Link>
            </div>
          </section>
        </main>

        <footer className={css.colophon}>
          <div className={css.wrap}>
            <p className={css.colophonTitle} data-reveal>
              Кыргызская фондовая биржа
            </p>
            <div className={css.colophonGrid} data-stagger>
              <address>
                {data.contacts.address}
                {data.contacts.phones.map((phone) => (
                  <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                    {phone}
                  </a>
                ))}
                {data.contacts.email ? <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a> : null}
              </address>
              <nav aria-label="Разделы">
                {nav.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
                <Link href="/contacts">Контакты</Link>
              </nav>
              <p>
                {data.contacts.copyright}
                {data.contacts.license ? (
                  <>
                    <br />
                    {data.contacts.license}
                  </>
                ) : null}
              </p>
            </div>
          </div>
        </footer>
        <ConceptSwitch current="editorial" />
      </div>
    </ConceptPage>
  );
}
