import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Tenor_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { FullChart, ThemeButton } from "../_shared/FullChart";
import { Delta, Leaders, MarketTabs, NewsTabs, Partners, QuotesTable, Trades, TradingRows } from "../_shared/FullBlocks";
import { ext, heroSlides, homeServices, homeSteps, loadFullHome, marketMenu, siteNav } from "../_shared/full-home";
import { linkProps, longDate, num, pct } from "../_shared/data";
import css from "./ukazatel.module.css";

/*
 * Концепция 73 — «Указатель». Главная как оглавление: после короткого первого экрана — огромный
 * список разделов строками («01 Возможности», «02 Рынок»…), справа у каждой строки — живая цифра.
 * Строка раскрывается по клику и показывает содержимое раздела (нативные <details>, без скриптов).
 * Tenor Sans в заголовках, IBM Plex Sans в тексте, IBM Plex Mono в цифрах. Фирменная бирюза.
 */
const head = Tenor_Sans({ subsets: ["latin", "cyrillic"], weight: "400", variable: "--f-head", display: "swap" });
const body = IBM_Plex_Sans({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--f-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin", "cyrillic"], weight: ["400", "600"], variable: "--f-mono", display: "swap" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "73 · Указатель" };

const photos = ["/carousel/city.jpg", "/carousel/meeting.jpg", "/carousel/trading.jpg", "/landing/sust-service-img-3.jpg"];
const servicePhotos = ["/carousel/trading.jpg", "/landing/sust-service-img-1.jpg", "/carousel/city.jpg", "/carousel/gold.jpg", "/landing/sust-service-img-2.jpg", "/landing/sust-process-img-1.jpg"];

function Entry({ n, title, meta, open, children }: { n: number; title: string; meta: ReactNode; open?: boolean; children: ReactNode }) {
  return (
    <details className={css.entry} open={open}>
      <summary>
        <span className={css.n}>{String(n).padStart(2, "0")}</span>
        <span className={css.title}>{title}</span>
        <span className={css.meta}>{meta}</span>
        <span className={css.plus} aria-hidden="true" />
      </summary>
      <div className={css.body}>{children}</div>
    </details>
  );
}

export default async function UkazatelConcept() {
  const f = await loadFullHome();
  const { data } = f;

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${head.variable} ${body.variable} ${mono.variable}`} id="ukazatel-root" data-theme="light">
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <div className={css.wrap}>
            <Link href="/design-concepts/ukazatel" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={38} height={35} priority />
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
              <ThemeButton rootId="ukazatel-root" className={css.tool} />
              <Link href="/login" className={css.btn}>
                Войти
              </Link>
            </div>
          </div>
        </header>

        <main id="main">
          {/* ——— Первый экран: заголовок слева, «сегодня» справа ——— */}
          <section className={`${css.wrap} ${css.hero}`}>
            <div className={css.heroText}>
              <p className={css.kicker}>Кыргызская фондовая биржа · с 1994 года</p>
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
            </div>
            <aside className={css.today}>
              <span className={css.heroPhoto}>
                <Image src={photos[0]} alt="Бишкек" fill priority sizes="(max-width: 1100px) 100vw, 40vw" />
              </span>
              <p className={css.live} data-open={data.session.open ? "" : undefined}>
                <i aria-hidden="true" /> {data.session.label} · {data.session.date} · {data.session.hours}
              </p>
              <dl>
                <div>
                  <dt>Индекс KSE</dt>
                  <dd>
                    {num(data.index.value, 2)} <Delta value={data.index.change} css={css} />
                  </dd>
                </div>
                <div>
                  <dt>Капитализация</dt>
                  <dd>{num(data.index.capitalization, 1)} млрд</dd>
                </div>
                <div>
                  <dt>Объём торгов</dt>
                  <dd>
                    {num(data.volume.volumeMln, 4)} млн <Delta value={data.volume.volumeChange} css={css} />
                  </dd>
                </div>
                <div>
                  <dt>Инструменты · сделки</dt>
                  <dd>
                    {data.quotes.total} · {num(data.volume.trades)}
                  </dd>
                </div>
              </dl>
            </aside>
          </section>

          {f.urgent.length ? (
            <section className={css.urgent} aria-label="Срочное объявление">
              <div className={css.wrap}>
                <b>Срочно</b>
                {f.urgent.map((u) => (
                  <Link key={u.key} href={u.href} {...ext(u.external)}>
                    <time>{u.date}</time> {u.title} →
                  </Link>
                ))}
              </div>
            </section>
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

          {/* ——— Указатель разделов ——— */}
          <section className={css.wrap}>
            <div className={css.indexHead}>
              <h2>Содержание</h2>
              <p className={css.muted}>Нажмите на раздел, чтобы раскрыть его</p>
            </div>

            <Entry n={1} title="Возможности" meta="3 направления">
              <div className={css.slides}>
                {heroSlides.slice(1).map((s, i) => (
                  <article key={s.title}>
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
            </Entry>

            <Entry
              n={2}
              title="Рынок"
              open
              meta={
                <>
                  {num(data.index.value, 2)} <Delta value={data.index.change} css={css} />
                </>
              }
            >
              <nav aria-label="Разделы рынка" className={css.menu}>
                {marketMenu.map((m) => (
                  <Link key={m.label} href={m.href}>
                    {m.label}
                  </Link>
                ))}
              </nav>
              <div className={css.marketGrid}>
                {data.indexSeries.length > 1 ? <FullChart series={data.indexSeries} change={pct(data.index.change)} css={css} /> : null}
                <div>
                  <h3>Итоги торгов {data.session.date}</h3>
                  <TradingRows f={f} css={css} />
                </div>
              </div>
            </Entry>

            <Entry n={3} title="Торги сессии" meta={`${num(data.volume.trades)} сделок`}>
              <div className={css.tradeGrid}>
                <div className={css.tableWrap}>
                  <h3>Рынки</h3>
                  <MarketTabs f={f} css={css} />
                </div>
                <div>
                  <h3>Сделки</h3>
                  <Trades f={f} css={css} />
                </div>
                <div>
                  <h3>Лидеры недели, тыс. сом</h3>
                  <Leaders f={f} css={css} />
                </div>
              </div>
            </Entry>

            <Entry n={4} title="Котировки" meta={`${data.quotes.total} инструментов`}>
              <div className={css.tableWrap}>
                <QuotesTable f={f} css={css} limit={12} />
              </div>
              <Link href="/market/quotes" className={css.more}>
                Все инструменты →
              </Link>
            </Entry>

            <Entry n={5} title="Аукционы ГЦБ" meta={data.auctions.length ? `ближайший ${data.auctions[0].date}` : "расписание"}>
              <div className={css.auctions}>
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
              </div>
              <Link href="/gcb" className={css.btn}>
                Календарь аукционов
              </Link>
            </Entry>

            <Entry n={6} title="Наши услуги" meta="6 направлений">
              <div className={css.services}>
                {homeServices.map((s, i) => (
                  <Link key={s.title} href={s.href} className={css.service} {...linkProps(s.href)}>
                    <span className={css.photo}>
                      <Image src={servicePhotos[i]} alt="" fill sizes="(max-width: 1100px) 100vw, 30vw" />
                    </span>
                    <b>{s.title}</b>
                    <span>{s.text}</span>
                  </Link>
                ))}
              </div>
            </Entry>

            <Entry n={7} title="Новости" meta={f.lead ? longDate(f.lead.date) : "лента"}>
              <div className={css.newsGrid}>
                {f.lead ? (
                  <Link href={`/news/${f.lead.slug}`} className={css.lead}>
                    <span className={css.photo}>
                      <Image src={f.lead.photo} alt="" fill sizes="(max-width: 1100px) 100vw, 45vw" />
                    </span>
                    <small>{longDate(f.lead.date)}</small>
                    <b>{f.lead.title}</b>
                    <span>{f.lead.excerpt}</span>
                  </Link>
                ) : null}
                <NewsTabs f={f} css={css} limit={6} moreClass={css.more} />
              </div>
            </Entry>

            <Entry n={8} title="Как начать инвестировать" meta="4 шага">
              <ol className={css.steps}>
                {homeSteps.map((s, i) => (
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
            </Entry>

            <Entry n={9} title="Партнёры" meta={`${data.partners.length} организаций`}>
              <Partners f={f} css={css} />
              <Link href="/about/partners" className={css.more}>
                Все партнеры →
              </Link>
            </Entry>
          </section>
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

        <ConceptSwitch current="ukazatel" />
      </div>
    </ConceptPage>
  );
}
