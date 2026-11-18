import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import css from "./ekran.module.css";

/*
 * Концепция 60 — «Экран». Страница как презентация: каждый раздел — отдельный полноэкранный «слайд»
 * с огромной типографикой, боковая навигация по точкам. Палитра — глубокий зелёный, лайм и крем.
 * Базовый кегль 24px. Шрифты сайта, данные — loadHomeData().
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "60 · Экран" };

const slides = [
  { id: "start", label: "Старт" },
  { id: "index", label: "Индекс" },
  { id: "quotes", label: "Котировки" },
  { id: "gcb", label: "ГЦБ" },
  { id: "who", label: "Кому" },
  { id: "news", label: "Новости" },
  { id: "contacts", label: "Контакты" },
];

function Delta({ value }: { value: number }) {
  return (
    <span className={css.delta} data-dir={value > 0 ? "up" : value < 0 ? "down" : undefined}>
      {pct(value)}
    </span>
  );
}

export default async function EkranConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const chart = smoothPath(
    data.indexSeries.map((row) => row.value),
    1200,
    360,
    20,
  );
  const first = data.indexSeries[0]?.date ?? "";
  const last = data.indexSeries.at(-1)?.date ?? "";
  const sessionDate = data.session.date ? longDate(data.session.date) : "последней сессии";
  const phones = data.contacts.phones.length ? data.contacts.phones : ["+996 312 31 14 84", "+996 551 31 14 84"];
  const address = data.contacts.address || "г. Бишкек, ул. Московская, 172";
  const email = data.contacts.email || "office@kse.kg";
  const [lead, ...rest] = data.news;

  return (
    <ConceptPage accent="#c8f560">
      <div className={css.page}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <Link href="/design-concepts/ekran" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={44} height={41} priority />
            <span>KSE</span>
          </Link>
          <span className={css.status}>
            <i aria-hidden="true" data-open={data.session.open ? "" : undefined} />
            {data.session.label} · KSE {num(data.index.value, 2)} <Delta value={data.index.change} />
          </span>
          <Link href="/members" className={css.btn}>
            Открыть счёт
          </Link>
        </header>

        <nav className={css.dots} aria-label="Разделы страницы">
          {slides.map((s, i) => (
            <a key={s.id} href={`#${s.id}`}>
              <i aria-hidden="true" />
              <span>
                {String(i + 1).padStart(2, "0")} {s.label}
              </span>
            </a>
          ))}
        </nav>

        <main id="main">
          {/* 01 — Старт */}
          <section id="start" className={`${css.slide} ${css.start}`}>
            <Image src="/hero/bishkek-ala-too.jpg" alt="" fill priority sizes="100vw" className={css.startImg} />
            <div className={css.slideIn}>
              <p className={css.num} data-intro="fade">
                01 — Биржа Кыргызстана
              </p>
              <h1 data-intro="rise">
                Рынок, который
                <br />
                <em>работает на страну</em>
              </h1>
              <p className={css.lead} data-intro="rise" style={{ "--kc-d": "150ms" } as CSSProperties}>
                {data.quotes.total} бумаг · {data.issuers} эмитентов · торги {sessionDate}
              </p>
              <div className={css.ctas} data-intro="rise" style={{ "--kc-d": "300ms" } as CSSProperties}>
                <Link href="/members" className={css.btnLime}>
                  Начать инвестировать
                </Link>
                <a href="#index" className={css.btnGhost}>
                  Листать ↓
                </a>
              </div>
            </div>
          </section>

          {/* 02 — Индекс */}
          <section id="index" className={`${css.slide} ${css.index}`}>
            <div className={css.slideIn}>
              <p className={css.num} data-reveal>
                02 — Индекс KSE
              </p>
              <div className={css.indexRow} data-reveal>
                <b>{num(data.index.value, 2)}</b>
                <span>
                  <Delta value={data.index.change} />
                  <small>за сессию</small>
                </span>
              </div>
              {chart ? (
                <svg viewBox="0 0 1200 360" preserveAspectRatio="none" className={css.chart} aria-hidden="true" data-reveal>
                  <defs>
                    <linearGradient id="ekran-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#c8f560" stopOpacity="0.4" />
                      <stop offset="1" stopColor="#c8f560" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={chart.area} fill="url(#ekran-fill)" />
                  <path d={chart.line} pathLength={1} className={css.line} />
                </svg>
              ) : null}
              <div className={css.axis} data-reveal>
                <span>{first}</span>
                <span>
                  Капитализация {num(data.index.capitalization, 1)} млн сом · объём {num(data.volume.volumeMln, 1)} млн · {num(data.volume.trades)} сделок
                </span>
                <span>{last}</span>
              </div>
            </div>
          </section>

          {/* 03 — Котировки */}
          <section id="quotes" className={`${css.slide} ${css.quotes}`}>
            <div className={css.slideIn}>
              <div className={css.rowHead} data-reveal>
                <p className={css.num}>03 — Котировки</p>
                <Link href="/market/quotes">Все бумаги →</Link>
              </div>
              <table className={css.table} data-reveal>
                <thead>
                  <tr>
                    <th scope="col">Тикер</th>
                    <th scope="col">Эмитент</th>
                    <th scope="col">Цена, сом</th>
                    <th scope="col">Объём, сом</th>
                    <th scope="col">Изм.</th>
                  </tr>
                </thead>
                <tbody data-stagger>
                  {priced.slice(0, 8).map((item) => (
                    <tr key={item.ticker}>
                      <th scope="row">
                        <Link href={item.href}>{item.ticker}</Link>
                      </th>
                      <td>{item.name}</td>
                      <td>{num(item.price, 2)}</td>
                      <td>{item.volume ? num(item.volume) : "—"}</td>
                      <td>
                        <Delta value={item.change} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 04 — ГЦБ */}
          <section id="gcb" className={`${css.slide} ${css.gcb}`}>
            <div className={css.slideIn}>
              <p className={css.num} data-reveal>
                04 — Государственные ценные бумаги
              </p>
              <div className={css.gcbGrid}>
                <div data-reveal>
                  <h2>Аукционы Минфина — на бирже</h2>
                  <p>Казначейские векселя и облигации размещаются через торговую систему биржи. Участвовать можно через брокера.</p>
                  <Link href="/gcb" className={css.btnDark}>
                    Календарь и результаты →
                  </Link>
                </div>
                <ol className={css.auctions} data-stagger>
                  {data.auctions.length ? (
                    data.auctions.slice(0, 4).map((a) => (
                      <li key={`${a.date}-${a.type}`}>
                        <b>{a.date.slice(0, 5)}</b>
                        <span>{a.type}</span>
                        <em>{a.volume}</em>
                        <small>{a.status}</small>
                      </li>
                    ))
                  ) : (
                    <li>
                      <span>Расписание публикуется на странице ГЦБ</span>
                    </li>
                  )}
                </ol>
              </div>
            </div>
          </section>

          {/* 05 — Кому */}
          <section id="who" className={`${css.slide} ${css.who}`}>
            <div className={css.slideIn}>
              <p className={css.num} data-reveal>
                05 — Кому
              </p>
              <div className={css.whoGrid} data-stagger>
                <Link href="/investors" className={css.whoCard}>
                  <span className={css.whoPhoto}>
                    <Image src="/hub/hub-members.jpg" alt="" fill sizes="33vw" />
                  </span>
                  <b>Инвесторам</b>
                  <span>Брокер, счёт, первая бумага — четыре шага.</span>
                </Link>
                <Link href="/listing" className={css.whoCard}>
                  <span className={css.whoPhoto}>
                    <Image src="/hero/issuer-signing.jpg" alt="" fill sizes="33vw" />
                  </span>
                  <b>Эмитентам</b>
                  <span>Листинг, выпуск акций и облигаций, раскрытие.</span>
                </Link>
                <Link href={EDU_URL} className={css.whoCard} {...linkProps(EDU_URL)}>
                  <span className={css.whoPhoto}>
                    <Image src="/hub/hub-education.jpg" alt="" fill sizes="33vw" />
                  </span>
                  <b>Учиться</b>
                  <span>Курсы учебного центра для инвесторов и специалистов.</span>
                </Link>
              </div>
            </div>
          </section>

          {/* 06 — Новости */}
          {lead ? (
            <section id="news" className={`${css.slide} ${css.news}`}>
              <div className={css.slideIn}>
                <div className={css.rowHead} data-reveal>
                  <p className={css.num}>06 — Новости</p>
                  <Link href="/news">Все новости →</Link>
                </div>
                <div className={css.newsGrid}>
                  <Link href={`/news/${lead.slug}`} className={css.leadNews} data-reveal>
                    <span className={css.leadPhoto}>
                      <Image src={lead.photo} alt="" fill sizes="50vw" />
                    </span>
                    <small>
                      {longDate(lead.date)} · {lead.tag}
                    </small>
                    <b>{lead.title}</b>
                    <span>{lead.excerpt}</span>
                  </Link>
                  <ul className={css.newsList} data-stagger>
                    {[...rest, ...data.companyNews].slice(0, 5).map((item) => (
                      <li key={item.slug}>
                        <Link href={`/news/${item.slug}`}>
                          <small>{longDate(item.date)}</small>
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          {/* 07 — Контакты */}
          <section id="contacts" className={`${css.slide} ${css.contacts}`}>
            <div className={css.slideIn}>
              <p className={css.num} data-reveal>
                07 — Контакты
              </p>
              <h2 data-reveal>Говорите с биржей напрямую</h2>
              <div className={css.contactGrid} data-stagger>
                <div>
                  <small>Адрес</small>
                  <b>{address}</b>
                </div>
                <div>
                  <small>Телефоны</small>
                  {phones.slice(0, 2).map((phone) => (
                    <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                      {phone}
                    </a>
                  ))}
                </div>
                <div>
                  <small>Почта</small>
                  <a href={`mailto:${email}`}>{email}</a>
                </div>
                <div>
                  <small>Разделы</small>
                  <Link href="/market">Торги</Link>
                  <Link href="/disclosure">Раскрытие информации</Link>
                  <Link href="/documents">Документы</Link>
                </div>
              </div>
              <p className={css.legal}>
                {data.contacts.copyright}
                {data.contacts.license ? ` · Лицензия ${data.contacts.license}` : ""}
              </p>
            </div>
          </section>
        </main>

        <ConceptSwitch current="ekran" />
      </div>
    </ConceptPage>
  );
}
