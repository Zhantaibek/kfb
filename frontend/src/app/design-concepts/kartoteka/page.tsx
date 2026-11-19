import type { Metadata } from "next";
import { Jost } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { FullChart, ThemeButton } from "../_shared/FullChart";
import { Delta, Feed, Leaders, MarketTabs, Partners, QuotesTable, Trades, TradingRows } from "../_shared/FullBlocks";
import { ext, heroSlides, homeServices, homeSteps, loadFullHome, marketMenu, siteNav } from "../_shared/full-home";
import { linkProps, longDate, num, pct } from "../_shared/data";
import css from "./kartoteka.module.css";

/*
 * Концепция 74 — «Картотека». Разделы главной — папки картотеки с ярлыками: ярлыки девяти папок
 * стоят в ряд по ширине и служат навигацией, а при прокрутке папки ложатся одна на другую стопкой
 * (position: sticky), так что все ярлыки остаются видны. Папки через одну — бумажные и сочно-бирюзовые.
 * Геометрический шрифт Jost. Всё содержимое главной.
 */
const jost = Jost({ subsets: ["latin", "cyrillic"], variable: "--f-body", display: "swap" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "74 · Картотека" };

type Tone = "paper" | "soft" | "teal" | "deep";
const folders: { id: string; label: string; tone: Tone }[] = [
  { id: "glavnaya", label: "Главная", tone: "paper" },
  { id: "vozmozhnosti", label: "Возможности", tone: "teal" },
  { id: "indeks", label: "Индекс", tone: "paper" },
  { id: "torgi", label: "Торги", tone: "teal" },
  { id: "kotirovki", label: "Котировки", tone: "paper" },
  { id: "uslugi", label: "Услуги", tone: "teal" },
  { id: "novosti", label: "Новости", tone: "paper" },
  { id: "start", label: "Как начать", tone: "teal" },
  { id: "partnery", label: "Партнёры", tone: "paper" },
];
const photos = ["/hero/bishkek-ala-too.jpg", "/carousel/meeting.jpg", "/carousel/trading.jpg", "/carousel/city.jpg"];

function Folder({ i, children }: { i: number; children: ReactNode }) {
  const f = folders[i];
  return (
    <section id={f.id} className={css.folder} data-tone={f.tone} style={{ "--i": i } as CSSProperties} aria-labelledby={`${f.id}-tab`}>
      <a href={`#${f.id}`} id={`${f.id}-tab`} className={css.tab}>
        <small>{String(i + 1).padStart(2, "0")}</small> {f.label}
      </a>
      <div className={css.sheet}>{children}</div>
    </section>
  );
}

export default async function KartotekaConcept() {
  const f = await loadFullHome();
  const { data } = f;

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${jost.variable}`} id="kartoteka-root" data-theme="light">
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <div className={css.wrap}>
            <Link href="/design-concepts/kartoteka" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={40} height={37} priority />
              <span>
                Кыргызская
                <br />
                фондовая биржа
              </span>
            </Link>
            <nav aria-label="Основные разделы" className={css.nav}>
              {siteNav.map((item) => (
                <Link key={item.label} href={item.href} {...linkProps(item.href)}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className={css.tools}>
              <span className={css.tool}>RU</span>
              <Link href="/search" className={css.tool} aria-label="Поиск">
                ⌕
              </Link>
              <ThemeButton rootId="kartoteka-root" className={css.tool} />
              <Link href="/login" className={css.btn}>
                Войти
              </Link>
            </div>
          </div>
        </header>

        <main id="main" className={`${css.wrap} ${css.drawer}`}>
          {/* 01 — главная */}
          <Folder i={0}>
            <div className={css.heroGrid}>
              <div className={css.heroText}>
                {f.urgent.length ? (
                  <p className={css.urgent}>
                    <b>Срочно</b>
                    {f.urgent.map((u) => (
                      <Link key={u.key} href={u.href} {...ext(u.external)}>
                        {u.date} · {u.title} →
                      </Link>
                    ))}
                  </p>
                ) : null}
                <h1>{heroSlides[0].title}</h1>
                <p>{heroSlides[0].text}</p>
                <div className={css.btns}>
                  <Link href={heroSlides[0].primary.href} className={css.btn}>
                    {heroSlides[0].primary.label}
                  </Link>
                  <Link href={heroSlides[0].secondary.href} className={css.btnLine}>
                    {heroSlides[0].secondary.label} →
                  </Link>
                </div>
                <dl className={css.figs}>
                  <div>
                    <dt>Индекс KSE</dt>
                    <dd>
                      {num(data.index.value, 2)} <Delta value={data.index.change} css={css} />
                    </dd>
                  </div>
                  <div>
                    <dt>Капитализация, млрд</dt>
                    <dd>{num(data.index.capitalization, 1)}</dd>
                  </div>
                  <div>
                    <dt>Объём, млн сом</dt>
                    <dd>
                      {num(data.volume.volumeMln, 4)} <Delta value={data.volume.volumeChange} css={css} />
                    </dd>
                  </div>
                  <div>
                    <dt>Инструменты · сделки</dt>
                    <dd>
                      {data.quotes.total} · {num(data.volume.trades)}
                    </dd>
                  </div>
                </dl>
              </div>
              <span className={css.heroPhoto}>
                <Image src={photos[0]} alt="" fill priority sizes="(max-width: 1100px) 100vw, 45vw" />
                <span className={css.stamp}>
                  {data.session.label}
                  <br />
                  {data.session.date} · {data.session.hours}
                </span>
              </span>
            </div>
              <div className={css.tape} aria-label="Котировки последней сессии">
                <div className={css.tapeTrack}>
                  {[...f.priced, ...f.priced].map((item, i) => (
                    <Link key={`${item.ticker}-${i}`} href={item.href} aria-hidden={i >= f.priced.length || undefined} tabIndex={i >= f.priced.length ? -1 : undefined}>
                      <b>{item.ticker}</b> {num(item.price, 2)}
                      {item.volume ? <small>{num(item.volume, 2)}</small> : null}
                    </Link>
                  ))}
                </div>
              </div>
          </Folder>

          {/* 02 — возможности */}
          <Folder i={1}>
            <h2>Больше возможностей на бирже</h2>
            <div className={css.three}>
              {heroSlides.slice(1).map((s, i) => (
                <article key={s.title} className={css.card}>
                  <span className={css.photo}>
                    <Image src={photos[i + 1]} alt="" fill sizes="(max-width: 1100px) 100vw, 30vw" />
                  </span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                  <span className={css.links}>
                    <Link href={s.primary.href}>{s.primary.label} →</Link>
                    <Link href={s.secondary.href}>{s.secondary.label}</Link>
                  </span>
                </article>
              ))}
            </div>
          </Folder>

          {/* 03 — индекс */}
          <Folder i={2}>
            <div className={css.sheetHead}>
              <h2>Рынок сегодня</h2>
              <nav aria-label="Разделы рынка" className={css.menu}>
                {marketMenu.map((m) => (
                  <Link key={m.label} href={m.href}>
                    {m.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className={css.indexGrid}>
              {data.indexSeries.length > 1 ? <FullChart series={data.indexSeries} change={pct(data.index.change)} css={css} /> : null}
              <div>
                <h3>Итоги торгов {data.session.date}</h3>
                <TradingRows f={f} css={css} />
              </div>
            </div>
          </Folder>

          {/* 04 — торги */}
          <Folder i={3}>
            <div className={css.tradeGrid}>
              <div className={`${css.card} ${css.tableWrap}`}>
                <h3>Рынки</h3>
                <MarketTabs f={f} css={css} />
              </div>
              <div className={css.card}>
                <h3>Сделки {data.session.date}</h3>
                <Trades f={f} css={css} />
              </div>
              <div className={css.card}>
                <h3>Лидеры недели, тыс. сом</h3>
                <Leaders f={f} css={css} />
              </div>
            </div>
          </Folder>

          {/* 05 — котировки и ГЦБ */}
          <Folder i={4}>
            <div className={css.quoteGrid}>
              <div className={css.tableWrap}>
                <div className={css.sheetHead}>
                  <h2>Котировки</h2>
                  <Link href="/market/quotes" className={css.more}>
                    Все инструменты →
                  </Link>
                </div>
                <QuotesTable f={f} css={css} limit={9} />
              </div>
              <div className={css.gcb}>
                <h3>Аукционы ГЦБ</h3>
                {data.auctions.length ? (
                  data.auctions.map((a) => (
                    <div key={`${a.date}-${a.type}`} className={css.auction}>
                      <b>{a.date}</b>
                      <span>{a.type}</span>
                      <small>
                        {a.volume} · {a.status}
                      </small>
                    </div>
                  ))
                ) : (
                  <p>Расписание аукционов публикуется на странице ГЦБ.</p>
                )}
                <Link href="/gcb" className={css.btnLight}>
                  Календарь аукционов
                </Link>
              </div>
            </div>
          </Folder>

          {/* 06 — услуги */}
          <Folder i={5}>
            <h2>Наши услуги</h2>
            <div className={css.services}>
              {homeServices.map((s, i) => (
                <Link key={s.title} href={s.href} className={css.service} {...linkProps(s.href)}>
                  <small>{String(i + 1).padStart(2, "0")}</small>
                  <b>{s.title}</b>
                  <span>{s.text}</span>
                  <i aria-hidden="true">→</i>
                </Link>
              ))}
            </div>
          </Folder>

          {/* 07 — новости */}
          <Folder i={6}>
            <div className={css.newsGrid}>
              {f.lead ? (
                <Link href={`/news/${f.lead.slug}`} className={css.lead}>
                  <span className={css.photo}>
                    <Image src={f.lead.photo} alt="" fill sizes="(max-width: 1100px) 100vw, 40vw" />
                  </span>
                  <small>{longDate(f.lead.date)}</small>
                  <b>{f.lead.title}</b>
                  <span>{f.lead.excerpt}</span>
                </Link>
              ) : null}
              <div>
                <div className={css.sheetHead}>
                  <h3>Новости биржи</h3>
                  <Link href="/news" className={css.more}>
                    Все →
                  </Link>
                </div>
                <Feed items={f.exchangeFeed} css={css} limit={5} />
              </div>
              <div>
                <div className={css.sheetHead}>
                  <h3>Новости компаний</h3>
                  <Link href="/disclosure" className={css.more}>
                    Все →
                  </Link>
                </div>
                <Feed items={f.companyFeed} css={css} limit={5} />
              </div>
            </div>
          </Folder>

          {/* 08 — как начать */}
          <Folder i={7}>
            <h2>Как начать инвестировать</h2>
            <ol className={css.steps}>
              {homeSteps.map((s, i) => (
                <li key={s.title}>
                  <span className={css.stepN}>{i + 1}</span>
                  <b>{s.title}</b>
                  <span>{s.text}</span>
                  <Link href={s.href} {...linkProps(s.href)}>
                    {s.link} →
                  </Link>
                </li>
              ))}
            </ol>
          </Folder>

          {/* 09 — партнёры */}
          <Folder i={8}>
            <div className={css.sheetHead}>
              <h2>Наши партнеры</h2>
              <Link href="/about/partners" className={css.more}>
                Все партнеры →
              </Link>
            </div>
            <Partners f={f} css={css} />
          </Folder>
        </main>

        <footer className={css.footer}>
          <div className={`${css.wrap} ${css.footGrid}`}>
            <div>
              <b className={css.footLogo}>Кыргызская фондовая биржа</b>
              <p>{f.tagline}</p>
            </div>
            <div>
              <h3>Контакты</h3>
              {f.phones.map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                  {phone}
                </a>
              ))}
              <a href={`mailto:${f.email}`}>{f.email}</a>
              <span>{f.address}</span>
            </div>
            <div>
              <h3>Мы в соцсетях</h3>
              {f.socials.length ? (
                f.socials.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label} ↗
                  </a>
                ))
              ) : (
                <span>Ссылки на соцсети задаются в админке</span>
              )}
            </div>
          </div>
          <p className={`${css.wrap} ${css.legal}`}>
            {data.contacts.copyright}
            {data.contacts.license ? ` · Лицензия ${data.contacts.license}` : ""}
          </p>
        </footer>

        <ConceptSwitch current="kartoteka" />
      </div>
    </ConceptPage>
  );
}
