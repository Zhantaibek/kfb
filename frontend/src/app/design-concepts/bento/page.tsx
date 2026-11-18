import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { FullChart, ThemeButton } from "../_shared/FullChart";
import { Delta, Leaders, MarketTabs, NewsTabs, Partners, QuotesTable, Trades, TradingRows } from "../_shared/FullBlocks";
import { ext, heroSlides, homeServices, homeSteps, loadFullHome, marketMenu, siteNav } from "../_shared/full-home";
import { linkProps, longDate, num, pct } from "../_shared/data";
import css from "./bento.module.css";

/*
 * Концепция 69 — «Бенто». Вся главная — мозаика плиток разного размера на светло-бирюзовом фоне:
 * у каждой плитки одна задача, крупные плитки — главное (первый экран, индекс, график, новость).
 * Фирменная бирюза сайта, белые плитки, тёмно-бирюзовые акценты. Всё содержимое главной.
 */
const rubik = Rubik({ subsets: ["latin", "cyrillic"], variable: "--f-body", display: "swap" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "69 · Бенто" };

const photos = ["/carousel/mountains.jpg", "/carousel/meeting.jpg", "/carousel/trading.jpg", "/carousel/office.jpg"];
const servicePhotos = ["/carousel/trading.jpg", "/landing/sust-service-img-1.jpg", "/carousel/city.jpg", "/carousel/gold.jpg", "/landing/sust-service-img-2.jpg", "/landing/sust-process-img-1.jpg"];

export default async function BentoConcept() {
  const f = await loadFullHome();
  const { data } = f;

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${rubik.variable}`} id="bento-root" data-theme="light">
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <div className={css.bar}>
            <Link href="/design-concepts/bento" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={42} height={39} priority />
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
              <ThemeButton rootId="bento-root" className={css.tool} />
              <Link href="/login" className={css.btn}>
                Войти
              </Link>
            </div>
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
        </header>

        <main id="main" className={css.grid}>
          {/* ——— Первый экран ——— */}
          <section className={`${css.tile} ${css.hero}`}>
            <Image src={photos[0]} alt="" fill priority sizes="(max-width: 1100px) 100vw, 60vw" className={css.cover} />
            <div className={css.heroText}>
              <p className={css.heroKicker}>Кыргызская фондовая биржа · с 1994 года</p>
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
          </section>

          <Link href="/market/index" className={`${css.tile} ${css.index}`}>
            <span className={css.live} data-open={data.session.open ? "" : undefined}>
              <i aria-hidden="true" /> {data.session.label}
            </span>
            <small>Индекс KSE</small>
            <b>{num(data.index.value, 2)}</b>
            <Delta value={data.index.change} css={css} />
            <span className={css.indexFoot}>
              Торги {data.session.date} · {data.session.hours}
            </span>
          </Link>

          {f.urgent.length ? (
            <section className={`${css.tile} ${css.urgent}`} aria-label="Срочное объявление">
              <span className={css.tag}>Срочно</span>
              {f.urgent.map((u) => (
                <Link key={u.key} href={u.href} {...ext(u.external)}>
                  <small>{u.date}</small>
                  <b>{u.title}</b>
                  <em>Подробнее →</em>
                </Link>
              ))}
            </section>
          ) : null}

          <Link href="/market/index" className={`${css.tile} ${css.fig}`}>
            <small>Капитализация</small>
            <b>{num(data.index.capitalization, 1)}</b>
            <span>млрд сом</span>
          </Link>
          <Link href="/market" className={`${css.tile} ${css.fig}`}>
            <small>Объём торгов</small>
            <b>{num(data.volume.volumeMln, 4)}</b>
            <span>
              млн сом <Delta value={data.volume.volumeChange} css={css} />
            </span>
          </Link>
          <Link href="/market/quotes" className={`${css.tile} ${css.fig}`}>
            <small>Инструменты</small>
            <b>{data.quotes.total}</b>
            <span>{num(data.volume.trades)} сделок за сессию</span>
          </Link>

          {/* ——— Остальные слайды ——— */}
          {heroSlides.slice(1).map((s, i) => (
            <article key={s.title} className={`${css.tile} ${css.slide}`}>
              <span className={css.slidePhoto}>
                <Image src={photos[i + 1]} alt="" fill sizes="(max-width: 1100px) 100vw, 30vw" />
              </span>
              <span className={css.num}>{String(i + 2).padStart(2, "0")}</span>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
              <div className={css.btnsSmall}>
                <Link href={s.primary.href} className={css.btn}>
                  {s.primary.label}
                </Link>
                <Link href={s.secondary.href} className={css.btnLine}>
                  {s.secondary.label}
                </Link>
              </div>
            </article>
          ))}

          {/* ——— Рынок ——— */}
          <div className={`${css.tile} ${css.sectionBar}`}>
            <h2>Рынок</h2>
            <nav aria-label="Разделы рынка" className={css.chips}>
              {marketMenu.map((m, i) => (
                <Link key={m.label} href={m.href} data-on={i === 0 ? "" : undefined}>
                  {m.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className={`${css.tile} ${css.chart}`}>
            {data.indexSeries.length > 1 ? <FullChart series={data.indexSeries} change={pct(data.index.change)} css={css} /> : <p className={css.muted}>Нет данных для графика.</p>}
          </div>
          <div className={`${css.tile} ${css.results}`}>
            <div className={css.tileHead}>
              <h3>Итоги торгов</h3>
              <Link href="/market" className={css.more} aria-label="Все итоги торгов">
                →
              </Link>
            </div>
            <TradingRows f={f} css={css} />
          </div>

          <div className={`${css.tile} ${css.markets}`}>
            <div className={css.tileHead}>
              <h3>Рынки</h3>
            </div>
            <div className={css.tableWrap}>
              <MarketTabs f={f} css={css} />
            </div>
          </div>
          <div className={`${css.tile} ${css.trades}`}>
            <div className={css.tileHead}>
              <h3>Сделки {data.session.date}</h3>
            </div>
            <Trades f={f} css={css} />
          </div>
          <div className={`${css.tile} ${css.leadersTile}`}>
            <div className={css.tileHead}>
              <h3>Лидеры недели</h3>
              <small className={css.muted}>тыс. сом</small>
            </div>
            <Leaders f={f} css={css} />
          </div>

          {/* ——— Услуги ——— */}
          <div className={`${css.tile} ${css.sectionBar}`}>
            <h2>Наши услуги</h2>
            <p className={css.muted}>Для инвесторов, эмитентов и участников торгов</p>
          </div>
          {homeServices.map((s, i) => (
            <Link key={s.title} href={s.href} className={`${css.tile} ${css.service}`} {...linkProps(s.href)}>
              <span className={css.servicePhoto}>
                <Image src={servicePhotos[i]} alt="" fill sizes="(max-width: 1100px) 50vw, 16vw" />
              </span>
              <b>{s.title}</b>
              <span>{s.text}</span>
              <i aria-hidden="true">↗</i>
            </Link>
          ))}

          {/* ——— Котировки + ГЦБ ——— */}
          <div className={`${css.tile} ${css.quotes}`}>
            <div className={css.tileHead}>
              <h3>Котировки</h3>
              <Link href="/market/quotes" className={css.more}>
                Все инструменты →
              </Link>
            </div>
            <div className={css.tableWrap}>
              <QuotesTable f={f} css={css} limit={10} />
            </div>
          </div>
          <div className={`${css.tile} ${css.gcb}`}>
            <h3>Аукционы ГЦБ</h3>
            {data.auctions.length ? (
              data.auctions.map((a) => (
                <div key={`${a.date}-${a.type}`} className={css.auction}>
                  <b>{a.date}</b>
                  <span>
                    {a.type}
                    <small>{a.volume}</small>
                  </span>
                  <em>{a.status}</em>
                </div>
              ))
            ) : (
              <p>Расписание аукционов публикуется на странице ГЦБ.</p>
            )}
            <Link href="/gcb" className={css.btnLight}>
              Календарь аукционов
            </Link>
          </div>

          {/* ——— Новости ——— */}
          <div className={`${css.tile} ${css.sectionBar}`}>
            <h2>Новости и обновления</h2>
            <p className={css.muted}>Объявления площадки, изменения правил и события рынка</p>
          </div>
          {f.lead ? (
            <Link href={`/news/${f.lead.slug}`} className={`${css.tile} ${css.lead}`}>
              <Image src={f.lead.photo} alt="" fill sizes="(max-width: 1100px) 100vw, 50vw" className={css.cover} />
              <span className={css.leadText}>
                <span className={css.tag}>Главное</span>
                <small>{longDate(f.lead.date)}</small>
                <b>{f.lead.title}</b>
                <span>{f.lead.excerpt}</span>
              </span>
            </Link>
          ) : null}
          <div className={`${css.tile} ${css.news}`}>
            <NewsTabs f={f} css={css} limit={6} moreClass={css.more} />
          </div>

          {/* ——— Как начать ——— */}
          <section className={`${css.tile} ${css.steps}`}>
            <div className={css.stepsHead}>
              <p className={css.kicker}>Первые шаги</p>
              <h2>Как начать инвестировать</h2>
            </div>
            <ol>
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

          {/* ——— Партнёры ——— */}
          {data.partners.length ? (
            <section className={`${css.tile} ${css.partnersTile}`}>
              <div className={css.tileHead}>
                <h2>Наши партнеры</h2>
                <Link href="/about/partners" className={css.more}>
                  Все партнеры →
                </Link>
              </div>
              <Partners f={f} css={css} />
            </section>
          ) : null}

          {/* ——— Подвал тоже плитками ——— */}
          <footer className={css.footer}>
            <div className={`${css.tile} ${css.footAbout}`}>
              <b>Кыргызская фондовая биржа</b>
              <p>{f.tagline}</p>
            </div>
            <div className={`${css.tile} ${css.footCol}`}>
              <h3>Контакты</h3>
              {f.phones.map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                  {phone}
                </a>
              ))}
              <a href={`mailto:${f.email}`}>{f.email}</a>
              <span>{f.address}</span>
            </div>
            <div className={`${css.tile} ${css.footCol}`}>
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
              <small className={css.legal}>
                {data.contacts.copyright}
                {data.contacts.license ? ` · Лицензия ${data.contacts.license}` : ""}
              </small>
            </div>
          </footer>
        </main>

        <ConceptSwitch current="bento" />
      </div>
    </ConceptPage>
  );
}
