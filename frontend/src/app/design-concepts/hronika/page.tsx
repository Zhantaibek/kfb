import type { Metadata } from "next";
import { Fira_Mono, Fira_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { FullChart, ThemeButton } from "../_shared/FullChart";
import { Delta, Leaders, MarketTabs, Partners, QuotesTable, Trades, TradingRows } from "../_shared/FullBlocks";
import { ext, heroSlides, homeServices, homeSteps, loadFullHome, marketMenu, siteNav, type FeedItem } from "../_shared/full-home";
import { dateKey, linkProps, longDate, num, pct } from "../_shared/data";
import css from "./hronika.module.css";

/*
 * Концепция 75 — «Хроника». Главная, построенная вокруг времени: первый экран — шкала торгового дня
 * от открытия до закрытия с отметкой «сейчас»; аукционы ГЦБ — на календаре месяца; новости биржи и
 * компаний — единой хроникой по датам с разделителями дней; шаги — на линии времени.
 * Строгий светлый дизайн, Fira Sans + Fira Mono, фирменная бирюза.
 */
const sans = Fira_Sans({ subsets: ["latin", "cyrillic"], weight: ["300", "400", "500", "600", "700"], variable: "--f-body", display: "swap" });
const mono = Fira_Mono({ subsets: ["latin", "cyrillic"], weight: ["400", "500"], variable: "--f-mono", display: "swap" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "75 · Хроника" };

const photos = ["/carousel/city.jpg", "/carousel/meeting.jpg", "/carousel/trading.jpg", "/carousel/office.jpg"];
const months = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const toMin = (hhmm: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
};

/** Дата «дд.мм.гггг» → [год, месяц 0–11, день]. */
function parts(date: string): [number, number, number] | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(date.trim());
  return m ? [Number(m[3]), Number(m[2]) - 1, Number(m[1])] : null;
}

/** Хроника: новости биржи и компаний вместе, по датам, с разделителями дней. */
function groupByDay(items: FeedItem[]) {
  const sorted = [...items].sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)));
  const days: { date: string; items: FeedItem[] }[] = [];
  for (const item of sorted) {
    const last = days[days.length - 1];
    if (last && last.date === item.date) last.items.push(item);
    else days.push({ date: item.date, items: [item] });
  }
  return days;
}

