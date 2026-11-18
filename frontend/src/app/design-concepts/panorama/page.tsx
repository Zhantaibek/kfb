import type { Metadata } from "next";
import { Golos_Text, Oswald } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { FullChart, ThemeButton } from "../_shared/FullChart";
import { Delta, Leaders, MarketTabs, NewsTabs, Partners, QuotesTable, Trades, TradingRows } from "../_shared/FullBlocks";
import { ext, heroSlides, homeServices, homeSteps, loadFullHome, marketMenu, siteNav } from "../_shared/full-home";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { Rail } from "./Rail";
import css from "./panorama.module.css";

/*
 * Концепция 72 — «Панорама». Главная листается вбок, как панорама: девять панелей в одну ленту,
 * колесо мыши двигает их горизонтально, внизу — главы и полоса прогресса. У каждой панели сбоку
 * вертикальная подпись главы. Узкий шрифт Oswald в заголовках, Golos Text в тексте, фирменная бирюза.
 * На телефоне панели идут обычной вертикальной лентой. Всё содержимое главной.
 */
const head = Oswald({ subsets: ["latin", "cyrillic"], variable: "--f-head", display: "swap" });
const body = Golos_Text({ subsets: ["latin", "cyrillic"], variable: "--f-body", display: "swap" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "72 · Панорама" };

const chapters = ["Главная", "Возможности", "Индекс", "Торги", "Котировки", "Услуги", "Новости", "Как начать", "Партнёры"];
const slidePhotos = ["/carousel/mountains.jpg", "/carousel/meeting.jpg", "/carousel/trading.jpg", "/carousel/office.jpg"];
const servicePhotos = ["/carousel/trading.jpg", "/landing/sust-service-img-1.jpg", "/carousel/city.jpg", "/carousel/gold.jpg", "/landing/sust-service-img-2.jpg", "/landing/sust-process-img-1.jpg"];

function Side({ n, title }: { n: number; title: string }) {
  return (
    <p className={css.side} aria-hidden="true">
      <b>{String(n).padStart(2, "0")}</b> / {String(chapters.length).padStart(2, "0")} · {title}
    </p>
  );
}

export default async function PanoramaConcept() {
  const f = await loadFullHome();
  const { data } = f;

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${head.variable} ${body.variable}`} id="panorama-root" data-theme="light">
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <div className={css.bar}>
            <Link href="/design-concepts/panorama" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={40} height={37} priority />
              <span>Кыргызская фондовая биржа</span>
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
              <ThemeButton rootId="panorama-root" className={css.tool} />
              <Link href="/login" className={css.btn}>
                Войти
              </Link>
            </div>
          </div>
          <div className={css.strip}>
            {f.urgent.length ? (
              <span className={css.urgent}>
                <b>Срочно</b>
                {f.urgent.map((u) => (
                  <Link key={u.key} href={u.href} {...ext(u.external)}>
                    {u.date} · {u.title} →
                  </Link>
                ))}
              </span>
            ) : null}
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
          </div>
        </header>

        <main id="main">
          <Rail chapters={chapters} css={css}>
            {/* 01 — первый экран */}
            <section className={`${css.panel} ${css.hero}`}>
              <Image src={slidePhotos[0]} alt="" fill priority sizes="92vw" className={css.cover} />
              <Side n={1} title="Главная" />
              <div className={css.heroText}>
                <p className={css.kicker}>С 1994 года · Бишкек</p>
                <h1>{heroSlides[0].title}</h1>
                <p>{heroSlides[0].text}</p>
                <div className={css.btns}>
                  <Link href={heroSlides[0].primary.href} className={css.btnLight}>
                    {heroSlides[0].primary.label}
                  </Link>
                  <Link href={heroSlides[0].secondary.href} className={css.btnGhost}>
                    {heroSlides[0].secondary.label} →
                  </Link>
                </div>
              </div>
              <dl className={css.heroFigs}>
                <div>
                  <dt>Индекс KSE</dt>
                  <dd>
                    {num(data.index.value, 2)} <Delta value={data.index.change} css={css} />
                  </dd>
                </div>
                <div>
                  <dt>Капитализация, млрд сом</dt>
                  <dd>{num(data.index.capitalization, 1)}</dd>
                </div>
                <div>
                  <dt>Объём торгов, млн сом</dt>
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
              <p className={css.hint} aria-hidden="true">
                Листайте вбок →
              </p>
            </section>

            {/* 02 — возможности (остальные слайды) */}
            <section className={`${css.panel} ${css.slides}`}>
              <Side n={2} title="Возможности" />
              <h2>Больше возможностей на бирже</h2>
              <div className={css.slideRow}>
                {heroSlides.slice(1).map((s, i) => (
                  <article key={s.title} className={css.slide}>
                    <span className={css.slidePhoto}>
                      <Image src={slidePhotos[i + 1]} alt="" fill sizes="30vw" />
                    </span>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                    <span className={css.links}>
                      <Link href={s.primary.href} className={css.btn}>
                        {s.primary.label}
                      </Link>
                      <Link href={s.secondary.href} className={css.btnLine}>
                        {s.secondary.label}
                      </Link>
                    </span>
                  </article>
                ))}
              </div>
            </section>

            {/* 03 — индекс и итоги */}
            <section className={`${css.panel} ${css.wide}`}>
              <Side n={3} title="Индекс" />
              <div className={css.panelHead}>
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
                <div className={css.box}>
                  <h3>
                    Итоги торгов <small>{data.session.date}</small>
                  </h3>
                  <TradingRows f={f} css={css} />
                </div>
              </div>
            </section>

            {/* 04 — торги */}
            <section className={`${css.panel} ${css.wide} ${css.tinted}`}>
              <Side n={4} title="Торги" />
              <div className={css.panelHead}>
                <h2>Торги сессии</h2>
                <p className={css.muted}>
                  {data.session.label} · {data.session.date} · {data.session.hours}
                </p>
              </div>
              <div className={css.tradeGrid}>
                <div className={`${css.box} ${css.tableWrap}`}>
                  <h3>Рынки</h3>
                  <MarketTabs f={f} css={css} />
                </div>
                <div className={css.box}>
                  <h3>Сделки</h3>
                  <Trades f={f} css={css} />
                </div>
                <div className={css.box}>
                  <h3>Лидеры недели, тыс. сом</h3>
                  <Leaders f={f} css={css} />
                </div>
              </div>
            </section>

            {/* 05 — котировки и ГЦБ */}
            <section className={`${css.panel} ${css.wide}`}>
              <Side n={5} title="Котировки" />
              <div className={css.panelHead}>
                <h2>Котировки и ГЦБ</h2>
                <Link href="/market/quotes" className={css.more}>
                  Все инструменты →
                </Link>
              </div>
              <div className={css.quoteGrid}>
                <div className={`${css.box} ${css.tableWrap}`}>
                  <QuotesTable f={f} css={css} limit={12} />
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
            </section>

            {/* 06 — услуги */}
            <section className={`${css.panel} ${css.dark}`}>
              <Side n={6} title="Услуги" />
              <h2>Наши услуги</h2>
              <div className={css.services}>
                {homeServices.map((s, i) => (
                  <Link key={s.title} href={s.href} className={css.service} {...linkProps(s.href)}>
                    <span className={css.servicePhoto}>
                      <Image src={servicePhotos[i]} alt="" fill sizes="20vw" />
                    </span>
                    <small>{String(i + 1).padStart(2, "0")}</small>
                    <b>{s.title}</b>
                    <span>{s.text}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* 07 — новости */}
            <section className={`${css.panel} ${css.wide}`}>
              <Side n={7} title="Новости" />
              <div className={css.panelHead}>
                <h2>Новости и обновления</h2>
                <p className={css.muted}>Объявления площадки, изменения правил и события рынка</p>
              </div>
              <div className={css.newsGrid}>
                {f.lead ? (
                  <Link href={`/news/${f.lead.slug}`} className={css.lead}>
                    <Image src={f.lead.photo} alt="" fill sizes="45vw" className={css.cover} />
                    <span className={css.leadText}>
                      <small>{longDate(f.lead.date)}</small>
                      <b>{f.lead.title}</b>
                      <span>{f.lead.excerpt}</span>
                    </span>
                  </Link>
                ) : null}
                <div className={css.box}>
                  <NewsTabs f={f} css={css} limit={6} moreClass={css.more} />
                </div>
              </div>
            </section>

            {/* 08 — как начать */}
            <section className={`${css.panel} ${css.soft}`}>
              <Side n={8} title="Как начать" />
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
            </section>

            {/* 09 — партнёры и контакты */}
            <section className={`${css.panel} ${css.wide}`}>
              <Side n={9} title="Партнёры" />
              <div className={css.panelHead}>
                <h2>Наши партнеры</h2>
                <Link href="/about/partners" className={css.more}>
                  Все партнеры →
                </Link>
              </div>
              {data.partners.length ? <Partners f={f} css={css} /> : null}
              <footer className={css.footer}>
                <div>
                  <b>Кыргызская фондовая биржа</b>
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
                  <small>
                    {data.contacts.copyright}
                    {data.contacts.license ? ` · Лицензия ${data.contacts.license}` : ""}
                  </small>
                </div>
              </footer>
            </section>
          </Rail>
        </main>

        <ConceptSwitch current="panorama" />
      </div>
    </ConceptPage>
  );
}
