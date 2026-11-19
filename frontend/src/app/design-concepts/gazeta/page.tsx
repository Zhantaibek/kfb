import type { Metadata } from "next";
import { PT_Sans_Narrow, PT_Serif, Playfair_Display } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { FullChart, ThemeButton } from "../_shared/FullChart";
import { Delta, Feed, Leaders, MarketTabs, Partners, QuotesTable, Trades, TradingRows } from "../_shared/FullBlocks";
import { ext, heroSlides, homeServices, homeSteps, loadFullHome, marketMenu, siteNav } from "../_shared/full-home";
import { linkProps, longDate, num, pct } from "../_shared/data";
import css from "./gazeta.module.css";

/*
 * Концепция 71 — «Газета». Главная свёрстана как деловая газета: служебная строка с датой, крупный
 * заголовок биржи по центру между двойными линиями, меню под ним. Первая полоса в три колонки
 * с вертикальными линейками: слева срочное и цифры, в центре главный материал, справа лента новостей.
 * Разделы открываются бирюзовыми плашками-рубриками. Фирменная бирюза сайта. Всё содержимое главной.
 */
const head = Playfair_Display({ subsets: ["latin", "cyrillic"], variable: "--f-head", display: "swap" });
const body = PT_Serif({ subsets: ["latin", "cyrillic"], weight: ["400", "700"], variable: "--f-body", display: "swap" });
const narrow = PT_Sans_Narrow({ subsets: ["latin", "cyrillic"], weight: ["400", "700"], variable: "--f-mono", display: "swap" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "71 · Газета" };

const photos = ["/carousel/city.jpg", "/carousel/meeting.jpg", "/carousel/trading.jpg", "/landing/sust-service-img-3.jpg"];

function Rubric({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className={css.rubric}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export default async function GazetaConcept() {
  const f = await loadFullHome();
  const { data } = f;

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${head.variable} ${body.variable} ${narrow.variable}`} id="gazeta-root" data-theme="light">
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.wrap}>
          {/* ——— Служебная строка ——— */}
          <div className={css.topline}>
            <span className={css.live} data-open={data.session.open ? "" : undefined}>
              <i aria-hidden="true" /> {data.session.label}
            </span>
            <span>
              Торги {data.session.date} · {data.session.hours}
            </span>
            <Link href="/market/index" className={css.topIndex}>
              Индекс KSE <b>{num(data.index.value, 2)}</b> <Delta value={data.index.change} css={css} />
            </Link>
            <span className={css.topTools}>
              <span className={css.tool}>RU</span>
              <Link href="/search" className={css.tool} aria-label="Поиск">
                ⌕
              </Link>
              <ThemeButton rootId="gazeta-root" className={css.tool} />
              <Link href="/login" className={css.btn}>
                Войти
              </Link>
            </span>
          </div>

          {/* ——— Заголовок-«шапка газеты» ——— */}
          <Link href="/design-concepts/gazeta" className={css.masthead} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={70} height={65} priority />
            <span className={css.mastTitle}>Кыргызская фондовая биржа</span>
            <span className={css.mastSub}>Основана в 1994 году · Бишкек · Рынок ценных бумаг Кыргызской Республики</span>
          </Link>

          <nav aria-label="Основные разделы" className={css.nav}>
            {siteNav.map((item) => (
              <Link key={item.label} href={item.href} {...linkProps(item.href)}>
                {item.label}
              </Link>
            ))}
          </nav>

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
        </header>

        <main id="main" className={css.wrap}>
          {/* ——— Первая полоса ——— */}
          <section className={css.front}>
            <aside className={css.colLeft}>
              {f.urgent.length ? (
                <section className={css.urgent} aria-label="Срочное объявление">
                  <p className={css.label}>Срочно</p>
                  {f.urgent.map((u) => (
                    <Link key={u.key} href={u.href} {...ext(u.external)}>
                      <small>{u.date}</small>
                      <b>{u.title}</b>
                      <em>Подробнее →</em>
                    </Link>
                  ))}
                </section>
              ) : null}
              <p className={css.label}>Цифры дня</p>
              <dl className={css.figures}>
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
                  <dt>Инструменты / сделки</dt>
                  <dd>
                    {data.quotes.total} / {num(data.volume.trades)}
                  </dd>
                </div>
              </dl>
            </aside>

            <article className={css.colMain}>
              <span className={css.mainPhoto}>
                <Image src={photos[0]} alt="Бишкек" fill priority sizes="(max-width: 1100px) 100vw, 50vw" />
              </span>
              <p className={css.label}>Главное</p>
              <h1>{heroSlides[0].title}</h1>
              <p className={css.lede}>{heroSlides[0].text}</p>
              <div className={css.btns}>
                <Link href={heroSlides[0].primary.href} className={css.btn}>
                  {heroSlides[0].primary.label}
                </Link>
                <Link href={heroSlides[0].secondary.href} className={css.btnLine}>
                  {heroSlides[0].secondary.label} →
                </Link>
              </div>
            </article>

            <aside className={css.colRight}>
              <p className={css.label}>Последние новости</p>
              <Feed items={f.exchangeFeed} css={css} limit={7} />
              <Link href="/news" className={css.more}>
                Все новости →
              </Link>
            </aside>
          </section>

          {/* ——— Остальные слайды — три материала ——— */}
          <section className={css.three}>
            {heroSlides.slice(1).map((s, i) => (
              <article key={s.title}>
                <span className={css.threePhoto}>
                  <Image src={photos[i + 1]} alt="" fill sizes="(max-width: 1100px) 100vw, 33vw" />
                </span>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
                <span className={css.links}>
                  <Link href={s.primary.href}>{s.primary.label} →</Link>
                  <Link href={s.secondary.href}>{s.secondary.label}</Link>
                </span>
              </article>
            ))}
          </section>

          {/* ——— Рынок ——— */}
          <Rubric title="Рынок">
            <nav aria-label="Разделы рынка" className={css.rubricNav}>
              {marketMenu.map((m) => (
                <Link key={m.label} href={m.href}>
                  {m.label}
                </Link>
              ))}
            </nav>
          </Rubric>
          <section className={css.marketTop}>
            {data.indexSeries.length > 1 ? <FullChart series={data.indexSeries} change={pct(data.index.change)} css={css} /> : null}
            <div className={css.ruled}>
              <h3>Итоги торгов {data.session.date}</h3>
              <TradingRows f={f} css={css} />
            </div>
          </section>
          <section className={css.marketBottom}>
            <div className={css.tableWrap}>
              <h3>Рынки</h3>
              <MarketTabs f={f} css={css} />
            </div>
            <div className={css.ruled}>
              <h3>Сделки</h3>
              <Trades f={f} css={css} />
            </div>
            <div className={css.ruled}>
              <h3>Лидеры недели, тыс. сом</h3>
              <Leaders f={f} css={css} />
            </div>
          </section>

          {/* ——— Котировки и ГЦБ ——— */}
          <Rubric title="Котировки и ГЦБ">
            <Link href="/market/quotes" className={css.rubricMore}>
              Все инструменты →
            </Link>
          </Rubric>
          <section className={css.quotesRow}>
            <div className={css.tableWrap}>
              <QuotesTable f={f} css={css} limit={12} />
            </div>
            <aside className={`${css.ruled} ${css.gcb}`}>
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
                <p className={css.muted}>Расписание аукционов публикуется на странице ГЦБ.</p>
              )}
              <Link href="/gcb" className={css.btn}>
                Календарь аукционов
              </Link>
            </aside>
          </section>

          {/* ——— Услуги: справочник ——— */}
          <Rubric title="Наши услуги" />
          <section className={css.services}>
            {homeServices.map((s, i) => (
              <Link key={s.title} href={s.href} className={css.service} {...linkProps(s.href)}>
                <span className={css.serviceN}>{String(i + 1).padStart(2, "0")}</span>
                <b>{s.title}</b>
                <span>{s.text}</span>
                <em>Подробнее →</em>
              </Link>
            ))}
          </section>

          {/* ——— Новости ——— */}
          <Rubric title="Новости и обновления">
            <Link href="/news" className={css.rubricMore}>
              Все новости →
            </Link>
          </Rubric>
          <section className={css.newsRow}>
            {f.lead ? (
              <Link href={`/news/${f.lead.slug}`} className={css.lead}>
                <span className={css.leadPhoto}>
                  <Image src={f.lead.photo} alt="" fill sizes="(max-width: 1100px) 100vw, 60vw" />
                </span>
                <small>{longDate(f.lead.date)}</small>
                <b>{f.lead.title}</b>
                <span>{f.lead.excerpt}</span>
                <em>Читать далее →</em>
              </Link>
            ) : null}
            <div className={css.ruled}>
              <h3>Новости компаний</h3>
              <Feed items={f.companyFeed} css={css} limit={7} />
              <Link href="/disclosure" className={css.more}>
                Все сообщения →
              </Link>
            </div>
          </section>

          {/* ——— Как начать ——— */}
          <Rubric title="Как начать инвестировать">
            <span className={css.rubricNote}>Четыре шага от выбора брокера до первой сделки</span>
          </Rubric>
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

          {/* ——— Партнёры ——— */}
          {data.partners.length ? (
            <>
              <Rubric title="Наши партнеры">
                <Link href="/about/partners" className={css.rubricMore}>
                  Все партнеры →
                </Link>
              </Rubric>
              <Partners f={f} css={css} />
            </>
          ) : null}
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

        <ConceptSwitch current="gazeta" />
      </div>
    </ConceptPage>
  );
}