export default async function HronikaConcept() {
  const f = await loadFullHome();
  const { data } = f;

  // Шкала торгового дня: часы сессии из данных рынка, «сейчас» — время Бишкека.
  const [openStr = "09:00", closeStr = "17:00"] = data.session.hours.split(/[–-]/);
  const openMin = toMin(openStr);
  const closeMin = toMin(closeStr);
  const nowMin = toMin(data.session.clock);
  const dayOk = Number.isFinite(openMin) && Number.isFinite(closeMin) && closeMin > openMin;
  const nowPct = dayOk && Number.isFinite(nowMin) ? Math.min(100, Math.max(0, ((nowMin - openMin) / (closeMin - openMin)) * 100)) : null;
  const hours = dayOk ? Array.from({ length: Math.floor((closeMin - openMin) / 60) + 1 }, (_, i) => openMin + i * 60) : [];

  // Календарь месяца с аукционами ГЦБ.
  const auctionDays = new Map<number, typeof data.auctions>();
  const first = data.auctions.map((a) => parts(a.date)).find(Boolean) ?? null;
  const today = new Date();
  const [year, month] = first ? [first[0], first[1]] : [today.getFullYear(), today.getMonth()];
  for (const a of data.auctions) {
    const p = parts(a.date);
    if (p && p[0] === year && p[1] === month) auctionDays.set(p[2], [...(auctionDays.get(p[2]) ?? []), a]);
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells = [...Array.from({ length: lead }, () => 0), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const chronicle = groupByDay([...f.exchangeFeed, ...f.companyFeed]).slice(0, 7);

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${sans.variable} ${mono.variable}`} id="hronika-root" data-theme="light">
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <div className={css.wrap}>
            <Link href="/design-concepts/hronika" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
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
              <span className={css.clock} title="Время Бишкека">
                {data.session.clock}
              </span>
              <span className={css.tool}>RU</span>
              <Link href="/search" className={css.tool} aria-label="Поиск">
                ⌕
              </Link>
              <ThemeButton rootId="hronika-root" className={css.tool} />
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

        <main id="main">
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

          {/* ——— Первый экран: заголовок + шкала торгового дня ——— */}
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
            <span className={css.heroPhoto}>
              <Image src={photos[0]} alt="Бишкек" fill priority sizes="(max-width: 1100px) 100vw, 40vw" />
            </span>

            <div className={css.day}>
              <div className={css.dayHead}>
                <h2>Торговый день {data.session.date}</h2>
                <p className={css.status} data-open={data.session.open ? "" : undefined}>
                  <i aria-hidden="true" /> {data.session.label} · сейчас {data.session.clock} по Бишкеку
                </p>
              </div>
              {dayOk ? (
                <div className={css.scale} role="img" aria-label={`Сессия ${data.session.hours}, сейчас ${data.session.clock}`}>
                  <span className={css.track}>
                    {nowPct !== null ? <span className={css.done} style={{ width: `${nowPct}%` }} /> : null}
                  </span>
                  {hours.map((m, i) => (
                    <span key={m} className={css.tick} data-pos={i === 0 ? "first" : i === hours.length - 1 ? "last" : undefined} style={{ left: `${((m - openMin) / (closeMin - openMin)) * 100}%` }}>
                      {String(Math.floor(m / 60)).padStart(2, "0")}:00
                    </span>
                  ))}
                  {nowPct !== null && nowPct > 0 && nowPct < 100 ? (
                    <span className={css.now} style={{ "--x": `${nowPct}%` } as CSSProperties}>
                      <b>{data.session.clock}</b>
                    </span>
                  ) : null}
                  <span className={css.edge} data-side="open">
                    Открытие {openStr.trim()}
                  </span>
                  <span className={css.edge} data-side="close">
                    Закрытие {closeStr.trim()}
                  </span>
                </div>
              ) : null}
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
                  <dt>Инструменты · сделки</dt>
                  <dd>
                    {data.quotes.total} · {num(data.volume.trades)}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* ——— Сессия: график и итоги ——— */}
          <section className={`${css.band} ${css.tinted}`}>
            <div className={css.wrap}>
              <div className={css.head}>
                <div>
                  <p className={css.kicker}>Сессия {data.session.date}</p>
                  <h2>Итоги дня</h2>
                </div>
                <nav aria-label="Разделы рынка" className={css.menu}>
                  {marketMenu.map((m) => (
                    <Link key={m.label} href={m.href}>
                      {m.label}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className={css.marketTop}>
                {data.indexSeries.length > 1 ? <FullChart series={data.indexSeries} change={pct(data.index.change)} css={css} /> : null}
                <div className={css.panel}>
                  <h3>Итоги торгов</h3>
                  <TradingRows f={f} css={css} />
                </div>
              </div>
              <div className={css.marketBottom}>
                <div className={`${css.panel} ${css.tableWrap}`}>
                  <h3>Рынки</h3>
                  <MarketTabs f={f} css={css} />
                </div>
                <div className={css.panel}>
                  <h3>Сделки дня</h3>
                  <Trades f={f} css={css} />
                </div>
                <div className={css.panel}>
                  <h3>Лидеры недели, тыс. сом</h3>
                  <Leaders f={f} css={css} />
                </div>
              </div>
            </div>
          </section>

          {/* ——— Календарь аукционов + котировки ——— */}
          <section className={css.band}>
            <div className={`${css.wrap} ${css.calRow}`}>
              <div className={css.calendar}>
                <p className={css.kicker}>Аукционы ГЦБ</p>
                <h2>
                  {months[month]} {year}
                </h2>
                <div className={css.grid} role="grid" aria-label={`Календарь аукционов, ${months[month]} ${year}`}>
                  {weekdays.map((w) => (
                    <span key={w} className={css.wd} role="columnheader">
                      {w}
                    </span>
                  ))}
                  {cells.map((d, i) =>
                    d ? (
                      <span key={i} className={css.cell} data-auction={auctionDays.has(d) ? "" : undefined} role="gridcell">
                        {d}
                      </span>
                    ) : (
                      <span key={i} aria-hidden="true" />
                    ),
                  )}
                </div>
                <ul className={css.auctionList}>
                  {data.auctions.length ? (
                    data.auctions.map((a) => (
                      <li key={`${a.date}-${a.type}`}>
                        <b>{a.date}</b>
                        <span>{a.type}</span>
                        <small>
                          {a.volume} · {a.status}
                        </small>
                      </li>
                    ))
                  ) : (
                    <li>Расписание аукционов публикуется на странице ГЦБ.</li>
                  )}
                </ul>
                <Link href="/gcb" className={css.btn}>
                  Календарь аукционов
                </Link>
              </div>
              <div className={css.tableWrap}>
                <div className={css.head}>
                  <div>
                    <p className={css.kicker}>Последняя сессия</p>
                    <h2>Котировки</h2>
                  </div>
                  <Link href="/market/quotes" className={css.more}>
                    Все инструменты →
                  </Link>
                </div>
                <QuotesTable f={f} css={css} limit={12} />
              </div>
            </div>
          </section>

          {/* ——— Хроника новостей ——— */}
          <section className={`${css.band} ${css.tinted}`}>
            <div className={`${css.wrap} ${css.newsRow}`}>
              <div>
                <p className={css.kicker}>Новости и обновления</p>
                <h2 className={css.sticky}>Хроника</h2>
                {f.lead ? (
                  <Link href={`/news/${f.lead.slug}`} className={css.lead}>
                    <span className={css.leadPhoto}>
                      <Image src={f.lead.photo} alt="" fill sizes="(max-width: 1100px) 100vw, 35vw" />
                    </span>
                    <small>{longDate(f.lead.date)} · Главное</small>
                    <b>{f.lead.title}</b>
                    <span>{f.lead.excerpt}</span>
                  </Link>
                ) : null}
              </div>
              <ol className={css.chronicle}>
                {chronicle.map((day) => (
                  <li key={day.date}>
                    <time className={css.dayMark}>{longDate(day.date)}</time>
                    <ul>
                      {day.items.map((item) => (
                        <li key={item.key}>
                          <Link href={item.href} {...ext(item.external)}>
                            <span className={css.tag} data-kind={item.company ? "company" : "exchange"}>
                              {item.company ? item.company : "Биржа"}
                            </span>
                            <b>{item.title}</b>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
                <li className={css.chronMore}>
                  <Link href="/news" className={css.more}>
                    Все новости биржи →
                  </Link>
                  <Link href="/disclosure" className={css.more}>
                    Сообщения компаний →
                  </Link>
                </li>
              </ol>
            </div>
          </section>

          {/* ——— Возможности и услуги ——— */}
          <section className={css.band}>
            <div className={css.wrap}>
              <div className={css.head}>
                <div>
                  <p className={css.kicker}>Возможности</p>
                  <h2>Что можно сделать на бирже</h2>
                </div>
              </div>
              <div className={css.slides}>
                {heroSlides.slice(1).map((s, i) => (
                  <article key={s.title}>
                    <span className={css.photo}>
                      <Image src={photos[i + 1]} alt="" fill sizes="(max-width: 1100px) 100vw, 33vw" />
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
              <h3 className={css.subHead}>Наши услуги</h3>
              <div className={css.services}>
                {homeServices.map((s, i) => (
                  <Link key={s.title} href={s.href} className={css.service} {...linkProps(s.href)}>
                    <small>{String(i + 1).padStart(2, "0")}</small>
                    <b>{s.title}</b>
                    <span>{s.text}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* ——— Как начать: линия времени ——— */}
          <section className={`${css.band} ${css.tinted}`}>
            <div className={css.wrap}>
              <div className={css.head}>
                <div>
                  <p className={css.kicker}>Первые шаги</p>
                  <h2>Как начать инвестировать</h2>
                </div>
              </div>
              <ol className={css.steps}>
                {homeSteps.map((s, i) => (
                  <li key={s.title}>
                    <span className={css.stepN}>Шаг {i + 1}</span>
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
                <div className={css.head}>
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

        <ConceptSwitch current="hronika" />
      </div>
    </ConceptPage>
  );
}
