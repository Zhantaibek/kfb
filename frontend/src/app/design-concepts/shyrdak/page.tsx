import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Onest, Unbounded } from "next/font/google";
import { mediaSrc } from "@/lib/cms/media-src";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage, Words } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, nav, num, services, steps } from "../_shared/data";
import { loadHomeData, smoothPath, type HomeData } from "../_shared/home-data";
import { Icon } from "../_shared/Icon";
import { IndexChart } from "../_shared/IndexChart";
import { SectorPhoto } from "../_shared/SectorPhoto";
import { Tabs } from "../_shared/Tabs";
import { treemap } from "../_shared/treemap";
import css from "./shyrdak.module.css";

/*
 * Концепция 15 — «Шырдак»: красочная главная. Как в войлочном ковре, страница собрана из крупных плоских
 * цветовых полей — коралл, шафран, кобальт, мята, слива — с круглыми формами и фото в каждом блоке.
 * Без градиентов и свечений: цвет работает заливкой. Шрифты Unbounded (заголовки) и Onest. Только реальные данные.
 */
const display = Unbounded({ subsets: ["latin", "cyrillic"], weight: ["500", "700"], variable: "--sh-display" });
const text = Onest({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--sh-text" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "15 · Шырдак" };

type IconName = Parameters<typeof Icon>[0]["name"];

const audiences: { title: string; text: string; href: string; photo: string; tone: string; icon: IconName }[] = [
  { title: "Инвесторам", text: "Как открыть счёт у брокера и купить первые бумаги", href: "/investors", photo: "/hub/hub-market.jpg", tone: "coral", icon: "wallet" },
  { title: "Эмитентам", text: "Размещение, листинг и раскрытие отчётности", href: "/listing", photo: "/hub/hub-listing.jpg", tone: "cobalt", icon: "building" },
  { title: "Участникам торгов", text: "Правила, тарифы и документы для брокеров", href: "/documents", photo: "/hub/hub-members.jpg", tone: "mint", icon: "users" },
];

// Цвет плитки карты оборота — вид бумаги.
const typeTint: Record<string, string> = { stock: "#2443c9", bond: "#b4760f", gcb: "#13805d", metal: "#7b2d8e" };
const typeLabel: Record<string, string> = { stock: "Акции", bond: "Облигации", gcb: "ГЦБ", metal: "Драгметаллы" };
const serviceTones = ["coral", "saffron", "cobalt", "mint", "plum", "sky"];

function Change({ value }: { value: number }) {
  const dir = value > 0 ? css.up : value < 0 ? css.down : css.flat;
  return (
    <span className={`${css.change} ${dir}`}>
      <span aria-hidden="true">{value > 0 ? "▲" : value < 0 ? "▼" : "–"}</span>
      <span className={css.srOnly}>{value > 0 ? "рост" : value < 0 ? "снижение" : "без изменений"}</span>
      {value >= 1000 ? `в ${num(value / 100 + 1)} раз` : `${num(Math.abs(value), 2)}%`}
    </span>
  );
}

function More({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={css.more} {...linkProps(href)}>
      {children}
      <Icon name={href.startsWith("http") ? "arrowUpRight" : "arrowRight"} />
    </Link>
  );
}

function Head({ id, title, link }: { id: string; title: string; link?: ReactNode }) {
  return (
    <header className={css.head}>
      <h2 id={id}>{title}</h2>
      {link}
    </header>
  );
}

function QuoteTable({ rows, live }: { rows: HomeData["quotes"]["stocks"]; live: boolean }) {
  if (!rows.length) return <p className={css.empty}>Сделок по этим инструментам не было</p>;
  return (
    <table className={css.table}>
      <thead>
        <tr>
          <th scope="col">Бумага</th>
          <th scope="col" className={css.hideSm}>
            Эмитент
          </th>
          <th scope="col" className={css.num}>
            Цена, сом
          </th>
          <th scope="col" className={css.num}>
            {live ? "Объём, тыс. сом" : "Объём"}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.ticker}>
            <th scope="row">
              <Link href={row.href}>
                <i className={css.dot} data-type={row.type} aria-hidden="true" />
                {row.ticker}
              </Link>
            </th>
            <td className={`${css.muted} ${css.hideSm}`}>{row.name}</td>
            <td className={css.num}>{num(row.price, 2)}</td>
            <td className={css.num}>{num(row.volume, 1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function ShyrdakConcept() {
  const data = await loadHomeData();
  const sessionDate = data.live ? longDate(data.session.date) : null;
  const series = data.indexSeries;
  const spark = smoothPath(
    series.map((point) => point.value),
    300,
    90,
    6,
  );
  const traded = data.instruments.filter((item) => item.volume > 0);
  const total = traded.reduce((sum, item) => sum + item.volume, 0);
  const tradedTypes = [...new Set(traded.map((item) => item.type))];
  // Лидеры недели; если недельной сводки нет — лидеры последней сессии по объёму (тоже реальные данные).
  const weekly = data.leaders.length > 0;
  const leaders = weekly ? data.leaders : traded.slice(0, 6);
  const maxLeader = Math.max(1, ...leaders.map((row) => row.volume));
  const tape = data.instruments.filter((item) => item.price > 0).slice(0, 12);
  const [lead, ...rest] = data.news;

  return (
    <ConceptPage accent="#ff5a3c">
      <div className={`${css.page} ${display.variable} ${text.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <div className={css.wrap}>
            <Link href="/design-concepts/shyrdak" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={36} height={34} priority />
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
            <div className={css.headActions}>
              <Link href="/search" className={css.iconButton} aria-label="Поиск по сайту">
                <Icon name="search" />
              </Link>
              <Link href="/members" className={`${css.button} ${css.ink}`}>
                Начать инвестировать
              </Link>
              <details className={css.menu}>
                <summary className={css.iconButton} aria-label="Меню">
                  <Icon name="menu" />
                </summary>
                <nav className={css.menuPanel} aria-label="Меню (мобильное)">
                  {nav.map((item) => (
                    <Link key={item.href} href={item.href}>
                      {item.label}
                    </Link>
                  ))}
                  <Link href={EDU_URL} {...linkProps(EDU_URL)}>
                    Учебный центр
                  </Link>
                  <Link href="/members" className={`${css.button} ${css.ink}`}>
                    Начать инвестировать
                  </Link>
                </nav>
              </details>
            </div>
          </div>
        </header>

        <main id="main">
          {/* Первый экран — мозаика цветовых полей. */}
          <section className={css.wrap} aria-labelledby="sh-hero">
            <div className={css.bento}>
              <div className={`${css.tile} ${css.heroTile}`} data-tone="coral">
                <p className={css.eyebrow} data-intro="fade">
                  <span className={data.session.open ? css.liveDot : css.offDot} aria-hidden="true" />
                  {data.session.label} · {data.session.hours}
                </p>
                <h1 id="sh-hero" data-intro="words">
                  <Words text="Яркий рынок Кыргызстана — открыт каждому" />
                </h1>
                <p className={css.lead} data-intro="rise" style={{ "--kc-d": "360ms" } as CSSProperties}>
                  Акции, облигации, ГЦБ и золото на одной бирже с 1994 года. Котировки, отчёты эмитентов и аукционы — на этой странице.
                </p>
                <div className={css.actions} data-intro="rise" style={{ "--kc-d": "480ms" } as CSSProperties}>
                  <Link href="#start" className={`${css.button} ${css.ink}`}>
                    Как начать
                  </Link>
                  <Link href="/market/quotes" className={`${css.button} ${css.light}`}>
                    Все котировки
                  </Link>
                </div>
                <i className={css.shapeCircle} aria-hidden="true" />
              </div>

              <div className={`${css.tile} ${css.indexTile}`} data-tone="saffron" data-intro="rise" style={{ "--kc-d": "120ms" } as CSSProperties}>
                <p className={css.tileLabel}>Индекс KSE</p>
                <p className={css.bigNum} data-count={data.index.value} data-digits="2">
                  {num(data.index.value, 2)}
                </p>
                <Change value={data.index.change} />
                {spark ? (
                  <svg className={css.spark} viewBox="0 0 300 90" preserveAspectRatio="none" aria-hidden="true" data-draw>
                    <path className={css.sparkLine} d={spark.line} />
                  </svg>
                ) : null}
                <p className={css.tileFoot}>{sessionDate ? `Сессия ${sessionDate}` : "Демонстрационные значения"}</p>
              </div>

              <figure className={`${css.tile} ${css.photoTile}`} data-reveal="mask">
                <Image src="/hero/bishkek-ala-too.jpg" alt="Бишкек и хребет Ала-Тоо" fill priority sizes="(max-width: 767px) 100vw, 40vw" />
              </figure>

              <div className={`${css.tile} ${css.statTile}`} data-tone="cobalt" data-intro="rise" style={{ "--kc-d": "220ms" } as CSSProperties}>
                <p className={css.tileLabel}>Объём сессии</p>
                <p className={css.midNum}>
                  <span data-count={data.volume.volumeMln} data-digits="2">
                    {num(data.volume.volumeMln, 2)}
                  </span>{" "}
                  <small>млн сом</small>
                </p>
                <Change value={data.volume.volumeChange} />
              </div>

              <div className={`${css.tile} ${css.statTile}`} data-tone="mint" data-intro="rise" style={{ "--kc-d": "300ms" } as CSSProperties}>
                <p className={css.tileLabel}>Капитализация</p>
                <p className={css.midNum}>
                  <span data-count={data.index.capitalization} data-digits="1">
                    {num(data.index.capitalization, 1)}
                  </span>{" "}
                  <small>млрд сом</small>
                </p>
                <p className={css.tileFoot}>
                  {num(data.volume.trades)} сделок{data.issuers ? ` · ${num(data.issuers)} эмитентов` : ""}
                </p>
              </div>
            </div>
          </section>

          {/* Бегущая лента цен. Вторая копия нужна только для бесшовного цикла и скрыта от экранных дикторов. */}
          {tape.length ? (
            <section className={css.tape} aria-label="Цены последней сессии">
              <div className={css.tapeTrack}>
                {[0, 1].map((copy) => (
                  <ul key={copy} aria-hidden={copy === 1 || undefined}>
                    {tape.map((item) => (
                      <li key={item.ticker}>
                        <Link href={item.href} tabIndex={copy === 1 ? -1 : undefined}>
                          <i className={css.dot} data-type={item.type} aria-hidden="true" />
                          <b>{item.ticker}</b>
                          <span>{num(item.price, 2)}</span>
                          {item.change ? <Change value={item.change} /> : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </section>
          ) : null}

          {/* Котировки и сегменты. */}
          <section className={`${css.section} ${css.wrap}`} aria-labelledby="sh-quotes">
            <div className={css.split}>
              <div className={css.card} data-reveal>
                <Head id="sh-quotes" title="Котировки" link={<More href="/market/quotes">Все инструменты</More>} />
                <Tabs
                  css={css}
                  label="Котировки по рынкам"
                  tabs={[
                    { label: "Акции", content: <QuoteTable rows={data.quotes.stocks} live={data.live} /> },
                    { label: "Облигации и ГЦБ", content: <QuoteTable rows={data.quotes.bonds} live={data.live} /> },
                    { label: "Драгметаллы", content: <QuoteTable rows={data.quotes.metals} live={data.live} /> },
                  ]}
                />
              </div>
              <div className={`${css.tile} ${css.segments}`} data-tone="plum" data-reveal>
                <Head id="sh-segments" title="Сегменты рынка" />
                {data.tradingRows.length ? (
                  <ul data-stagger>
                    {data.tradingRows.map((row) => (
                      <li key={row.label}>
                        <span>{row.label}</span>
                        <b>{num(row.value, 2)}</b>
                        <Change value={row.change} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={css.empty}>Сегменты появятся после сессии</p>
                )}
                <p className={css.tileFoot}>млн сом, к прошлой сессии</p>
              </div>
            </div>
          </section>

          {/* График индекса. */}
          {series.length > 1 ? (
            <section className={`${css.section} ${css.wrap}`} aria-labelledby="sh-chart">
              <div className={css.card} data-reveal>
                <Head id="sh-chart" title="Динамика индекса KSE" link={<span className={css.muted}>{`${series[0].date} — ${series.at(-1)!.date}`}</span>} />
                <IndexChart css={css} points={series.map(({ date, value }) => ({ date, value }))} />
              </div>
            </section>
          ) : null}

          {/* Карта оборота с фото отраслей. */}
          {traded.length ? (
            <section className={`${css.section} ${css.wrap}`} aria-labelledby="sh-map">
              <div className={css.card} data-reveal>
                <Head id="sh-map" title="Оборот сессии по бумагам" link={<span className={css.muted}>{`${traded.length} бумаг · площадь — доля в обороте`}</span>} />
                {/* Две раскладки одной карты: широкая и для телефона; лишняя скрыта (display: none убирает её и из порядка Tab). */}
                {[
                  { className: css.mapWide, w: 1000, h: 360 },
                  { className: css.mapTall, w: 360, h: 420 },
                ].map((layout) => (
                  <ul key={layout.className} className={`${css.map} ${layout.className}`}>
                    {treemap(traded, (item) => item.volume, layout.w, layout.h).map(({ item, left, top, width, height }) => (
                      <li key={item.ticker} style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` } as CSSProperties}>
                        <Link href={item.href} title={`${item.ticker} — ${item.name}`}>
                          <SectorPhoto name={item.name} type={item.type} ticker={item.ticker} tint={typeTint[item.type] ?? typeTint.stock} />
                          <b>{item.ticker}</b>
                          <span>{num((item.volume / total) * 100, 1)}%</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ))}
                <ul className={css.legend} aria-label="Цвет плитки — вид бумаги">
                  {tradedTypes.map((type) => (
                    <li key={type}>
                      <i className={css.dot} data-type={type} aria-hidden="true" />
                      {typeLabel[type] ?? type}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          {/* Лидеры недели и аукционы ГЦБ. */}
          <section className={`${css.section} ${css.wrap}`} aria-label="Лидеры недели и аукционы ГЦБ">
            <div className={css.pair}>
              <div className={`${css.tile} ${css.leaders}`} data-tone="saffron" data-reveal>
                <Head id="sh-leaders" title={weekly ? "Лидеры недели" : "Лидеры сессии"} link={<span className={css.tileFoot}>{data.live ? "тыс. сом" : "объём"}</span>} />
                {leaders.length ? (
                  <ol data-stagger>
                    {leaders.map((row) => (
                      <li key={row.ticker}>
                        <b>{row.ticker}</b>
                        <span className={css.bar}>
                          <i style={{ width: `${(row.volume / maxLeader) * 100}%` }} data-grow />
                        </span>
                        <span className={css.numCell}>{num(row.volume, 1)}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className={css.empty}>Сделок пока не было</p>
                )}
              </div>
              <div className={`${css.tile} ${css.auctions}`} data-tone="sky" data-reveal>
                <Head id="sh-auctions" title="Аукционы ГЦБ" link={<More href="/gcb">Календарь</More>} />
                {data.auctions.length ? (
                  <ul data-stagger>
                    {data.auctions.map((row) => (
                      <li key={`${row.date}-${row.type}`}>
                        <span className={css.dateChip}>{row.date}</span>
                        <span>
                          <b>{row.type}</b>
                          <span className={css.soft}>{row.volume}</span>
                        </span>
                        <span className={css.badge}>{row.status}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={css.empty}>Ближайших аукционов нет</p>
                )}
              </div>
            </div>
          </section>

          {/* Кому полезна биржа — цветные карточки с фото. */}
          <section className={`${css.section} ${css.wrap}`} aria-labelledby="sh-who">
            <Head id="sh-who" title="Кому полезна биржа" />
            <ul className={css.audiences} data-stagger>
              {audiences.map((item) => (
                <li key={item.title} data-tone={item.tone}>
                  <Link href={item.href}>
                    <span className={css.audiencePhoto}>
                      <Image src={item.photo} alt="" fill sizes="(max-width: 767px) 100vw, 33vw" />
                    </span>
                    <span className={css.audienceBody}>
                      <Icon name={item.icon} />
                      <b>{item.title}</b>
                      <span>{item.text}</span>
                    </span>
                    <span className={css.roundArrow} aria-hidden="true">
                      <Icon name="arrowRight" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Шаги — коралловое поле с крупными номерами в кругах. */}
          <section className={`${css.section} ${css.wrap}`} id="start" aria-labelledby="sh-steps">
            <div className={`${css.tile} ${css.steps}`} data-tone="coral" data-reveal>
              <Head id="sh-steps" title="Как купить первые ценные бумаги" link={<More href="/members">Список брокеров</More>} />
              <ol data-stagger>
                {steps.map((step, i) => (
                  <li key={step.title}>
                    <span className={css.stepNo}>{i + 1}</span>
                    <b>{step.title}</b>
                    <span>{step.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Новости. */}
          <section className={`${css.section} ${css.wrap}`} aria-labelledby="sh-news">
            <Head id="sh-news" title="Новости биржи" link={<More href="/news">Все новости</More>} />
            {lead ? (
              <div className={css.newsGrid}>
                <Link href={`/news/${lead.slug}`} className={css.newsLead} data-reveal>
                  <span className={css.newsPhoto}>
                    {lead.photo ? <Image src={mediaSrc(lead.photo)} alt="" fill sizes="(max-width: 1023px) 100vw, 60vw" unoptimized /> : null}
                  </span>
                  <span className={css.newsBody}>
                    <span className={css.tag}>{lead.tag}</span>
                    <b>{lead.title}</b>
                    <span className={css.soft}>{lead.excerpt}</span>
                    <time>{lead.date}</time>
                  </span>
                </Link>
                <ul className={css.newsList} data-stagger>
                  {rest.slice(0, 3).map((item, i) => (
                    <li key={item.slug} data-tone={["mint", "saffron", "sky"][i]}>
                      <Link href={`/news/${item.slug}`}>
                        <span className={css.newsThumb}>{item.photo ? <Image src={mediaSrc(item.photo)} alt="" fill sizes="120px" unoptimized /> : null}</span>
                        <span>
                          <time>{item.date}</time>
                          <b>{item.title}</b>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className={css.empty}>Новостей пока нет</p>
            )}
          </section>

          {data.urgent.length ? (
            <section className={`${css.section} ${css.wrap}`} aria-labelledby="sh-urgent">
              <div className={`${css.tile} ${css.urgent}`} data-tone="pink" data-reveal>
                <h2 id="sh-urgent">
                  <Icon name="megaphone" />
                  Срочно
                </h2>
                <ul>
                  {data.urgent.map((item) => (
                    <li key={item.slug}>
                      <Link href={`/news/${item.slug}`}>
                        <time>{item.date}</time>
                        <b>{item.title}</b>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          {/* Сервисы — плитки с цветными кругами. */}
          <section className={`${css.section} ${css.wrap}`} aria-labelledby="sh-services">
            <Head id="sh-services" title="Сервисы биржи" />
            <ul className={css.services} data-stagger>
              {services.map((item, i) => (
                <li key={item.title}>
                  <Link href={item.href} {...linkProps(item.href)}>
                    <i className={css.blob} data-tone={serviceTones[i % serviceTones.length]} aria-hidden="true" />
                    <b>{item.title}</b>
                    <span className={css.muted}>{item.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {data.partners.length ? (
            <section className={`${css.section} ${css.wrap}`} aria-labelledby="sh-partners">
              <Head id="sh-partners" title="Партнёры" link={<More href="/about/partners">Все партнёры</More>} />
              <ul className={css.partners}>
                {data.partners.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/about/partners/${item.slug}`} title={`${item.mark} — ${item.name}`}>
                      {item.logo ? <Image src={item.logo} alt={item.mark} fill sizes="160px" unoptimized /> : <b>{item.mark}</b>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </main>

        <footer className={css.footer}>
          <div className={`${css.wrap} ${css.footGrid}`}>
            <div>
              <b className={css.footTitle}>Кыргызская фондовая биржа</b>
              {data.contacts.address ? <p>{data.contacts.address}</p> : null}
              {data.contacts.phones.map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                  {phone}
                </a>
              ))}
              {data.contacts.email ? <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a> : null}
            </div>
            <nav aria-label="Рынок">
              <Link href="/market">Итоги торгов</Link>
              <Link href="/market/quotes">Котировки</Link>
              <Link href="/market/index">Индекс KSE</Link>
              <Link href="/gcb">ГЦБ</Link>
            </nav>
            <nav aria-label="О бирже">
              <Link href="/about">О бирже</Link>
              <Link href="/documents">Документы</Link>
              <Link href="/news">Новости</Link>
              <Link href="/contacts">Контакты</Link>
            </nav>
          </div>
          <div className={`${css.wrap} ${css.footBottom}`}>
            <span>{data.contacts.copyright}</span>
            {data.contacts.license ? <span>{data.contacts.license}</span> : null}
          </div>
        </footer>
        <ConceptSwitch current="shyrdak" />
      </div>
    </ConceptPage>
  );
}
