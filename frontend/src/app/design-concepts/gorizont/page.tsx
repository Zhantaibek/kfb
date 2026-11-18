import type { Metadata } from "next";
import { Exo_2, JetBrains_Mono, Russo_One } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { FullChart, ThemeButton } from "../_shared/FullChart";
import { Delta, Feed, Leaders, MarketTabs, Partners, QuotesTable, Trades, TradingRows } from "../_shared/FullBlocks";
import { ext, heroSlides, homeServices, homeSteps, loadFullHome, marketMenu, siteNav } from "../_shared/full-home";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { Tabs } from "../_shared/Tabs";
import css from "./gorizont.module.css";

/*
 * Концепция 70 — «Горизонт». Первый экран построен вокруг данных: на тёмной бирюзе слева заголовок
 * и список остальных слайдов, справа — живой график индекса и четыре цифры. Ниже — полосы во всю
 * ширину, у каждой свой фон: услуги фото-карточками в бирюзовом тоне, рынок, котировки, новости,
 * шаги на линии. Фирменная бирюза сайта. Всё содержимое главной.
 */
const head = Russo_One({ subsets: ["latin", "cyrillic"], weight: "400", variable: "--f-head", display: "swap" });
const body = Exo_2({ subsets: ["latin", "cyrillic"], variable: "--f-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], variable: "--f-mono", display: "swap" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "70 · Горизонт" };

const slidePhotos = ["/carousel/meeting.jpg", "/carousel/trading.jpg", "/carousel/office.jpg"];
const servicePhotos = ["/carousel/trading.jpg", "/carousel/meeting.jpg", "/carousel/city.jpg", "/carousel/gold.jpg", "/landing/sust-service-img-2.jpg", "/landing/sust-process-img-2.jpg"];

export default async function GorizontConcept() {
  const f = await loadFullHome();
  const { data } = f;

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${head.variable} ${body.variable} ${mono.variable}`} id="gorizont-root" data-theme="dark">
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        {/* ——— Служебная строка + шапка ——— */}
        <div className={css.util}>
          <div className={css.wrap}>
            <span className={css.live} data-open={data.session.open ? "" : undefined}>
              <i aria-hidden="true" /> {data.session.label} · {data.session.date} · {data.session.hours}
            </span>
            <Link href="/market/index" className={css.utilIndex}>
              Индекс KSE <b>{num(data.index.value, 2)}</b> <Delta value={data.index.change} css={css} />
            </Link>
            <span className={css.utilTools}>
              <span className={css.tool}>RU</span>
              <Link href="/search" className={css.tool} aria-label="Поиск">
                ⌕
              </Link>
              <ThemeButton rootId="gorizont-root" className={css.tool} initialDark />
            </span>
          </div>
        </div>
        <header className={css.header}>
          <div className={css.wrap}>
            <Link href="/design-concepts/gorizont" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={46} height={43} priority />
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
            <Link href="/login" className={css.btn}>
              Войти
            </Link>
          </div>
        </header>

        <main id="main">
          {/* ——— Первый экран: текст + график ——— */}
          <section className={css.hero}>
            <div className={`${css.wrap} ${css.heroGrid}`}>
              <div className={css.heroText}>
                <p className={css.heroKicker}>С 1994 года · Бишкек</p>
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
                <ol className={css.slideList}>
                  {heroSlides.slice(1).map((s, i) => (
                    <li key={s.title}>
                      <span className={css.slideThumb}>
                        <Image src={slidePhotos[i]} alt="" fill sizes="96px" />
                      </span>
                      <span className={css.slideBody}>
                        <b>{s.title}</b>
                        <small>{s.text}</small>
                        <span className={css.slideLinks}>
                          <Link href={s.primary.href}>{s.primary.label} →</Link>
                          <Link href={s.secondary.href}>{s.secondary.label}</Link>
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className={css.heroData}>
                {data.indexSeries.length > 1 ? <FullChart series={data.indexSeries} change={pct(data.index.change)} css={css} /> : null}
                <dl className={css.figures}>
                  <div>
                    <dt>Капитализация</dt>
                    <dd>
                      {num(data.index.capitalization, 1)} <small>млрд сом</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Объём торгов</dt>
                    <dd>
                      {num(data.volume.volumeMln, 4)} <small>млн сом</small>
                    </dd>
                    <Delta value={data.volume.volumeChange} css={css} />
                  </div>
                  <div>
                    <dt>Инструменты</dt>
                    <dd>{data.quotes.total}</dd>
                  </div>
                  <div>
                    <dt>Сделок за сессию</dt>
                    <dd>{num(data.volume.trades)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

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

          {f.urgent.length ? (
            <section className={css.urgent} aria-label="Срочное объявление">
              <div className={css.wrap}>
                <span className={css.tag}>Срочное объявление</span>
                {f.urgent.map((u) => (
                  <Link key={u.key} href={u.href} {...ext(u.external)}>
                    <time>{u.date}</time> {u.title} <em>Подробнее →</em>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* ——— Услуги ——— */}
          <section className={`${css.band} ${css.soft}`}>
            <div className={css.wrap}>
              <div className={css.bandHead}>
                <div>
                  <p className={css.kicker}>Что делает биржа</p>
                  <h2>Наши услуги</h2>
                </div>
                <p className={css.muted}>Для инвесторов, эмитентов и участников торгов</p>
              </div>
              <div className={css.services}>
                {homeServices.map((s, i) => (
                  <Link key={s.title} href={s.href} className={css.service} {...linkProps(s.href)}>
                    <Image src={servicePhotos[i]} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" className={css.serviceImg} />
                    <span className={css.serviceN}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={css.serviceText}>
                      <b>{s.title}</b>
                      <span>{s.text}</span>
                    </span>
                    <i aria-hidden="true">→</i>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* ——— Рынок ——— */}
          <section className={css.band}>
            <div className={css.wrap}>
              <div className={css.bandHead}>
                <div>
                  <p className={css.kicker}>Торги {data.session.date}</p>
                  <h2>Рынок сегодня</h2>
                </div>
                <nav aria-label="Разделы рынка" className={css.underline}>
                  {marketMenu.map((m, i) => (
                    <Link key={m.label} href={m.href} data-on={i === 0 ? "" : undefined}>
                      {m.label}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className={css.market}>
                <div className={css.col}>
                  <h3>Итоги торгов</h3>
                  <TradingRows f={f} css={css} />
                </div>
                <div className={`${css.col} ${css.tableWrap}`}>
                  <h3>Рынки</h3>
                  <MarketTabs f={f} css={css} limit={7} />
                </div>
                <div className={css.col}>
                  <h3>Сделки {data.session.date}</h3>
                  <Trades f={f} css={css} limit={5} />
                  <h3 className={css.colGap}>Лидеры недели, тыс. сом</h3>
                  <Leaders f={f} css={css} />
                </div>
              </div>
            </div>
          </section>

          {/* ——— Котировки + аукционы ——— */}
          <section className={`${css.band} ${css.tinted}`}>
            <div className={css.wrap}>
              <div className={css.bandHead}>
                <div>
                  <p className={css.kicker}>Государственные ценные бумаги</p>
                  <h2>Аукционы и котировки</h2>
                </div>
                <Link href="/gcb" className={css.more}>
                  Календарь аукционов →
                </Link>
              </div>
              <div className={css.auctions}>
                {data.auctions.length ? (
                  data.auctions.map((a) => (
                    <div key={`${a.date}-${a.type}`} className={css.auction}>
                      <b>{a.date}</b>
                      <span>{a.type}</span>
                      <small>{a.volume}</small>
                      <em>{a.status}</em>
                    </div>
                  ))
                ) : (
                  <p className={css.muted}>Расписание аукционов публикуется на странице ГЦБ.</p>
                )}
              </div>
              <div className={css.quotes}>
                <div className={css.quotesHead}>
                  <h3>Котировки</h3>
                  <Link href="/market/quotes" className={css.more}>
                    Все инструменты →
                  </Link>
                </div>
                <div className={css.tableWrap}>
                  <QuotesTable f={f} css={css} limit={12} />
                </div>
              </div>
            </div>
          </section>

          {/* ——— Новости ——— */}
          <section className={css.band}>
            <div className={css.wrap}>
              <div className={css.bandHead}>
                <div>
                  <p className={css.kicker}>Новости и обновления</p>
                  <h2>Будьте в курсе последних событий</h2>
                </div>
                <p className={css.muted}>Объявления площадки, изменения правил и события рынка</p>
              </div>
              {f.lead ? (
                <Link href={`/news/${f.lead.slug}`} className={css.lead}>
                  <span className={css.leadPhoto}>
                    <Image src={f.lead.photo} alt="" fill sizes="(max-width: 900px) 100vw, 50vw" />
                  </span>
                  <span className={css.leadText}>
                    <span className={css.tag}>Главное</span>
                    <small>{longDate(f.lead.date)}</small>
                    <b>{f.lead.title}</b>
                    <span>{f.lead.excerpt}</span>
                    <em>Читать далее →</em>
                  </span>
                </Link>
              ) : null}
              <Tabs
                label="Новости"
                css={css}
                tabs={[
                  {
                    label: "Новости биржи",
                    content: <Feed items={f.exchangeFeed} css={css} limit={8} />,
                    aside: (
                      <Link href="/news" className={css.more}>
                        Все новости →
                      </Link>
                    ),
                  },
                  {
                    label: "Новости компаний",
                    content: <Feed items={f.companyFeed} css={css} limit={8} />,
                    aside: (
                      <Link href="/disclosure" className={css.more}>
                        Все сообщения →
                      </Link>
                    ),
                  },
                ]}
              />
            </div>
          </section>

          {/* ——— Как начать: шаги на линии ——— */}
          <section className={`${css.band} ${css.dark}`}>
            <div className={css.wrap}>
              <div className={css.bandHead}>
                <div>
                  <p className={css.kicker}>Первые шаги</p>
                  <h2>Как начать инвестировать</h2>
                </div>
                <p>Четыре шага от выбора брокера до первой сделки на бирже</p>
              </div>
              <ol className={css.line}>
                {homeSteps.map((s, i) => (
                  <li key={s.title}>
                    <span className={css.node}>{i + 1}</span>
                    <b>{s.title}</b>
                    <span>{s.text}</span>
                    <Link href={s.href} {...linkProps(s.href)}>
                      {s.link} →
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ——— Партнёры ——— */}
          {data.partners.length ? (
            <section className={css.band}>
              <div className={css.wrap}>
                <div className={css.bandHead}>
                  <div>
                    <p className={css.kicker}>Сотрудничество</p>
                    <h2>Наши партнеры</h2>
                  </div>
                  <Link href="/about/partners" className={css.more}>
                    Все партнеры →
                  </Link>
                </div>
                <Partners f={f} css={css} />
              </div>
            </section>
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

        <ConceptSwitch current="gorizont" />
      </div>
    </ConceptPage>
  );
}
