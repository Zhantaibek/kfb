import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Onest } from "next/font/google";
import { mediaSrc } from "@/lib/cms/media-src";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage, Words } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linePath, linkProps, longDate, num, pct, steps } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import { IndexChart } from "../_shared/IndexChart";
import { Showcase } from "./Showcase";
import { Stories } from "./Stories";
import css from "./kapital.module.css";

/*
 * Концепция 22 — «Капитал»: повторяет устройство и визуальный язык главной mercury.com по снимкам страницы:
 * фото-пейзаж на весь первый экран с центрированным заголовком и полем-«таблеткой», тёмная секция с аккордеоном
 * и большой тёмной панелью интерфейса, логотипы партнёров, светлые секции с серыми плитками-«интерфейсами»,
 * полоса цифр с разделителями, тёмные карточки новостей с круглыми стрелками, финальный призыв и подвал.
 * Логотип, тексты и изображения Mercury не используются: всё наполнение — реальные данные и фото КФБ.
 */
const font = Onest({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], variable: "--kp-font" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "22 · Капитал" };

const menus = [
  {
    label: "Рынок",
    links: [
      { label: "Итоги торгов", href: "/market" },
      { label: "Котировки", href: "/market/quotes" },
      { label: "Индекс KSE", href: "/market/index" },
      { label: "ГЦБ", href: "/gcb" },
    ],
  },
  {
    label: "Эмитентам",
    links: [
      { label: "Листинг", href: "/listing" },
      { label: "Раскрытие информации", href: "/disclosure" },
      { label: "Документы", href: "/documents" },
    ],
  },
  {
    label: "Инвесторам",
    links: [
      { label: "Как начать", href: "/investors" },
      { label: "Участники торгов", href: "/members" },
      { label: "Учебный центр", href: EDU_URL },
    ],
  },
  {
    label: "О бирже",
    links: [
      { label: "О бирже", href: "/about" },
      { label: "Новости", href: "/news" },
      { label: "Контакты", href: "/contacts" },
    ],
  },
];

const audiences = [
  { chip: "Инвесторам", text: "Счёт у брокера, первые бумаги и котировки по итогам каждой сессии.", href: "/investors", photo: "/hub/hub-market.jpg" },
  { chip: "Эмитентам", text: "Размещение акций и облигаций, листинг и раскрытие отчётности.", href: "/listing", photo: "/hub/hub-listing.jpg" },
  { chip: "Участникам торгов", text: "Правила торгов, тарифы и документы для брокеров и банков.", href: "/documents", photo: "/hub/hub-members.jpg" },
];

function Change({ value }: { value: number }) {
  const text = value >= 1000 ? `в ${num(value / 100 + 1)} раз` : pct(value);
  return <span className={value > 0 ? css.up : value < 0 ? css.down : css.flat}>{text}</span>;
}

/** Круглая «аватарка» строки в тёмной панели — знак КФБ, как значки счетов в интерфейсах банков. */
function Avatar() {
  return (
    <span className={css.avatar} aria-hidden="true">
      <Image src="/brand/kse-mark.png" alt="" width={18} height={17} />
    </span>
  );
}

