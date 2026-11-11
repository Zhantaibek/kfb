import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Caveat, PT_Mono, PT_Serif } from "next/font/google";
import type { InstrumentType } from "@/data/catalog";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { dateKey, linePath, linkProps, longDate, nav, num, pct, steps } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import css from "./reestr.module.css";

/*
 * Концепция 27 — «Реестр»: сайт биржи как биржевая книга. Кремовая бумага, красная линия полей, разлинованные
 * таблицы, моноширинные цифры, круглая печать сессии, пометки от руки на полях, картотека аукционов ГЦБ,
 * вырезки новостей и миллиметровка с графиком индекса. Только реальные данные.
 */
const serif = PT_Serif({ subsets: ["latin", "cyrillic"], weight: ["400", "700"], variable: "--rs-serif" });
const mono = PT_Mono({ subsets: ["latin", "cyrillic"], weight: "400", variable: "--rs-mono" });
const hand = Caveat({ subsets: ["latin", "cyrillic"], weight: ["500", "700"], variable: "--rs-hand" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "27 · Реестр" };

const kindName: Record<InstrumentType, string> = { stock: "акция", bond: "облиг.", gcb: "ГЦБ", metal: "металл" };

/** Номер листа книги — дней от 1 января 1994 года (год основания биржи) до даты сессии. */
function sheetNumber(date: string) {
  const day = Date.parse(dateKey(date));
  return Number.isFinite(day) ? Math.floor((day - Date.UTC(1994, 0, 1)) / 86_400_000) : null;
}

export default async function ReestrConcept() {
  const data = await loadHomeData();
  const rows = data.instruments.filter((item) => item.price > 0).slice(0, 10);
  const sheet = sheetNumber(data.session.date);
  const values = data.indexSeries.map((row) => row.value);
  const chart = linePath(values, 600, 220, 16);
  const hi = values.length ? Math.max(...values) : 0;
  const lo = values.length ? Math.min(...values) : 0;
  const first = data.indexSeries[0];
  const last = data.indexSeries.at(-1);

  return (
    <ConceptPage accent="#b3261e">
      <div className={`${css.page} ${serif.variable} ${mono.variable} ${hand.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        {/* Корешок книги и закладки-разделители. */}
        <header className={css.header}>
          <Link href="/design-concepts/reestr" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={30} height={28} priority />
            <span>
              <b>Кыргызская фондовая биржа</b>
              <small>Биржевая книга{sheet ? ` · лист № ${num(sheet)}` : ""}</small>
            </span>
          </Link>
          <nav className={css.tabs} aria-label="Основное меню">
            {nav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main id="main" className={css.sheet}>
          {/* 1. Титульная запись и запись сессии с печатью. */}
          <section className={css.hero} aria-labelledby="rs-hero">
            <p className={css.margin} aria-hidden="true">
              с 1994 г.
            </p>
            <div className={css.heroText}>
              <p className={css.kicker} data-intro="fade">
                Открытый реестр рынка ценных бумаг
              </p>
              <h1 id="rs-hero" data-intro="rise" style={{ "--kc-d": "80ms" } as CSSProperties}>
                Каждая сделка записана. Книга открыта каждому.
              </h1>
              <p className={css.lead} data-intro="rise" style={{ "--kc-d": "160ms" } as CSSProperties}>
                {data.tagline || "Кыргызская фондовая биржа ведёт торги акциями, облигациями и государственными ценными бумагами и публикует итоги каждой сессии."}
              </p>
              <p className={css.links} data-intro="rise" style={{ "--kc-d": "240ms" } as CSSProperties}>
                <Link href="/market/quotes">→ Котировки сессии</Link>
                <Link href="/members">→ Как начать инвестировать</Link>
              </p>
            </div>

            <aside className={css.entry} aria-label="Запись торговой сессии" data-intro="rise" style={{ "--kc-d": "200ms" } as CSSProperties}>
              <p className={css.entryHead}>
                Запись сессии
                <span>{longDate(data.session.date)}</span>
              </p>
              <dl>
                <div>
                  <dt>Индекс KSE</dt>
                  <dd>{num(data.index.value, 2)}</dd>
                </div>
                <div>
                  <dt>Изменение</dt>
                  <dd className={data.index.change >= 0 ? css.up : css.down}>{pct(data.index.change)}</dd>
                </div>
                <div>
                  <dt>Объём торгов, млн сом</dt>
                  <dd>{num(data.volume.volumeMln, 1)}</dd>
                </div>
                <div>
                  <dt>Сделок</dt>
                  <dd>{num(data.volume.trades)}</dd>
                </div>
                <div>
                  <dt>Капитализация, млрд сом</dt>
                  <dd>{num(data.index.capitalization, 1)}</dd>
                </div>
                <div>
                  <dt>Часы торгов</dt>
                  <dd>{data.session.hours}</dd>
                </div>
              </dl>
              <p className={css.sign}>
                <span>Записано: КФБ</span>
                <span className={css.signature} aria-hidden="true">
                  Kse
                </span>
              </p>
              <span className={css.stamp} data-open={data.session.open || undefined} aria-label={data.session.label}>
                <span>Кыргызская фондовая биржа</span>
                <b>{data.session.open ? "Открыта" : "Закрыта"}</b>
                <span>сессия · {data.session.clock}</span>
              </span>
            </aside>
          </section>

          {/* 2. Разлинованная таблица котировок. */}
          <section className={css.ledger} aria-labelledby="rs-ledger">
            {rows[0] ? (
              <p className={css.margin} aria-hidden="true">
                лидер по объёму →
              </p>
            ) : null}
            <div className={css.sectionHead}>
              <h2 id="rs-ledger">Котировки последней сессии</h2>
              <Link href="/market/quotes">Вся книга котировок →</Link>
            </div>
            <div className={css.tableWrap} data-reveal>
              <table>
                <thead>
                  <tr>
                    <th scope="col">№</th>
                    <th scope="col">Бумага</th>
                    <th scope="col">Эмитент</th>
                    <th scope="col">Вид</th>
                    <th scope="col">Цена, сом</th>
                    <th scope="col">Изм.</th>
                    <th scope="col">Объём</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.ticker}>
                      <td>{String(i + 1).padStart(2, "0")}</td>
                      <th scope="row">
                        <Link href={row.href}>{row.ticker}</Link>
                      </th>
                      <td className={css.issuer}>{row.name}</td>
                      <td>{kindName[row.type]}</td>
                      <td>{num(row.price, 2)}</td>
                      <td className={row.change > 0 ? css.up : row.change < 0 ? css.down : undefined}>{row.change ? pct(row.change) : "—"}</td>
                      <td>{num(row.volume, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Миллиметровка: индекс за последние сессии. */}
          {chart && first && last ? (
            <section className={css.graph} aria-labelledby="rs-graph">
              <div className={css.sectionHead}>
                <h2 id="rs-graph">Индекс KSE на миллиметровке</h2>
                <Link href="/market/index">История индекса →</Link>
              </div>
              <figure className={css.paper} data-reveal>
                <svg viewBox="0 0 600 220" preserveAspectRatio="none" role="img" aria-label={`Индекс KSE с ${first.date} по ${last.date}: от ${num(first.value, 2)} до ${num(last.value, 2)}`} data-draw>
                  <path d={chart} />
                </svg>
                <figcaption>
                  <span>{first.date}</span>
                  <span className={css.hand}>
                    макс. {num(hi, 0)} · мин. {num(lo, 0)}
                  </span>
                  <span>{last.date}</span>
                </figcaption>
              </figure>
            </section>
          ) : null}

          {/* 4. Картотека аукционов ГЦБ. */}
          <section className={css.cards} aria-labelledby="rs-gcb">
            <div className={css.sectionHead}>
              <h2 id="rs-gcb">Картотека аукционов ГЦБ</h2>
              <Link href="/gcb">Календарь Минфина →</Link>
            </div>
            {data.auctions.length ? (
              <ul data-stagger>
                {data.auctions.map((item) => (
                  <li key={`${item.date}-${item.type}`} className={css.card}>
                    <span className={css.cardDate}>{item.date}</span>
                    <b>{item.type}</b>
                    <span>Объём: {item.volume}</span>
                    <span className={css.cardStatus}>{item.status}</span>
                    <i className={css.hole} aria-hidden="true" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className={css.lead}>Новые аукционы появятся в календаре Министерства финансов.</p>
            )}
          </section>

          {/* 5. Вырезки: новости биржи. */}
          <section className={css.clips} aria-labelledby="rs-news">
            <div className={css.sectionHead}>
              <h2 id="rs-news">Вырезки из новостей</h2>
              <Link href="/news">Подшивка новостей →</Link>
            </div>
            <ul data-stagger>
              {data.news.slice(0, 3).map((item, i) => (
                <li key={item.slug} style={{ "--tilt": `${[-1.2, 0.8, -0.5][i]}deg` } as CSSProperties}>
                  <Link href={`/news/${item.slug}`} className={css.clip}>
                    <span className={css.tape} aria-hidden="true" />
                    <span className={css.clipPhoto}>
                      <Image src={item.photo} alt="" fill sizes="(max-width: 800px) 100vw, 380px" />
                    </span>
                    <time>{longDate(item.date)}</time>
                    <b>{item.title}</b>
                    <span>{item.excerpt}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 6. Порядок действий — чек-лист от руки. */}
          <section className={css.steps} aria-labelledby="rs-steps">
            <p className={css.margin} aria-hidden="true">
              для новичков
            </p>
            <div>
              <h2 id="rs-steps">Порядок действий инвестора</h2>
              <ol data-stagger>
                {steps.map((step, i) => (
                  <li key={step.title}>
                    <span className={css.box} aria-hidden="true">
                      {i + 1}
                    </span>
                    <Link href={step.href} {...linkProps(step.href)}>
                      <b>{step.title}</b>
                      <span>{step.text}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </main>

        {/* Выходные данные. */}
        <footer className={css.footer}>
          <p className={css.colophon}>Выходные данные</p>
          <p>
            <b>{data.contacts.copyright}</b>
          </p>
          <p>
            {data.contacts.address}
            <br />
            {data.contacts.phones.join(", ")}
            {data.contacts.email ? (
              <>
                {" · "}
                <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a>
              </>
            ) : null}
          </p>
          <nav aria-label="Подвал">
            <Link href="/documents">Документы</Link>
            <Link href="/listing">Листинг</Link>
            <Link href="/members">Участники торгов</Link>
            <Link href={EDU_URL} {...linkProps(EDU_URL)}>
              Учебный центр
            </Link>
            <Link href="/contacts">Контакты</Link>
          </nav>
          <p className={css.legal}>
            {data.contacts.license ? `Лицензия ${data.contacts.license}. ` : ""}Информация не является инвестиционной рекомендацией.
          </p>
        </footer>
        <ConceptSwitch current="reestr" />
      </div>
    </ConceptPage>
  );
}
