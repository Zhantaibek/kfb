import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import css from "./priliv.module.css";

/*
 * Концепция 62 — «Прилив». Спокойная морская палитра: глубокий синий → аква, волнистые переходы между секциями,
 * скруглённые карточки данных и лента бумаг с горизонтальной прокруткой. Базовый кегль 24px.
 * Шрифты сайта, данные — loadHomeData().
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "62 · Прилив" };

const nav = [
  { label: "Рынок", href: "/market" },
  { label: "Котировки", href: "/market/quotes" },
  { label: "ГЦБ", href: "/gcb" },
  { label: "Листинг", href: "/listing" },
  { label: "Новости", href: "/news" },
];

function Wave({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true" style={flip ? { transform: "scaleY(-1)" } : undefined}>
      <path d="M0 64 C 240 120 480 0 720 48 S 1200 112 1440 40 L1440 120 L0 120 Z" />
    </svg>
  );
}

function Delta({ value }: { value: number }) {
  return (
    <span className={css.delta} data-dir={value > 0 ? "up" : value < 0 ? "down" : undefined}>
      {pct(value)}
    </span>
  );
}

export default async function PrilivConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const chart = smoothPath(
    data.indexSeries.map((row) => row.value),
    600,
    180,
    10,
  );
  const sessionDate = data.session.date ? longDate(data.session.date) : "последней сессии";
  const phones = data.contacts.phones.length ? data.contacts.phones : ["+996 312 31 14 84"];
  const address = data.contacts.address || "г. Бишкек, ул. Московская, 172";
  const email = data.contacts.email || "office@kse.kg";

  return (
    <ConceptPage accent="#0ea5b7">
      <div className={css.page}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <div className={css.wrap}>
            <Link href="/design-concepts/priliv" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={46} height={43} priority />
              <span>Кыргызская фондовая биржа</span>
            </Link>
            <nav aria-label="Основные разделы" className={css.nav}>
              {nav.map((item) => (
                <Link key={item.label} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link href="/members" className={css.btn}>
              Начать
            </Link>
          </div>
        </header>

        <main id="main">
          {/* ——— Первый экран ——— */}
          <section className={css.hero}>
            <div className={`${css.wrap} ${css.heroGrid}`}>
              <div>
                <p className={css.pill} data-intro="fade">
                  <i aria-hidden="true" data-open={data.session.open ? "" : undefined} />
                  {data.session.label} · {data.session.hours}
                </p>
                <h1 data-intro="rise">
                  Спокойный рост
                  <br />
                  <em>вашего капитала</em>
                </h1>
                <p className={css.lead} data-intro="rise" style={{ "--kc-d": "150ms" } as CSSProperties}>
                  Ценные бумаги компаний Кыргызстана и государства — с открытыми ценами и отчётностью.
                </p>
                <div className={css.ctas} data-intro="rise" style={{ "--kc-d": "300ms" } as CSSProperties}>
                  <Link href="/members" className={css.btnLight}>
                    Выбрать брокера
                  </Link>
                  <Link href="/market" className={css.btnGhost}>
                    Итоги торгов
                  </Link>
                </div>
              </div>
              <Link href="/market/index" className={css.indexCard} data-intro="zoom" style={{ "--kc-d": "200ms" } as CSSProperties}>
                <span className={css.cardHead}>
                  <span>Индекс KSE · {sessionDate}</span>
                  <Delta value={data.index.change} />
                </span>
                <b>{num(data.index.value, 2)}</b>
                {chart ? (
                  <svg viewBox="0 0 600 180" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="priliv-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0" stopColor="#0ea5b7" stopOpacity="0.4" />
                        <stop offset="1" stopColor="#0ea5b7" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={chart.area} fill="url(#priliv-fill)" />
                    <path d={chart.line} pathLength={1} className={css.line} />
                  </svg>
                ) : null}
                <dl>
                  <div>
                    <dt>Капитализация</dt>
                    <dd>{num(data.index.capitalization, 1)} млн</dd>
                  </div>
                  <div>
                    <dt>Объём</dt>
                    <dd>{num(data.volume.volumeMln, 1)} млн</dd>
                  </div>
                  <div>
                    <dt>Сделок</dt>
                    <dd>{num(data.volume.trades)}</dd>
                  </div>
                </dl>
              </Link>
            </div>
            <Wave className={css.waveSand} />
          </section>

          {/* ——— Лента бумаг ——— */}
          <section className={css.strip}>
            <div className={css.wrap}>
              <div className={css.head} data-reveal>
                <h2>Бумаги последней сессии</h2>
                <Link href="/market/quotes">Все котировки →</Link>
              </div>
            </div>
            <div className={css.scroller} tabIndex={0} role="region" aria-label="Бумаги последней сессии, прокрутка по горизонтали">
              <ul data-stagger>
                {priced.slice(0, 12).map((item) => (
                  <li key={item.ticker}>
                    <Link href={item.href} className={css.paper}>
                      <span className={css.paperTop}>
                        <b>{item.ticker}</b>
                        <Delta value={item.change} />
                      </span>
                      <small>{item.name}</small>
                      <em>{num(item.price, 2)} сом</em>
                      <span className={css.paperVol}>Объём {item.volume ? num(item.volume) : "—"} сом</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ——— Три карточки ——— */}
          <section className={`${css.wrap} ${css.cards}`}>
            <div className={css.card} data-reveal>
              <span className={css.cardHead}>
                <span>Аукционы ГЦБ</span>
                <Link href="/gcb">Все</Link>
              </span>
              {data.auctions.length ? (
                <ol className={css.auctions}>
                  {data.auctions.slice(0, 4).map((a) => (
                    <li key={`${a.date}-${a.type}`}>
                      <b>{longDate(a.date)}</b>
                      <span>
                        {a.type} · {a.volume}
                      </span>
                      <small>{a.status}</small>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={css.muted}>Расписание аукционов — на странице ГЦБ.</p>
              )}
            </div>
            <div className={`${css.card} ${css.cardDeep}`} data-reveal style={{ "--kc-d": "100ms" } as CSSProperties}>
              <span className={css.cardHead}>
                <span>Рынок в цифрах</span>
              </span>
              <dl className={css.big}>
                <div>
                  <dt>Эмитентов</dt>
                  <dd>{data.issuers}</dd>
                </div>
                <div>
                  <dt>В листинге</dt>
                  <dd>{data.listed}</dd>
                </div>
                <div>
                  <dt>Бумаг в котировках</dt>
                  <dd>{data.quotes.total}</dd>
                </div>
              </dl>
            </div>
            <div className={css.card} data-reveal style={{ "--kc-d": "200ms" } as CSSProperties}>
              <span className={css.cardHead}>
                <span>Лидеры недели</span>
              </span>
              {data.leaders.length ? (
                <ol className={css.leaders}>
                  {data.leaders.slice(0, 5).map((r, i) => (
                    <li key={r.ticker}>
                      <i>{i + 1}</i>
                      <b>{r.ticker}</b>
                      <span>{num(r.volume)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={css.muted}>Данные появятся после торгов недели.</p>
              )}
            </div>
          </section>

          {/* ——— Как начать (волна) ——— */}
          <section className={css.how}>
            <Wave className={css.waveTop} flip />
            <div className={`${css.wrap} ${css.howGrid}`}>
              <div data-reveal>
                <h2>Как сделать первую покупку</h2>
                <p>Сделки на бирже заключают брокеры — участники торгов. Они откроют счёт и примут вашу заявку.</p>
                <Link href={EDU_URL} className={css.btnLight} {...linkProps(EDU_URL)}>
                  Курсы учебного центра
                </Link>
              </div>
              <ol className={css.steps} data-stagger>
                <li>
                  <b>01</b>
                  <span>Выберите брокера среди участников торгов</span>
                </li>
                <li>
                  <b>02</b>
                  <span>Откройте брокерский счёт и счёт депо</span>
                </li>
                <li>
                  <b>03</b>
                  <span>Подайте заявку на покупку бумаги</span>
                </li>
                <li>
                  <b>04</b>
                  <span>Сделка проходит на бирже — бумага ваша</span>
                </li>
              </ol>
            </div>
            <Wave className={css.waveSand} />
          </section>

          {/* ——— Новости ——— */}
          {data.news.length ? (
            <section className={`${css.wrap} ${css.newsBlock}`}>
              <div className={css.head} data-reveal>
                <h2>Новости</h2>
                <Link href="/news">Все новости →</Link>
              </div>
              <div className={css.news} data-stagger>
                {data.news.slice(0, 3).map((item) => (
                  <Link key={item.slug} href={`/news/${item.slug}`} className={css.newsCard}>
                    <span className={css.newsPhoto}>
                      <Image src={item.photo} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" />
                    </span>
                    <small>
                      {longDate(item.date)} · {item.tag}
                    </small>
                    <b>{item.title}</b>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </main>

        <footer className={css.footer}>
          <Wave className={css.waveFoot} flip />
          <div className={css.wrap}>
            <div>
              <b>Кыргызская фондовая биржа</b>
              <span>{address}</span>
            </div>
            <div>
              {phones.slice(0, 2).map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                  {phone}
                </a>
              ))}
              <a href={`mailto:${email}`}>{email}</a>
            </div>
            <nav aria-label="Нижнее меню">
              {nav.map((item) => (
                <Link key={item.label} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href="/disclosure">Раскрытие информации</Link>
            </nav>
            <small>
              {data.contacts.copyright}
              {data.contacts.license ? ` · Лицензия ${data.contacts.license}` : ""}
            </small>
          </div>
        </footer>

        <ConceptSwitch current="priliv" />
      </div>
    </ConceptPage>
  );
}
