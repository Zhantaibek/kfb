import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Montserrat } from "next/font/google";
import { mediaSrc } from "@/lib/cms/media-src";
import { loadIssuerData } from "@/lib/cms/public";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, nav, num, steps } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import { mapHeight, mapWidth, regionShapes, type RegionId } from "../karta/kgz-map";
import { regionOf } from "../karta/regions";
import { Carousel } from "./Carousel";
import css from "./set.module.css";

/*
 * Концепция 23 — «Сеть»: повтор устройства и визуального языка главной plaid.com по снимкам страницы —
 * сине-бирюзовый градиентный первый экран с гравюрной картой (у нас — Кыргызстан), «плавающее» меню-капсула,
 * лента логотипов, карточки с цветными градиентами и «телефонами», тёмно-синяя секция с бегущими «таблетками»
 * регионов, крупные тонкие цифры, тёмная карточка с «кодом», карусель компаний, градиентный финал с белой карточкой.
 * Логотип, тексты и изображения Plaid не используются — всё наполнение реальные данные КФБ.
 */
const font = Montserrat({ subsets: ["latin", "cyrillic"], weight: ["300", "400", "500", "600", "700"], variable: "--st-font" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "23 · Сеть" };

const tones = ["#14c39a", "#1e88e5", "#7b4de0", "#f2b705", "#0f3d63", "#e0567a"];

function pctText(value: number) {
  if (value >= 1000) return `в ${num(value / 100 + 1)} раз`;
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${num(Math.abs(value), 2)}%`;
}

export default async function SetConcept() {
  const [data, issuerData] = await Promise.all([loadHomeData(), loadIssuerData()]);
  const priced = data.instruments.filter((i) => i.price > 0);
  const traded = data.instruments.filter((i) => i.volume > 0);
  const total = traded.reduce((s, i) => s + i.volume, 0);
  const years = new Date().getFullYear() - 1994;

  // Эмитенты по областям — для «таблеток» в тёмной секции.
  const counts = new Map<RegionId, number>();
  for (const issuer of issuerData.issuers) {
    const r = regionOf(issuer.address ?? "");
    if (r) counts.set(r, (counts.get(r) ?? 0) + 1);
  }
  const pills = regionShapes
    .filter((s, i, all) => all.findIndex((x) => x.id === s.id) === i)
    .map((s) => ({ id: s.id, name: s.name, count: counts.get(s.id) ?? 0 }))
    .sort((a, b) => b.count - a.count);
  const feed = [...data.companyNews.map((n) => ({ ...n, kind: "Эмитент" })), ...data.news.map((n) => ({ ...n, kind: n.tag || "Новости" }))].slice(0, 4);
  const maxBar = Math.max(1, ...data.indexSeries.slice(-12).map((p) => p.value));
  const minBar = Math.min(...data.indexSeries.slice(-12).map((p) => p.value));

  return (
    <ConceptPage accent="#14c39a">
      <div className={`${css.page} ${font.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        {/* Меню-капсула поверх первого экрана. */}
        <header className={css.header}>
          <div className={css.capsule}>
            <Link href="/design-concepts/set" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={26} height={24} priority />
              <span>KSE</span>
            </Link>
            <nav className={css.nav} aria-label="Основное меню">
              {nav.slice(0, 5).map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className={css.headActions}>
              <Link href="/contacts" className={css.outlineBtn}>
                Контакты
              </Link>
              <Link href="/members" className={css.darkBtn}>
                Начать инвестировать
              </Link>
            </div>
            <details className={css.menu}>
              <summary>Меню</summary>
              <nav aria-label="Меню (мобильное)">
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

        <main id="main">
          {/* 1. Градиентный первый экран с гравюрной картой. */}
          <section className={css.hero} aria-labelledby="st-hero">
            <svg className={css.heroMap} viewBox={`-60 -60 ${mapWidth + 120} ${mapHeight + 120}`} aria-hidden="true">
              <defs>
                <pattern id="st-hatch" width="6" height="6" patternUnits="userSpaceOnUse">
                  <path d="M0 3h6" />
                </pattern>
              </defs>
              {[0, 1, 2, 3].map((i) => (
                <ellipse key={i} cx={mapWidth / 2} cy={mapHeight * 2.2} rx={260 + i * 210} ry={220 + i * 190} className={css.meridian} />
              ))}
              {regionShapes.map((s) => (
                <path key={s.id} d={s.d} className={css.mapRegion} />
              ))}
            </svg>
            <span className={css.rings} aria-hidden="true" />
            <div className={css.heroInner}>
              <h1 id="st-hero" data-intro="rise">
                Фондовый рынок всего Кыргызстана
              </h1>
              <p data-intro="rise" style={{ "--kc-d": "320ms" } as CSSProperties}>
                Торги, листинг, аукционы ГЦБ и отчётность {num(data.issuers)} эмитентов — на одной бирже.
              </p>
              <div className={css.heroActions} data-intro="rise" style={{ "--kc-d": "440ms" } as CSSProperties}>
                <Link href="/members" className={css.whiteBtn}>
                  Начать инвестировать
                </Link>
                <Link href="/market/quotes" className={css.ghostBtn}>
                  Котировки
                </Link>
              </div>
            </div>
            {data.partners.length ? (
              <div className={css.logos}>
                <ul className={css.logosTrack}>
                  {[...data.partners, ...data.partners].map((p, i) => (
                    <li key={`${p.slug}-${i}`} aria-hidden={i >= data.partners.length || undefined}>
                      <Link href={`/about/partners/${p.slug}`} tabIndex={i >= data.partners.length ? -1 : undefined} title={p.name}>
                        {p.logo ? <Image src={p.logo} alt={p.mark} width={160} height={56} unoptimized /> : <b>{p.mark}</b>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {/* 2. Карточки с градиентами и «телефонами». */}
          <section className={css.light} aria-labelledby="st-stages">
            <span className={css.waves} aria-hidden="true" />
            <h2 id="st-stages" className={css.centerHead} data-reveal>
              Всё для каждого шага инвестора
            </h2>
            <ul className={css.cards} data-stagger>
              <li>
                <Link href="/market/quotes">
                  <span className={css.cardArt} data-tone="teal">
                    <span className={css.phone}>
                      <span className={css.phoneTitle}>Котировки</span>
                      {priced.slice(0, 3).map((q) => (
                        <span key={q.ticker} className={css.phoneRow}>
                          <span>
                            <b>{q.ticker}</b>
                            <small>{q.name}</small>
                          </span>
                          <span>{num(q.price, 2)}</span>
                        </span>
                      ))}
                      <span className={css.phoneBtn}>Все бумаги</span>
                    </span>
                  </span>
                  <b className={css.cardTitle}>Цены, которым можно доверять</b>
                  <span className={css.cardText}>Котировки и объёмы по каждой бумаге — по итогам торговой сессии биржи.</span>
                  <span className={css.cardLink}>
                    <i aria-hidden="true">→</i> Смотреть котировки
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/market/index">
                  <span className={css.cardArt} data-tone="violet">
                    <span className={css.dash}>
                      <span className={css.dashHead}>
                        <small>Индекс KSE</small>
                        <b>{num(data.index.value, 2)}</b>
                      </span>
                      <span className={css.dashBars}>
                        {data.indexSeries.slice(-12).map((p) => (
                          <i key={p.date} style={{ height: `${20 + 80 * ((p.value - minBar) / (maxBar - minBar || 1))}%` }} />
                        ))}
                      </span>
                    </span>
                  </span>
                  <b className={css.cardTitle}>Рынок в одном индексе</b>
                  <span className={css.cardText}>Индекс KSE и его история — главный индикатор рынка ценных бумаг страны.</span>
                  <span className={css.cardLink}>
                    <i aria-hidden="true">→</i> История индекса
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/disclosure">
                  <span className={css.cardArt} data-tone="magenta">
                    <span className={css.dash}>
                      <span className={css.dashHead}>
                        <small>Раскрытие информации</small>
                        <b>{num(data.issuers)} эмитентов</b>
                      </span>
                      {data.companyNews.slice(0, 2).map((n) => (
                        <span key={n.slug} className={css.chipRow}>
                          <i aria-hidden="true" /> {n.title}
                        </span>
                      ))}
                    </span>
                  </span>
                  <b className={css.cardTitle}>Отчётность, открытая каждому</b>
                  <span className={css.cardText}>Отчёты и существенные факты эмитентов — в Центре раскрытия информации.</span>
                  <span className={css.cardLink}>
                    <i aria-hidden="true">→</i> Центр раскрытия
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/gcb">
                  <span className={css.cardArt} data-tone="green">
                    <span className={css.phone}>
                      <span className={css.phoneTitle}>Аукцион ГЦБ</span>
                      {data.auctions.slice(0, 2).map((a) => (
                        <span key={`${a.date}-${a.type}`} className={css.phoneRow}>
                          <span>
                            <b>{a.type}</b>
                            <small>{a.date}</small>
                          </span>
                          <span>{a.volume}</span>
                        </span>
                      ))}
                      <span className={css.phoneBtn}>{data.auctions[0]?.status ?? "Календарь"}</span>
                    </span>
                  </span>
                  <b className={css.cardTitle}>Государственные бумаги — на бирже</b>
                  <span className={css.cardText}>Аукционы ГЦБ Министерства финансов: даты, выпуски и объёмы.</span>
                  <span className={css.cardLink}>
                    <i aria-hidden="true">→</i> Календарь ГЦБ
                  </span>
                </Link>
              </li>
            </ul>
          </section>

          {/* 3. Тёмно-синяя секция с бегущими «таблетками» областей. */}
          <section className={css.navy} aria-labelledby="st-regions">
            <div className={css.navyText} data-reveal>
              <h2 id="st-regions">Для всего Кыргызстана</h2>
              <Link href="/disclosure" className={css.whiteBtn}>
                Все эмитенты
              </Link>
            </div>
            <div className={css.pillCols} aria-label="Эмитенты по областям">
              {[0, 1].map((col) => (
                <div key={col} className={css.pillCol} data-dir={col}>
                  <ul>
                    {[...pills, ...pills]
                      .filter((_, i) => i % 2 === col)
                      .map((p, i) => (
                        <li key={`${p.id}-${i}`} aria-hidden={i >= Math.ceil(pills.length / 2) || undefined}>
                          <b>{num(p.count)}</b> {p.name}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Сеть: стопка уведомлений + текст, крупные тонкие цифры. */}
          <section className={css.network} aria-labelledby="st-net">
            <div className={css.netGrid}>
              <div className={css.stack} data-stagger>
                {feed.map((n, i) => (
                  <Link key={n.slug} href={`/news/${n.slug}`} className={css.note} style={{ "--o": i % 2 ? "56px" : "0px" } as CSSProperties}>
                    <span className={css.notePhoto}>
                      <Image src={mediaSrc(n.photo)} alt="" fill sizes="48px" unoptimized />
                    </span>
                    <span>
                      <small>
                        {n.kind} · {n.date}
                      </small>
                      <b>{n.title}</b>
                    </span>
                  </Link>
                ))}
              </div>
              <div className={css.netText} data-reveal>
                <h2 id="st-net">Сеть, на которой держится рынок</h2>
                <p>
                  Эмитенты, брокеры, банки и регулятор — {num(data.issuers)} компаний раскрывают отчётность, сделки проходят через лицензированных участников
                  торгов.
                </p>
              </div>
            </div>
            <dl className={css.stats} data-stagger>
              <div>
                <dd data-count={data.issuers}>{num(data.issuers)}</dd>
                <dt>эмитентов раскрывают отчётность</dt>
              </div>
              <div>
                <dd data-count={data.listed}>{num(data.listed)}</dd>
                <dt>бумаг в официальном списке</dt>
              </div>
              <div>
                <dd data-count={data.index.capitalization} data-digits="1">
                  {num(data.index.capitalization, 1)}
                </dd>
                <dt>млрд сом капитализация</dt>
              </div>
              <div>
                <dd data-count={years}>{num(years)}</dd>
                <dt>лет работы биржи</dt>
              </div>
            </dl>
          </section>

          {/* 5. Тёмная карточка с градиентным заголовком и «кодом» — лентой данных сессии. */}
          <section className={css.devWrap} aria-labelledby="st-data">
            <div className={css.dev} data-reveal="zoom">
              <h2 id="st-data" className={css.gradText}>
                Нужны данные рынка?
                <br />
                Они открыты.
              </h2>
              <p>Котировки, индекс и итоги торгов публикуются после каждой сессии — без регистрации и платы.</p>
              <div className={css.code}>
                <div className={css.codeBar}>/market/quotes · {data.live ? longDate(data.session.date) : "демо"}</div>
                <ol>
                  {priced.slice(0, 6).map((q) => (
                    <li key={q.ticker}>
                      <span className={css.kw}>{q.ticker.padEnd(9, " ")}</span>
                      <span>{num(q.price, 2).padStart(10, " ")}</span>
                      <span className={q.change > 0 ? css.up : q.change < 0 ? css.down : css.fn}>{pctText(q.change).padStart(9, " ")}</span>
                      <span className={css.cm}>{" // "}объём {num(q.volume, 1)}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <Link href="/market" className={css.whiteBtn}>
                Итоги торгов
              </Link>
            </div>
          </section>

          {/* 6. Карусель компаний. */}
          <section className={css.companies} aria-labelledby="st-co">
            <Carousel
              label="Бумаги последней сессии"
              head={
                <h2 id="st-co" data-reveal>
                  Компании, которые торгуются на КФБ
                </h2>
              }
            >
              {traded.map((q, i) => (
                <li key={q.ticker}>
                  <Link href={q.href}>
                    <span className={css.coTile} style={{ "--tone": tones[i % tones.length] } as CSSProperties}>
                      {q.ticker}
                    </span>
                    <span className={css.coText}>
                      {q.name}: {num(q.price, 2)} сом, {num((q.volume / (total || 1)) * 100, 1)}% оборота сессии
                    </span>
                  </Link>
                </li>
              ))}
            </Carousel>
          </section>

          {/* 7. Градиентный финал с белой карточкой. */}
          <section className={css.final} aria-labelledby="st-final">
            <h2 id="st-final" data-reveal>
              Прозрачный рынок.
              <br />
              Понятные цены.
              <br />
              Открытая отчётность.
            </h2>
            <div className={css.formCard} id="start" data-reveal>
              <h3>С чего начать</h3>
              <form action="/search" role="search" className={css.form}>
                <label htmlFor="st-q" className={css.srOnly}>
                  Тикер, эмитент или документ
                </label>
                <input id="st-q" name="q" type="search" placeholder="Тикер, эмитент или документ" />
                <button type="submit" className={css.darkBtn}>
                  Найти
                </button>
              </form>
              <ol className={css.steps}>
                {steps.map((s, i) => (
                  <li key={s.title}>
                    <Link href={s.href} {...linkProps(s.href)}>
                      <span>{i + 1}</span>
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ol>
              <Link href="/members" className={css.darkBtn}>
                Выбрать брокера
              </Link>
              <p className={css.fine}>Сделки с ценными бумагами заключаются только через лицензированных участников торгов.</p>
            </div>
          </section>
        </main>

        <footer className={css.footer}>
          <div className={css.footGrid}>
            <Image src="/brand/kse-mark.png" alt="КФБ" width={40} height={38} />
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
            <nav aria-label="Инвесторам">
              <b>Инвесторам</b>
              <Link href="/members">Участники торгов</Link>
              <Link href="/investors">Как начать</Link>
              <Link href={EDU_URL} {...linkProps(EDU_URL)}>
                Учебный центр
              </Link>
            </nav>
            <nav aria-label="О бирже">
              <b>О бирже</b>
              <Link href="/about">О бирже</Link>
              <Link href="/news">Новости</Link>
              <Link href="/contacts">Контакты</Link>
            </nav>
          </div>
          <div className={css.footBottom}>
            <span>{data.contacts.copyright}</span>
            {data.contacts.address ? <span>{data.contacts.address}</span> : null}
            {data.contacts.phones[0] ? <a href={`tel:${data.contacts.phones[0].replace(/[^\d+]/g, "")}`}>{data.contacts.phones[0]}</a> : null}
            {data.contacts.email ? <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a> : null}
          </div>
          <p className={css.legal}>
            {data.contacts.license ? `ЗАО «Кыргызская фондовая биржа» работает по лицензии ${data.contacts.license}. ` : ""}Котировки, индекс и итоги торгов публикуются по
            данным торговых сессий биржи. Информация на сайте не является инвестиционной рекомендацией.
          </p>
        </footer>
        <ConceptSwitch current="set" />
      </div>
    </ConceptPage>
  );
}
