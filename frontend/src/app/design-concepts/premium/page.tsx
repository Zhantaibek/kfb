import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Cormorant_Garamond } from "next/font/google";
import { ConceptPage, Words } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linePath, nav, num, pct } from "../_shared/data";
import { audiences, disclosures, documents, events, gainers, indexSeries, keyFacts, losers, market, miniSeries, news, quotes, sectors } from "../_shared/mock";
import css from "./premium.module.css";

// Концепция 1 — Premium Corporate: портал биржи в строгом корпоративном стиле. Демо-данные из _shared/mock.ts.
const serif = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--p-serif",
});

export const metadata: Metadata = { title: "1 · Premium Corporate" };

function Change({ value }: { value: number }) {
  return <span className={value > 0 ? css.up : value < 0 ? css.down : css.flat}>{pct(value)}</span>;
}

export default function PremiumConcept() {
  const [lead, ...more] = news;

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${serif.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <div className={css.utility}>
          <div className={css.wrap}>
            <span>
              <i className={css.dot} aria-hidden="true" /> Торговая сессия: будни 09:00–17:00
            </span>
            <a href="tel:+996312311484">+996 312 31 14 84</a>
            <Link href="/search">Поиск</Link>
            <Link href="/login">Вход для сотрудников</Link>
          </div>
        </div>

        <header className={css.header}>
          <div className={css.wrap}>
            <Link href="/design-concepts/premium" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={42} height={40} priority />
              <span>
                Кыргызская
                <br />
                фондовая биржа
              </span>
            </Link>
            <nav className={css.nav} aria-label="Основное меню">
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link className={css.headerCta} href="/members">
              Выбрать брокера
            </Link>
            <details className={css.menu}>
              <summary>Меню</summary>
              <nav aria-label="Меню (мобильное)">
                {nav.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
                <Link href="/members">Выбрать брокера</Link>
              </nav>
            </details>
          </div>
        </header>

        <main id="main">
          <section className={css.hero} aria-labelledby="p-hero">
            <Image src="/hero/bishkek-ala-too.jpg" alt="" fill priority sizes="100vw" className={css.heroImg} data-intro="kenburns" data-parallax="0.22" />
            <div className={`${css.wrap} ${css.heroInner}`}>
              <div className={css.heroText}>
                <p className={css.kicker} data-intro="fade" style={{ "--kc-d": "150ms" } as CSSProperties}>
                  ЗАО «Кыргызская фондовая биржа» · с 1994 года
                </p>
                <h1 id="p-hero" data-intro="words" style={{ "--kc-d": "250ms" } as CSSProperties}>
                  <Words text="Организованный рынок капитала Кыргызстана" />
                </h1>
                <p data-intro style={{ "--kc-d": "650ms" } as CSSProperties}>
                  Акции, облигации, государственные ценные бумаги и драгоценные металлы — торги через лицензированных участников, листинг и раскрытие информации
                  эмитентов.
                </p>
                <div className={css.actions} data-intro style={{ "--kc-d": "800ms" } as CSSProperties}>
                  <Link className={css.btnLight} href="/investors">
                    Начать инвестировать
                  </Link>
                  <Link className={css.btnOutline} href="/listing">
                    Выйти на биржу
                  </Link>
                </div>
              </div>
              <Link
                href="/market/index"
                className={css.marketCard}
                aria-label="Индекс KSE — подробнее"
                data-intro="right"
                data-tilt
                style={{ "--kc-d": "550ms" } as CSSProperties}
              >
                <span className={css.cardLabel}>Индекс KSE · {market.sessionDate}</span>
                <span className={css.cardValue}>
                  {num(market.index, 2)} <Change value={market.indexChange} />
                </span>
                <svg viewBox="0 0 320 90" preserveAspectRatio="none" aria-hidden="true" data-intro="draw" style={{ "--kc-d": "900ms" } as CSSProperties}>
                  <path className={css.area} d={`${linePath(indexSeries, 320, 90, 6)} L320 90 L0 90 Z`} />
                  <path className={css.line} d={linePath(indexSeries, 320, 90, 6)} />
                </svg>
                <dl>
                  <div>
                    <dt>Капитализация</dt>
                    <dd>{num(market.capitalization, 1)} млрд</dd>
                  </div>
                  <div>
                    <dt>Объём</dt>
                    <dd>{num(market.volume, 2)} млн</dd>
                  </div>
                  <div>
                    <dt>Сделок</dt>
                    <dd>{market.deals}</dd>
                  </div>
                </dl>
              </Link>
            </div>
          </section>

          <div className={css.tape} aria-label="Котировки (демо)">
            {/* Список повторён дважды: лента бесконечно прокручивается сдвигом на половину ширины. */}
            <ul>
              {[...quotes, ...quotes].map((q, i) => (
                <li key={i} aria-hidden={i >= quotes.length || undefined}>
                  <b>{q.ticker}</b> {num(q.price, 2)} <Change value={q.change} />
                </li>
              ))}
            </ul>
          </div>

          <section className={`${css.wrap} ${css.section}`} aria-labelledby="p-aud">
            <header className={css.head} data-reveal>
              <p className={css.kicker}>Для кого биржа</p>
              <h2 id="p-aud">Выберите свой путь на рынке</h2>
            </header>
            <ul className={css.audiences} data-stagger>
              {audiences.map((a) => (
                <li key={a.title}>
                  <Link href={a.href}>
                    <span className={css.audPhoto}>
                      <Image src={a.photo} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" />
                    </span>
                    <span className={css.audBody}>
                      <b>{a.title}</b>
                      <span>{a.text}</span>
                      <em>Подробнее →</em>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className={css.marketSection} aria-labelledby="p-market">
            <div className={`${css.wrap} ${css.section}`}>
              <header className={css.head} data-reveal>
                <p className={css.kicker}>Рынок · {market.sessionDate}</p>
                <h2 id="p-market">Котировки и итоги сессии</h2>
                <Link className={css.more} href="/market/quotes">
                  Все котировки →
                </Link>
              </header>
              <div className={css.marketGrid}>
                <div className={css.tableWrap}>
                  <table className={css.table}>
                    <thead>
                      <tr>
                        <th scope="col">Бумага</th>
                        <th scope="col">Эмитент</th>
                        <th scope="col" className={css.num}>
                          Цена, сом
                        </th>
                        <th scope="col" className={css.num}>
                          Изм.
                        </th>
                        <th scope="col" className={css.num}>
                          Объём, тыс.
                        </th>
                        <th scope="col">
                          <span className={css.srOnly}>График</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody data-stagger>
                      {quotes.slice(0, 8).map((q) => (
                        <tr key={q.ticker}>
                          <td>
                            <Link href={`/market/quotes?q=${q.ticker}`}>{q.ticker}</Link>
                          </td>
                          <td>{q.name}</td>
                          <td className={css.num}>{num(q.price, 2)}</td>
                          <td className={css.num}>
                            <Change value={q.change} />
                          </td>
                          <td className={css.num}>{num(q.volume, 1)}</td>
                          <td>
                            <svg className={q.change >= 0 ? css.sparkUp : css.sparkDown} viewBox="0 0 80 24" aria-hidden="true" data-draw>
                              <path d={linePath(miniSeries(q.ticker, q.change), 80, 24, 2)} />
                            </svg>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <aside className={css.marketSide} aria-label="Лидеры роста и падения" data-reveal="right">
                  <div>
                    <h3>Лидеры роста</h3>
                    <ul className={css.movers} data-stagger>
                      {gainers.map((q) => (
                        <li key={q.ticker}>
                          <span>{q.ticker}</span>
                          <Change value={q.change} />
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3>Лидеры падения</h3>
                    <ul className={css.movers} data-stagger>
                      {losers.map((q) => (
                        <li key={q.ticker}>
                          <span>{q.ticker}</span>
                          <Change value={q.change} />
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3>Капитализация по секторам</h3>
                    <ul className={css.sectors} data-stagger>
                      {sectors.map((s) => (
                        <li key={s.name}>
                          <span>{s.name}</span>
                          <span className={css.sectorBar}>
                            <i style={{ width: `${s.share}%` }} data-grow />
                          </span>
                          <span>{s.share}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </aside>
              </div>
            </div>
          </section>

          <section className={`${css.wrap} ${css.section}`} aria-labelledby="p-news">
            <header className={css.head} data-reveal>
              <p className={css.kicker}>Пресс-центр</p>
              <h2 id="p-news">Новости биржи</h2>
              <Link className={css.more} href="/news">
                Все новости →
              </Link>
            </header>
            <div className={css.newsGrid}>
              <Link href="/news" className={css.newsLead}>
                <span className={css.newsPhoto} data-reveal="mask">
                  <Image src={lead.photo} alt="" fill sizes="(max-width: 900px) 100vw, 60vw" />
                </span>
                <span className={css.newsMeta}>
                  {lead.tag} · {lead.date}
                </span>
                <span className={css.newsTitle}>{lead.title}</span>
                <span className={css.newsExcerpt}>{lead.excerpt}</span>
              </Link>
              <ul className={css.newsList} data-stagger>
                {more.slice(0, 3).map((n) => (
                  <li key={n.slug}>
                    <Link href="/news">
                      <span className={css.newsThumb}>
                        <Image src={n.photo} alt="" fill sizes="160px" />
                      </span>
                      <span>
                        <span className={css.newsMeta}>
                          {n.tag} · {n.date}
                        </span>
                        <span className={css.newsSmall}>{n.title}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className={css.facts} aria-label="Биржа в цифрах">
            <Image src="/carousel/office.jpg" alt="" fill sizes="100vw" className={css.factsImg} data-parallax="0.08" />
            <div className={`${css.wrap} ${css.factsInner}`} data-stagger>
              {keyFacts.map((f) => (
                <div key={f.label}>
                  <b data-count={f.value} data-plain>
                    {f.value}
                  </b>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={`${css.wrap} ${css.section} ${css.twoCol}`} aria-label="События и раскрытие информации">
            <div>
              <header className={css.head} data-reveal>
                <p className={css.kicker}>Календарь</p>
                <h2>Ближайшие события</h2>
              </header>
              <ul className={css.events} data-stagger>
                {events.map((e) => (
                  <li key={e.title}>
                    <span className={css.date}>
                      <b>{e.day}</b>
                      {e.month}
                    </span>
                    <span>
                      <b>{e.title}</b>
                      <small>
                        {e.place} · {e.time}
                      </small>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <header className={css.head} data-reveal>
                <p className={css.kicker}>Центр раскрытия</p>
                <h2>Сообщения эмитентов</h2>
              </header>
              <ul className={css.feed} data-stagger>
                {disclosures.map((d) => (
                  <li key={d.title}>
                    <Link href="/disclosure">
                      <small>
                        {d.date} · {d.type}
                      </small>
                      <b>{d.company}</b>
                      <span>{d.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link className={css.more} href="/disclosure">
                Все сообщения →
              </Link>
            </div>
          </section>

          <section className={`${css.wrap} ${css.section} ${css.edu}`} aria-labelledby="p-edu">
            <span className={css.eduPhoto} data-reveal="mask">
              <Image src="/hub/hub-education.jpg" alt="Учебный центр биржи" fill sizes="(max-width: 900px) 100vw, 50vw" />
            </span>
            <div data-reveal>
              <p className={css.kicker}>Учебный центр</p>
              <h2 id="p-edu">Курсы для инвесторов и специалистов рынка</h2>
              <p>Основы инвестирования, анализ отчётности эмитентов, подготовка к квалификационному экзамену. Очно в Бишкеке и онлайн.</p>
              <h3>Документы</h3>
              <ul className={css.docs}>
                {documents.map((d) => (
                  <li key={d.title}>
                    <Link href="/documents">
                      <span>{d.title}</span>
                      <small>{d.meta}</small>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>

        <footer className={css.footer}>
          <div className={`${css.wrap} ${css.footGrid}`} data-stagger>
            <div>
              <Image src="/brand/kse-mark.png" alt="" width={42} height={40} />
              <p className={css.footName}>ЗАО «Кыргызская фондовая биржа»</p>
              <p>720010, г. Бишкек, ул. Московская, 172</p>
            </div>
            <nav aria-label="Рынок">
              <b>Рынок</b>
              <Link href="/market">Итоги торгов</Link>
              <Link href="/market/quotes">Котировки</Link>
              <Link href="/market/index">Индекс KSE</Link>
              <Link href="/gcb">ГЦБ</Link>
            </nav>
            <nav aria-label="Эмитентам и инвесторам">
              <b>Участникам</b>
              <Link href="/listing">Листинг</Link>
              <Link href="/disclosure">Раскрытие информации</Link>
              <Link href="/members">Участники торгов</Link>
              <Link href="/tariffs">Тарифы</Link>
            </nav>
            <div>
              <b>Контакты</b>
              <a href="tel:+996312311484">+996 312 31 14 84</a>
              <a href="mailto:office@kse.kg">office@kse.kg</a>
              <Link href="/contacts">Все контакты</Link>
            </div>
          </div>
          <p className={`${css.wrap} ${css.demo}`}>
            Макет с демонстрационными данными: котировки, новости и события вымышлены. © ЗАО «Кыргызская фондовая биржа»
          </p>
        </footer>
        <ConceptSwitch current="premium" />
      </div>
    </ConceptPage>
  );
}
