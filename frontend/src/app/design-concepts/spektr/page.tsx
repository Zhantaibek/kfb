import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { FullChart, ThemeButton } from "../_shared/FullChart";
import { ext, heroSlides, homeServices, homeSteps, loadFullHome, marketMenu, marketTabs, siteNav, typeName, type FeedItem } from "../_shared/full-home";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { Tabs } from "../_shared/Tabs";
import css from "./spektr.module.css";

/*
 * Концепция 67 — «Спектр». Приёмы необанка bunq: чёрный фон, тонкая радужная линия сверху, огромные белые заголовки,
 * фото первого экрана — светящийся «экран» справа, слайды — цветные карточки как тарифы, у каждой услуги свой цвет,
 * цветные номера шагов. Всё содержимое главной. Шрифты сайта.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "67 · Спектр" };

const slidePhotos = ["/carousel/phone.jpg", "/landing/sust-process-img-2.jpg", "/carousel/trading.jpg", "/carousel/gold.jpg"];
const chips = ["#2c7e87", "#123a3f", "#3aa17e", "#e8b04b", "#7d6bd6", "#2f7fd8"];

function Delta({ value }: { value: number }) {
  return (
    <span className={css.delta} data-dir={value > 0 ? "up" : value < 0 ? "down" : undefined}>
      {pct(value)}
    </span>
  );
}

function NewsRow({ items }: { items: FeedItem[] }) {
  if (!items.length) return <p className={css.muted}>Пока нет публикаций.</p>;
  return (
    <div className={css.scroller} tabIndex={0} role="region" aria-label="Новости, прокрутка по горизонтали">
      {items.map((item, i) => (
        <Link key={item.key} href={item.href} className={css.newsCard} data-tone={i % 3} {...ext(item.external)}>
          {item.photo ? (
            <span className={css.newsPhoto}>
              <Image src={item.photo} alt="" fill sizes="360px" />
            </span>
          ) : (
            <span className={css.newsBlank} aria-hidden="true">
              {longDate(item.date).split(" ").slice(0, 2).join(" ")}
            </span>
          )}
          <small>
            {longDate(item.date)}
            {item.company ? ` · ${item.company}` : ""}
          </small>
          <b>{item.title}</b>
        </Link>
      ))}
    </div>
  );
}

export default async function SpektrConcept() {
  const f = await loadFullHome();
  const { data, market, priced } = f;
  const sessionShort = data.session.date || "";

  return (
    <ConceptPage accent="#57b6c0">
      <div className={css.page} id="spektr-root" data-theme="light">
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        {/* ——— Шапка: белая «таблетка» ——— */}
        <header className={css.header}>
          <div className={css.bar}>
            <Link href="/design-concepts/spektr" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={40} height={37} priority />
              <span>кфб</span>
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
              <ThemeButton rootId="spektr-root" className={css.tool} />
              <Link href="/login" className={css.btnDark}>
                Войти
              </Link>
            </div>
          </div>
          <div className={css.tape} aria-label="Котировки последней сессии">
            <div className={css.tapeTrack}>
              {[...priced, ...priced].map((item, i) => (
                <Link key={`${item.ticker}-${i}`} href={item.href} aria-hidden={i >= priced.length || undefined} tabIndex={i >= priced.length ? -1 : undefined}>
                  <b>{item.ticker}</b> {num(item.price, 2)}
                  {item.volume ? <small>{num(item.volume, 2)}</small> : null}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <main id="main" className={css.wrap}>
          {f.urgent.length ? (
            <section className={css.urgent} aria-label="Срочное объявление">
              <span>Срочно</span>
              {f.urgent.map((u) => (
                <Link key={u.key} href={u.href} {...ext(u.external)}>
                  {u.date} · {u.title} →
                </Link>
              ))}
            </section>
          ) : null}

          {/* ——— Первый экран: большое фото со штампом ——— */}
          <section className={css.hero}>
            <Image src={slidePhotos[0]} alt="Бишкек сверху" fill priority sizes="100vw" className={css.heroImg} />
            <span className={css.stamp} aria-hidden="true">
              <b>24/7</b>
              <small>онлайн-котировки</small>
            </span>
            <div className={css.heroText}>
              <h1>{heroSlides[0].title}</h1>
              <p>{heroSlides[0].text}</p>
              <div className={css.btns}>
                <Link href={heroSlides[0].primary.href} className={css.btnLight}>
                  {heroSlides[0].primary.label}
                </Link>
                <Link href={heroSlides[0].secondary.href} className={css.btnGhost}>
                  {heroSlides[0].secondary.label}
                </Link>
              </div>
            </div>
          </section>

          {/* ——— Цифры ——— */}
          <section className={css.stats} aria-label="Рынок сегодня">
            <Link href="/market/index">
              <small>Индекс KSE</small>
              <b>{num(data.index.value, 2)}</b>
              <Delta value={data.index.change} />
            </Link>
            <Link href="/market/index">
              <small>Капитализация</small>
              <b>{num(data.index.capitalization, 1)}</b>
              <span>млрд сом</span>
            </Link>
            <Link href="/market">
              <small>Объём торгов</small>
              <b>{num(data.volume.volumeMln, 4)}</b>
              <span>
                млн сом <Delta value={data.volume.volumeChange} />
              </span>
            </Link>
            <Link href="/market/quotes">
              <small>Инструменты</small>
              <b>{data.quotes.total}</b>
              <span>{num(data.volume.trades)} сделок</span>
            </Link>
          </section>

          {/* ——— Остальные слайды карточками ——— */}
          <section className={css.section}>
            <div className={css.center}>
              <h2>Больше возможностей на бирже</h2>
              <p>Счёт у брокера, итоги каждой сессии и открытая отчётность эмитентов.</p>
            </div>
            <div className={css.slides}>
              {heroSlides.slice(1).map((s, i) => (
                <article key={s.title} className={css.slideCard}>
                  <span className={css.slidePhoto}>
                    <Image src={slidePhotos[i + 1]} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" />
                  </span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                  <div className={css.btnsSmall}>
                    <Link href={s.primary.href} className={css.btnDark}>
                      {s.primary.label}
                    </Link>
                    <Link href={s.secondary.href} className={css.btnLine}>
                      {s.secondary.label}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* ——— Услуги ——— */}
          <section className={css.section}>
            <div className={css.center}>
              <h2>Наши услуги</h2>
              <p>Всё, что делает биржа, — для инвесторов, эмитентов и участников торгов.</p>
            </div>
            <div className={css.services}>
              {homeServices.map((s, i) => (
                <Link key={s.title} href={s.href} className={css.service} {...linkProps(s.href)}>
                  <span className={css.chip} style={{ "--c": chips[i] } as CSSProperties} aria-hidden="true" />
                  <i className={css.round} aria-hidden="true">
                    →
                  </i>
                  <b>{s.title}</b>
                  <span>{s.text}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* ——— Рынок ——— */}
          <section className={css.section}>
            <div className={css.center}>
              <h2>Рынок сегодня</h2>
              <p>
                Торги {sessionShort} · {data.session.hours} · {data.session.label}
              </p>
              <nav aria-label="Разделы рынка" className={css.pills}>
                {marketMenu.map((m, i) => (
                  <Link key={m.label} href={m.href} className={i === 0 ? css.btnDark : css.btnLine}>
                    {m.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className={css.marketTop}>
              {data.indexSeries.length > 1 ? <FullChart series={data.indexSeries} change={pct(data.index.change)} css={css} /> : null}
              <div className={css.card}>
                <h3>Итоги торгов</h3>
                <dl className={css.rows}>
                  {data.tradingRows.map((row) => (
                    <div key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>
                        {num(row.value, 4)} <Delta value={row.change} />
                      </dd>
                    </div>
                  ))}
                  <div>
                    <dt>Индекс KSE</dt>
                    <dd>
                      {num(data.index.value, 2)} <Delta value={data.index.change} />
                    </dd>
                  </div>
                  <div>
                    <dt>Капитализация</dt>
                    <dd>{num(data.index.capitalization, 1)} млрд</dd>
                  </div>
                  <div>
                    <dt>Сделок за сессию</dt>
                    <dd>{num(data.volume.trades)}</dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className={css.marketBottom}>
              <div className={css.card}>
                <h3>Рынки</h3>
                <Tabs
                  label="Рынки"
                  css={css}
                  tabs={marketTabs.map((t) => {
                    const rows = priced.filter((item) => (t.types as readonly string[]).includes(item.type)).slice(0, 6);
                    return {
                      label: t.label,
                      content: rows.length ? (
                        <table className={css.table}>
                          <thead>
                            <tr>
                              <th scope="col">Инструмент</th>
                              <th scope="col">Цена</th>
                              <th scope="col">Вид</th>
                              <th scope="col">Объём, тыс.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((item) => (
                              <tr key={item.ticker}>
                                <th scope="row">
                                  <Link href={item.href}>
                                    <b>{item.ticker}</b> <small>{item.issuer || item.name}</small>
                                  </Link>
                                </th>
                                <td>{num(item.price, 2)}</td>
                                <td>{item.description || typeName[item.type]}</td>
                                <td>{item.volume ? num(item.volume, 2) : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className={css.muted}>В этой секции сделок в сессии не было.</p>
                      ),
                    };
                  })}
                />
              </div>
              <div className={css.card}>
                <h3>Сделки {sessionShort}</h3>
                {market.lastTrades.length ? (
                  <ul className={css.list}>
                    {market.lastTrades.slice(0, 6).map((t) => (
                      <li key={`${t.ticker}-${t.price}`}>
                        <span className={css.dotChip} aria-hidden="true">
                          {t.ticker[0]}
                        </span>
                        <b>{t.ticker}</b>
                        <em>{num(t.price, 2)} сом</em>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={css.muted}>Сделок в последней сессии не было.</p>
                )}
              </div>
              <div className={css.card}>
                <h3>Лидеры недели, тыс. сом</h3>
                <ol className={css.leaders}>
                  {data.leaders.map((row) => (
                    <li key={row.ticker}>
                      <span>
                        <b>{row.ticker}</b>
                        <em>{num(row.volume, 2)}</em>
                      </span>
                      <i style={{ "--w": `${(row.volume / f.maxLeader) * 100}%` } as CSSProperties} aria-hidden="true" />
                    </li>
                  ))}
                </ol>
                <dl className={css.rows}>
                  <div>
                    <dt>Итого за неделю</dt>
                    <dd>{num(market.weekTotal.volume, 2)}</dd>
                  </div>
                  <div>
                    <dt>Сделок</dt>
                    <dd>{num(market.weekTotal.deals)}</dd>
                  </div>
                  <div>
                    <dt>Бумаг с объёмом</dt>
                    <dd>{num(market.weekTotal.papers)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          {/* ——— Котировки + аукционы ——— */}
          <section className={`${css.section} ${css.quotesRow}`}>
            <div className={css.card}>
              <div className={css.cardHead}>
                <h3>Котировки</h3>
                <Link href="/market/quotes" className={css.btnLine}>
                  Все инструменты
                </Link>
              </div>
              <table className={css.table}>
                <thead>
                  <tr>
                    <th scope="col">Тикер</th>
                    <th scope="col">Бумага</th>
                    <th scope="col">Цена</th>
                    <th scope="col">Вид</th>
                    <th scope="col">Объём, тыс.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.instruments.slice(0, 12).map((item) => (
                    <tr key={item.ticker}>
                      <th scope="row">
                        <Link href={item.href}>
                          <b>{item.ticker}</b>
                        </Link>
                      </th>
                      <td className={css.left}>{item.issuer || item.name}</td>
                      <td>{item.price ? num(item.price, 2) : "—"}</td>
                      <td>{item.description || typeName[item.type]}</td>
                      <td>{item.volume ? num(item.volume, 2) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={css.gcb}>
              <h3>Аукционы ГЦБ</h3>
              {data.auctions.length ? (
                data.auctions.map((a) => (
                  <div key={`${a.date}-${a.type}`} className={css.auction}>
                    <b>{a.date}</b>
                    <span>{a.type}</span>
                    <em>{a.volume}</em>
                    <small>{a.status}</small>
                  </div>
                ))
              ) : (
                <p>Расписание аукционов публикуется на странице ГЦБ.</p>
              )}
              <Link href="/gcb" className={css.btnLight}>
                Календарь аукционов
              </Link>
            </div>
          </section>

          {/* ——— Новости ——— */}
          <section className={css.section}>
            <div className={css.center}>
              <p className={css.kicker}>Новости и обновления</p>
              <h2>Будьте в курсе последних событий</h2>
              <p>Объявления площадки, изменения правил и события рынка</p>
            </div>
            {f.lead ? (
              <Link href={`/news/${f.lead.slug}`} className={css.lead}>
                <span className={css.leadPhoto}>
                  <Image src={f.lead.photo} alt="" fill sizes="(max-width: 900px) 100vw, 50vw" />
                </span>
                <span className={css.leadText}>
                  <span className={css.badge}>Главное</span>
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
                { label: "Новости биржи", content: <NewsRow items={f.exchangeFeed} />, aside: <Link href="/news" className={css.btnLine}>Все новости</Link> },
                { label: "Новости компаний", content: <NewsRow items={f.companyFeed} />, aside: <Link href="/disclosure" className={css.btnLine}>Все сообщения</Link> },
              ]}
            />
          </section>

          {/* ——— Как начать: карточка с фото телефона ——— */}
          <section className={`${css.section} ${css.steps}`}>
            <div className={css.stepsText}>
              <p className={css.kicker}>Первые шаги</p>
              <h2>Как начать инвестировать</h2>
              <p>Четыре шага от выбора брокера до первой сделки на бирже</p>
              <ol>
                {homeSteps.map((s, i) => (
                  <li key={s.title}>
                    <span className={css.stepN}>{i + 1}</span>
                    <span>
                      <b>{s.title}</b>
                      <span>{s.text}</span>
                      <Link href={s.href} {...linkProps(s.href)}>
                        {s.link} →
                      </Link>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <span className={css.stepsPhoto}>
              <Image src="/landing/sust-process-img-1.jpg" alt="" fill sizes="(max-width: 900px) 100vw, 40vw" />
            </span>
          </section>

          {/* ——— Партнёры ——— */}
          {data.partners.length ? (
            <section className={css.section}>
              <div className={css.center}>
                <h2>Наши партнеры</h2>
                <p>Регуляторы, инфраструктура и биржи-партнёры, с которыми работает КФБ</p>
                <div className={css.pills}>
                  <Link href="/about/partners" className={css.btnDark}>
                    Все партнеры
                  </Link>
                </div>
              </div>
              <div className={css.partners}>
                {data.partners.slice(0, 8).map((p) => (
                  <Link key={p.slug} href={`/about/partners/${p.slug}`} className={css.partner} title={p.name}>
                    <span className={css.partnerLogo} data-wide={p.logoWide ? "" : undefined}>
                      {p.logo ? <Image src={p.logo} alt={p.mark} fill sizes="180px" unoptimized /> : <b>{p.mark}</b>}
                    </span>
                    <b>{p.mark}</b>
                    <small>{p.caption}</small>
                    <span>{p.lead}</span>
                    {p.site ? <em>{p.site.replace(/^https?:\/\//, "").replace(/\/$/, "")}</em> : null}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </main>

        <footer className={css.footer}>
          <div className={css.wrap}>
            <div className={css.footGrid}>
              <div>
                <b className={css.footLogo}>кфб</b>
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
            <p className={css.legal}>
              {data.contacts.copyright}
              {data.contacts.license ? ` · Лицензия ${data.contacts.license}` : ""}
            </p>
          </div>
        </footer>

        <ConceptSwitch current="spektr" />
      </div>
    </ConceptPage>
  );
}