export default async function KapitalConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const traded = data.instruments.filter((item) => item.volume > 0);
  const total = traded.reduce((sum, item) => sum + item.volume, 0);
  const leader = traded[0];
  const points = data.indexSeries.map(({ date, value }) => ({ date, value }));
  const years = new Date().getFullYear() - 1994;
  const sessionText = data.live ? `Сессия ${longDate(data.session.date)}` : "Демонстрационные значения";
  const segMax = Math.max(1, ...data.tradingRows.map((r) => r.value));

  // Панели второго экрана — тёмные «окна продукта» с реальными данными.
  const panelHead = (title: string, tabs: string[]) => (
    <>
      <div className={css.panelTitle}>
        <b>{title}</b>
        <span className={css.panelBadge}>{sessionText}</span>
      </div>
      <div className={css.panelTabs} aria-hidden="true">
        {tabs.map((t, i) => (
          <span key={t} data-active={i === 0 || undefined}>
            {t}
          </span>
        ))}
      </div>
    </>
  );

  const quotesPanel = (
    <div className={css.panel}>
      {panelHead("Котировки", ["Самые активные", "Акции", "Облигации и ГЦБ"])}
      <div className={css.panelSummary}>
        <div>
          <small>Капитализация</small>
          <b className={css.panelBig}>
            {num(data.index.capitalization, 1)}
            <sup> млрд сом</sup>
          </b>
        </div>
        <div>
          <small>Объём сессии</small>
          <b>{num(data.volume.volumeMln, 2)} млн</b>
        </div>
        <div>
          <small>Сделок</small>
          <b>{num(data.volume.trades)}</b>
        </div>
      </div>
      <div className={css.panelHeadRow} aria-hidden="true">
        <span>Бумага</span>
        <span>Цена, сом</span>
      </div>
      <ul className={css.panelRows}>
        {priced.slice(0, 6).map((q) => (
          <li key={q.ticker}>
            <Link href={q.href}>
              <Avatar />
              <span>
                <b>{q.ticker}</b>
                <small>{q.name}</small>
              </span>
              <span className={css.panelNum}>{num(q.price, 2)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  const indexPanel = (
    <div className={css.panel}>
      {panelHead("Индекс KSE", ["История", "Сегменты"])}
      <div className={css.panelSummary}>
        <div>
          <small>Значение</small>
          <b className={css.panelBig}>{num(data.index.value, 2)}</b>
        </div>
        <div>
          <small>Изменение</small>
          <b>
            <Change value={data.index.change} />
          </b>
        </div>
      </div>
      {points.length > 1 ? (
        <div className={css.panelChart}>
          <IndexChart css={css} points={points} />
        </div>
      ) : null}
    </div>
  );

  const gcbPanel = (
    <div className={css.panel}>
      {panelHead("Аукционы ГЦБ", ["Календарь", "Итоги"])}
      <ul className={css.panelRows}>
        {data.auctions.map((a) => (
          <li key={`${a.date}-${a.type}`}>
            <Link href="/gcb">
              <Avatar />
              <span>
                <b>{a.type}</b>
                <small>
                  {a.date} · {a.status}
                </small>
              </span>
              <span className={css.panelNum}>{a.volume}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  const disclosurePanel = (
    <div className={css.panel}>
      {panelHead("Раскрытие информации", ["Сообщения", "Эмитенты"])}
      <div className={css.panelSummary}>
        <div>
          <small>Эмитентов</small>
          <b className={css.panelBig}>{num(data.issuers)}</b>
        </div>
        <div>
          <small>В листинге</small>
          <b>{num(data.listed)}</b>
        </div>
      </div>
      <ul className={css.panelRows}>
        {data.companyNews.map((n) => (
          <li key={n.slug}>
            <Link href={`/news/${n.slug}`}>
              <Avatar />
              <span>
                <b>{n.title}</b>
                <small>{n.date}</small>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <ConceptPage accent="#5266eb">
      <div className={`${css.page} ${font.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        {/* Шапка поверх первого экрана. */}
        <header className={css.header}>
          <Link href="/design-concepts/kapital" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={30} height={28} priority />
            <span>KSE</span>
          </Link>
          <nav className={css.nav} aria-label="Основное меню">
            {menus.map((m) => (
              <details key={m.label} className={css.drop}>
                <summary>
                  {m.label}
                  <svg viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M2.5 4.5 6 8l3.5-3.5" />
                  </svg>
                </summary>
                <div className={css.dropPanel}>
                  {m.links.map((l) => (
                    <Link key={l.href} href={l.href} {...linkProps(l.href)}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              </details>
            ))}
            <Link href="/gcb" className={css.navLink}>
              ГЦБ
            </Link>
          </nav>
          <div className={css.headActions}>
            <Link href="/contacts" className={css.login}>
              Контакты
            </Link>
            <Link href="/members" className={css.pillBlue}>
              Открыть счёт
            </Link>
          </div>
          <details className={css.menu}>
            <summary>Меню</summary>
            <nav aria-label="Меню (мобильное)">
              {menus.flatMap((m) => m.links).map((l) => (
                <Link key={l.href} href={l.href} {...linkProps(l.href)}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </details>
        </header>

        <main id="main">
          {/* 1. Фото-пейзаж на весь экран. */}
          <section className={css.hero} aria-labelledby="kp-hero">
            <span className={css.heroPhoto} data-parallax="0.18">
              <Image src="/hero/bishkek-ala-too.jpg" alt="" fill priority sizes="100vw" />
            </span>
            <div className={css.heroInner}>
              <h1 id="kp-hero" data-intro="words">
                <Words text="Фондовый рынок, открытый каждому" />
              </h1>
              <p data-intro="rise" style={{ "--kc-d": "300ms" } as CSSProperties}>
                Котировки, индекс и отчётность эмитентов — онлайн. Сделки — через лицензированных участников торгов.
              </p>
              <div className={css.heroActions} data-intro="rise" style={{ "--kc-d": "420ms" } as CSSProperties}>
                <form action="/search" role="search" className={css.pillForm}>
                  <label htmlFor="kp-q" className={css.srOnly}>
                    Тикер или эмитент
                  </label>
                  <input id="kp-q" name="q" type="search" placeholder="Тикер или эмитент" />
                  <button type="submit" className={css.pillBlue}>
                    Найти
                  </button>
                </form>
                <Link href="/market/quotes" className={css.pillGhost}>
                  Котировки
                </Link>
              </div>
            </div>
            {data.contacts.license ? (
              <p className={css.heroNote}>ЗАО «Кыргызская фондовая биржа» — лицензия {data.contacts.license}. Сделки — через лицензированных участников торгов.</p>
            ) : null}
          </section>

          {/* 2. Тёмная секция: аккордеон + большая панель интерфейса. */}
          <section className={`${css.dark} ${css.block}`} aria-labelledby="kp-all">
            <div className={css.wrapWide}>
              <Showcase
                intro={
                  <h2 id="kp-all" className={css.h3}>
                    Весь рынок ценных бумаг.
                    <br />В одном месте.
                  </h2>
                }
                items={[
                  { title: "Котировки и сделки", text: "Цены, объёмы и число сделок по каждой бумаге — по итогам торговой сессии.", panel: quotesPanel },
                  { title: "Индекс KSE", text: "Главный индикатор рынка и его история — с подсказкой по каждой сессии.", panel: indexPanel },
                  { title: "Аукционы ГЦБ", text: "Календарь размещений государственных ценных бумаг Министерства финансов.", panel: gcbPanel },
                  { title: "Раскрытие информации", text: "Отчёты и существенные факты эмитентов в открытом доступе.", panel: disclosurePanel },
                ]}
              />
              <Link href="/market/quotes" className={css.underline}>
                Все котировки
              </Link>
            </div>
          </section>

          {/* 3. Тёмная: заголовок, лента логотипов партнёров, карточки аудиторий. */}
          <section className={`${css.dark} ${css.block}`} aria-labelledby="kp-trust">
            <h2 id="kp-trust" className={css.centerHead} data-reveal>
              {num(data.issuers)} эмитентов,
              <br />
              биржи и регуляторы-партнёры
            </h2>
            {data.partners.length ? (
              <div className={css.logos}>
                <ul className={css.logosTrack}>
                  {[...data.partners, ...data.partners].map((p, i) => (
                    <li key={`${p.slug}-${i}`} aria-hidden={i >= data.partners.length || undefined}>
                      <Link href={`/about/partners/${p.slug}`} tabIndex={i >= data.partners.length ? -1 : undefined} title={p.name}>
                        {p.logo ? <Image src={p.logo} alt={p.mark} width={140} height={48} unoptimized /> : <b>{p.mark}</b>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <Stories items={audiences} />
          </section>

          {/* 4. Светлая тёплая: серые плитки-«интерфейсы». */}
          <section className={`${css.warm} ${css.block}`} aria-labelledby="kp-easy">
            <div className={css.wrap}>
              <h2 id="kp-easy" className={css.ruleHead} data-reveal>
                Инвестировать сложно. Начать — просто.
              </h2>
              <ul className={css.tiles} data-stagger>
                <li>
                  <span className={css.tile}>
                    {leader ? (
                      <span className={css.miniCard} data-tilt>
                        <span className={css.miniCardTop}>
                          <i aria-hidden="true" /> Лидер сессии
                          <b>KSE</b>
                        </span>
                        <span className={css.miniCardBig}>{leader.ticker}</span>
                        <span className={css.miniCardBottom}>
                          {num(leader.price, 2)} сом · {num((leader.volume / (total || 1)) * 100, 1)}% оборота
                        </span>
                      </span>
                    ) : null}
                  </span>
                  <b>Видно, что торгуется</b>
                  <p>Лидеры сессии и недели, цены и объёмы — сразу на главной.</p>
                </li>
                <li>
                  <span className={css.tile}>
                    <span className={css.miniDoc}>
                      <b>Аукцион ГЦБ</b>
                      {data.auctions.slice(0, 2).map((a) => (
                        <span key={`${a.date}-${a.type}`} className={css.miniDocRow}>
                          <span>{a.date}</span>
                          <span>{a.volume}</span>
                        </span>
                      ))}
                    </span>
                    {data.auctions[0] ? <span className={`${css.float} ${css.floatA}`}>{data.auctions[0].type}</span> : null}
                    {data.auctions[0] ? <span className={`${css.float} ${css.floatB}`}>{data.auctions[0].status}</span> : null}
                  </span>
                  <b>Календарь ГЦБ под рукой</b>
                  <p>Даты, выпуски и объёмы ближайших аукционов государственных ценных бумаг.</p>
                </li>
                <li>
                  <span className={css.tile}>
                    {data.history.length > 1 ? (
                      <span className={css.miniChart} data-tilt>
                        <small>Индекс KSE</small>
                        <b>{num(data.index.value, 2)}</b>
                        <svg viewBox="0 0 240 70" preserveAspectRatio="none" aria-hidden="true">
                          <path d={linePath(data.history, 240, 70, 4)} pathLength={1} />
                        </svg>
                      </span>
                    ) : null}
                  </span>
                  <b>Индекс в одном взгляде</b>
                  <p>История индекса KSE с подсказкой по каждой торговой сессии.</p>
                </li>
                <li>
                  <span className={css.tile}>
                    <span className={css.uploaded}>
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M3 8.5 6.5 12 13 4.5" />
                      </svg>
                      Отчётность: {num(data.issuers)} эмитентов
                    </span>
                  </span>
                  <b>Отчёты эмитентов открыты</b>
                  <p>Существенные факты и отчётность компаний — в Центре раскрытия информации.</p>
                </li>
              </ul>
            </div>
            <p className={css.statement} data-reveal>Сделки на бирже заключаются только через лицензированных участников торгов — так рынок остаётся прозрачным.</p>
          </section>

          {/* 5. Светлая холодная: аккордеоны с высоким визуалом, сетка 2×2, центральный заголовок. */}
          <section className={`${css.cool} ${css.block}`} aria-label="Как начать и инструменты">
            <div className={css.wrap}>
              <Showcase
                items={steps.map((s) => ({ title: s.title, text: s.text }))}
                visual={
                  <span className={css.tall}>
                    <Image src="/carousel/meeting.jpg" alt="" fill sizes="(max-width: 767px) 100vw, 480px" />
                  </span>
                }
              />
              <Showcase
                side="left"
                items={[
                  { title: "Государственные ценные бумаги", text: "Казначейские векселя и облигации Министерства финансов — через аукционы на бирже." },
                  { title: "Акции и облигации компаний", text: "Бумаги эмитентов из официального списка и вне листинга — с раскрытой отчётностью." },
                  { title: "Драгоценные металлы", text: "Сертификаты на золотые слитки — в секторе драгоценных металлов биржи." },
                ]}
                visual={
                  <span className={css.tall}>
                    <Image src="/hub/hub-gcb.jpg" alt="" fill sizes="(max-width: 767px) 100vw, 480px" />
                  </span>
                }
              />

              <h2 className={css.ruleHead} data-reveal>Работайте с рынком как профессионал</h2>
              <ul className={css.tiles} data-stagger>
                <li>
                  <span className={css.tile}>
                    <span className={css.miniBars}>
                      {data.tradingRows.map((r) => (
                        <span key={r.label}>
                          <small>{r.label}</small>
                          <i style={{ width: `${Math.max(3, (r.value / segMax) * 100)}%` }} />
                        </span>
                      ))}
                    </span>
                  </span>
                  <b>Сегменты рынка</b>
                  <p>Объём торгов по сегментам: первичный и вторичный рынок, листинг и нелистинг.</p>
                </li>
                <li>
                  <span className={`${css.tile} ${css.tileDark}`}>
                    <span className={css.miniList}>
                      {data.leaders.slice(0, 4).map((r) => (
                        <span key={r.ticker}>
                          <b>{r.ticker}</b>
                          <span>{num(r.volume, 1)}</span>
                        </span>
                      ))}
                    </span>
                  </span>
                  <b>Лидеры недели</b>
                  <p>Бумаги с наибольшим объёмом сделок за неделю.</p>
                </li>
                <li>
                  <Link href={EDU_URL} {...linkProps(EDU_URL)} className={css.tileLink}>
                    <span className={css.tile}>
                      <Image src="/hub/hub-education.jpg" alt="" fill sizes="(max-width: 767px) 100vw, 480px" />
                    </span>
                    <b>Учебный центр</b>
                    <p>Курсы и семинары по рынку ценных бумаг для инвесторов и специалистов.</p>
                  </Link>
                </li>
                <li>
                  <Link href="/documents" className={css.tileLink}>
                    <span className={css.tile}>
                      <Image src="/hub/hub-disclosure.jpg" alt="" fill sizes="(max-width: 767px) 100vw, 480px" />
                    </span>
                    <b>Документы биржи</b>
                    <p>Правила торгов, тарифы и нормативные документы.</p>
                  </Link>
                </li>
              </ul>
              <h2 className={css.centerHead} data-reveal>
                Рынок для долгой работы.
                <br />С 1994 года.
              </h2>
            </div>
          </section>

          {/* 6. Тёмная: цифры, защита, новости, призыв, две карточки. */}
          <section className={`${css.dark} ${css.block}`} aria-labelledby="kp-stats">
            <div className={css.wrap}>
              <h2 id="kp-stats" className={css.srOnly}>
                Биржа в цифрах
              </h2>
              <dl className={css.stats} data-stagger>
                <div>
                  <dd data-count={data.issuers}>{num(data.issuers)}</dd>
                  <dt>эмитентов</dt>
                </div>
                <div>
                  <dd data-count={data.listed}>{num(data.listed)}</dd>
                  <dt>в официальном списке</dt>
                </div>
                <div>
                  <dd data-count={data.index.capitalization} data-digits="1">
                    {num(data.index.capitalization, 1)}
                  </dd>
                  <dt>млрд сом капитализация</dt>
                </div>
                <div>
                  <dd data-count={years}>{num(years)}</dd>
                  <dt>лет работы</dt>
                </div>
              </dl>

              <h2 className={css.ruleHead} data-reveal>Защита инвестора начинается с правил.</h2>
              <ul className={css.guard} data-stagger>
                <li>
                  <span className={css.guardVisual}>
                    <span className={css.barTall}>
                      <small>{num(data.issuers)} эмитентов</small>
                    </span>
                    <span className={css.barShort} style={{ height: `${Math.max(8, (data.listed / Math.max(1, data.issuers)) * 100)}%` }}>
                      <small>{num(data.listed)} в листинге</small>
                    </span>
                  </span>
                  <b>Отчётность для всех</b>
                  <p>Все эмитенты раскрывают информацию, а бумаги официального списка проходят требования листинга.</p>
                </li>
                <li>
                  <span className={css.guardVisual}>
                    <span className={css.license}>{data.contacts.license ? data.contacts.license.split(" ")[0] : "НКРЦБ"}</span>
                  </span>
                  <b>Лицензия регулятора</b>
                  <p>{data.contacts.license ? `Биржа работает по лицензии ${data.contacts.license}.` : "Биржа работает по лицензии регулятора рынка ценных бумаг."}</p>
                </li>
                <li>
                  <span className={css.guardVisual}>
                    <span className={css.toggles} aria-hidden="true">
                      <i />
                      <i />
                      <i data-on />
                    </span>
                  </span>
                  <b>Только через брокеров</b>
                  <p>Сделки заключают лицензированные участники торгов — их список открыт на сайте.</p>
                </li>
              </ul>

              {data.news.length ? (
                <>
                  <h2 className={css.plainHead} data-reveal>Новости биржи</h2>
                  <ul className={css.press} data-stagger>
                    {data.news.slice(0, 3).map((n) => (
                      <li key={n.slug}>
                        <Link href={`/news/${n.slug}`}>
                          <span className={css.pressTile}>
                            <Image src={mediaSrc(n.photo)} alt="" fill sizes="(max-width: 767px) 90vw, 260px" unoptimized />
                          </span>
                          <b>{n.title}</b>
                          <span className={css.arrow} aria-hidden="true">
                            <svg viewBox="0 0 16 16">
                              <path d="M3 8h10M9 4l4 4-4 4" />
                            </svg>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              <div className={css.closing}>
                <h2 className={css.centerHead} data-reveal>
                  Фондовый рынок —
                  <br />
                  понятный с первого шага.
                </h2>
                <div className={css.closingActions}>
                  <Link href="/members" className={css.pillBlue}>
                    Выбрать брокера
                  </Link>
                  <Link href="/contacts" className={css.pillGray}>
                    Связаться с биржей
                  </Link>
                </div>
              </div>

              <div className={css.duo} data-stagger>
                <div>
                  <b>КФБ для инвесторов</b>
                  <p>Котировки, индекс, аукционы ГЦБ и учебный центр — всё, чтобы начать.</p>
                  <Link href="/investors" className={css.pillSmall}>
                    Как начать
                  </Link>
                </div>
                <div>
                  <b>КФБ для компаний</b>
                  <p>Листинг, размещение облигаций и раскрытие информации по правилам биржи.</p>
                  <Link href="/listing" className={css.pillSmall}>
                    Условия листинга
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className={`${css.dark} ${css.footer}`}>
          <div className={css.wrap}>
            <div className={css.footGrid}>
              {menus.map((m) => (
                <nav key={m.label} aria-label={m.label}>
                  <b>{m.label}</b>
                  {m.links.map((l) => (
                    <Link key={l.href} href={l.href} {...linkProps(l.href)}>
                      {l.label}
                    </Link>
                  ))}
                </nav>
              ))}
              <div>
                <b>Контакты</b>
                {data.contacts.address ? <span>{data.contacts.address}</span> : null}
                {data.contacts.phones.map((phone) => (
                  <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                    {phone}
                  </a>
                ))}
                {data.contacts.email ? <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a> : null}
              </div>
            </div>
            <div className={css.legal}>
              <span>Правовая информация</span>
              <p>
                {data.contacts.copyright}
                {data.contacts.license ? `. Лицензия ${data.contacts.license}.` : "."} Котировки, индекс и итоги торгов публикуются по данным торговых сессий биржи.
                Информация на сайте не является инвестиционной рекомендацией. Сделки с ценными бумагами заключаются через лицензированных участников торгов.
              </p>
            </div>
          </div>
        </footer>
        <ConceptSwitch current="kapital" />
      </div>
    </ConceptPage>
  );
}
