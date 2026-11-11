import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Manrope } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, nav, num, pct, steps } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import { Track } from "./Track";
import css from "./marshrut.module.css";

/*
 * Концепция 28 — «Маршрут»: главная как линия метро. Прокрутка вниз везёт страницу вбок от станции к станции:
 * старт, индекс, сессия, котировки, ГЦБ, новости, конечная — первая сделка. Внизу схема линии с текущей станцией.
 * На телефоне и при «уменьшить движение» станции идут обычным столбиком. Только реальные данные.
 */
const manrope = Manrope({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"], variable: "--mr-font" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "28 · Маршрут" };

const stations = [
  { id: "mr-start", name: "Старт" },
  { id: "mr-index", name: "Индекс" },
  { id: "mr-session", name: "Сессия" },
  { id: "mr-quotes", name: "Котировки" },
  { id: "mr-gcb", name: "ГЦБ" },
  { id: "mr-news", name: "Новости" },
  { id: "mr-finish", name: "Первая сделка" },
];

function Stop({ n }: { n: number }) {
  return (
    <p className={css.stop}>
      <i aria-hidden="true" />
      Станция {n} · {stations[n - 1].name}
    </p>
  );
}

export default async function MarshrutConcept() {
  const data = await loadHomeData();
  const chart = smoothPath(data.history, 800, 300, 12);
  const quotes = data.instruments.filter((item) => item.price > 0).slice(0, 6);
  const first = data.indexSeries[0];
  const last = data.indexSeries.at(-1);

  return (
    <ConceptPage accent="#ff5a1f">
      <div className={`${css.page} ${manrope.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <Link href="/design-concepts/marshrut" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={28} height={26} priority />
            <span>Кыргызская фондовая биржа</span>
          </Link>
          <nav className={css.nav} aria-label="Основное меню">
            {nav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main id="main">
          <Track stations={stations}>
            {/* 1. Старт. */}
            <section id="mr-start" className={`${css.panel} ${css.start}`} aria-labelledby="mr-start-h">
              <div className={css.startText}>
                <Stop n={1} />
                <h1 id="mr-start-h" data-intro="rise">
                  Поехали по&nbsp;рынку Кыргызстана
                </h1>
                <p data-intro="rise" style={{ "--kc-d": "120ms" } as CSSProperties}>
                  Семь станций — от индекса до первой сделки. Листайте вниз: страница поедет вбок.
                </p>
                <p className={css.hint} aria-hidden="true">
                  <span>↓</span> прокрутка · <span>→</span> движение
                </p>
              </div>
              <div className={css.startPhoto} data-intro="zoom">
                <Image src="/hero/bishkek-ala-too.jpg" alt="Бишкек на фоне хребта Ала-Тоо" fill priority sizes="(max-width: 900px) 100vw, 50vw" />
              </div>
            </section>

            {/* 2. Индекс. */}
            <section id="mr-index" className={`${css.panel} ${css.indexPanel}`} aria-labelledby="mr-index-h">
              <div className={css.panelHead}>
                <Stop n={2} />
                <h2 id="mr-index-h">Индекс KSE</h2>
              </div>
              <div className={css.indexBody}>
                <p className={css.huge}>{num(data.index.value, 2)}</p>
                <p className={data.index.change >= 0 ? css.up : css.down}>{pct(data.index.change)} за последнюю сессию</p>
                <p className={css.muted}>Капитализация рынка — {num(data.index.capitalization, 1)} млрд сом</p>
                <Link href="/market/index" className={css.btn}>
                  История индекса
                </Link>
              </div>
              {chart ? (
                <figure className={css.chart}>
                  <svg viewBox="0 0 800 300" preserveAspectRatio="none" aria-hidden="true">
                    <path className={css.area} d={chart.area} />
                    <path className={css.line} d={chart.line} />
                  </svg>
                  {first && last ? (
                    <figcaption>
                      <span>{first.date}</span>
                      <span>{last.date}</span>
                    </figcaption>
                  ) : null}
                </figure>
              ) : null}
            </section>

            {/* 3. Сессия. */}
            <section id="mr-session" className={`${css.panel} ${css.dark}`} aria-labelledby="mr-session-h">
              <div className={css.panelHead}>
                <Stop n={3} />
                <h2 id="mr-session-h">Торговая сессия</h2>
              </div>
              <div className={css.sessionGrid}>
                <div className={css.clock}>
                  <span className={css.status} data-open={data.session.open || undefined}>
                    <i aria-hidden="true" />
                    {data.session.label}
                  </span>
                  <b>{data.session.clock}</b>
                  <span>по Бишкеку · торги по будням {data.session.hours}</span>
                </div>
                <dl className={css.stats}>
                  <div>
                    <dt>Объём</dt>
                    <dd>
                      {num(data.volume.volumeMln, 1)} <small>млн сом</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Сделок</dt>
                    <dd>{num(data.volume.trades)}</dd>
                  </div>
                  <div>
                    <dt>Индекс KSE</dt>
                    <dd>{num(data.index.value, 2)}</dd>
                  </div>
                  <div>
                    <dt>Бумаг в котировках</dt>
                    <dd>{num(data.quotes.total)}</dd>
                  </div>
                </dl>
                <p className={css.muted}>Итоги сессии {longDate(data.session.date)}</p>
              </div>
            </section>

            {/* 4. Котировки. */}
            <section id="mr-quotes" className={`${css.panel} ${css.quotesPanel}`} aria-labelledby="mr-quotes-h">
              <div className={css.panelHead}>
                <Stop n={4} />
                <h2 id="mr-quotes-h">Котировки</h2>
              </div>
              <ul className={css.quotes}>
                {quotes.map((item) => (
                  <li key={item.ticker}>
                    <Link href={item.href}>
                      <b>{item.ticker}</b>
                      <span>{item.name}</span>
                      <strong>{num(item.price, 2)}</strong>
                      <em className={item.change > 0 ? css.up : item.change < 0 ? css.down : undefined}>{item.change ? pct(item.change) : "—"}</em>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/market/quotes" className={css.btn}>
                Все {num(data.quotes.total)} бумаг
              </Link>
            </section>

            {/* 5. ГЦБ — табло отправлений. */}
            <section id="mr-gcb" className={`${css.panel} ${css.orange}`} aria-labelledby="mr-gcb-h">
              <div className={css.panelHead}>
                <Stop n={5} />
                <h2 id="mr-gcb-h">Аукционы ГЦБ</h2>
              </div>
              <p className={css.lead}>Государственные ценные бумаги Министерства финансов размещаются на аукционах биржи. Ближайшие «отправления»:</p>
              {data.auctions.length ? (
                <table className={css.board}>
                  <thead>
                    <tr>
                      <th scope="col">Дата</th>
                      <th scope="col">Бумага</th>
                      <th scope="col">Объём</th>
                      <th scope="col">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.auctions.map((item) => (
                      <tr key={`${item.date}-${item.type}`}>
                        <td>{item.date}</td>
                        <td>{item.type}</td>
                        <td>{item.volume}</td>
                        <td>{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className={css.lead}>Новые аукционы появятся в календаре.</p>
              )}
              <Link href="/gcb" className={css.btnDark}>
                Календарь аукционов
              </Link>
            </section>

            {/* 6. Новости. */}
            <section id="mr-news" className={`${css.panel} ${css.newsPanel}`} aria-labelledby="mr-news-h">
              <div className={css.panelHead}>
                <Stop n={6} />
                <h2 id="mr-news-h">Новости</h2>
              </div>
              <ul className={css.news}>
                {data.news.slice(0, 3).map((item) => (
                  <li key={item.slug}>
                    <Link href={`/news/${item.slug}`}>
                      <span className={css.newsPhoto}>
                        <Image src={item.photo} alt="" fill sizes="(max-width: 900px) 100vw, 28vw" />
                      </span>
                      <small>
                        {item.tag} · {longDate(item.date)}
                      </small>
                      <b>{item.title}</b>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/news" className={css.btn}>
                Все новости
              </Link>
            </section>

            {/* 7. Конечная. */}
            <section id="mr-finish" className={`${css.panel} ${css.finish}`} aria-labelledby="mr-finish-h">
              <div className={css.panelHead}>
                <Stop n={7} />
                <h2 id="mr-finish-h">Конечная: ваша первая сделка</h2>
              </div>
              <ol className={css.steps}>
                {steps.map((step, i) => (
                  <li key={step.title}>
                    <Link href={step.href} {...linkProps(step.href)}>
                      <span>{i + 1}</span>
                      <b>{step.title}</b>
                      <small>{step.text}</small>
                    </Link>
                  </li>
                ))}
              </ol>
              <p className={css.finishActions}>
                <Link href="/members" className={css.btnDark}>
                  Выбрать брокера
                </Link>
                <Link href={EDU_URL} className={css.btn} {...linkProps(EDU_URL)}>
                  Учебный центр
                </Link>
              </p>
            </section>
          </Track>
        </main>

        <footer className={css.footer}>
          <div>
            <b>{data.contacts.copyright}</b>
            <p>{data.contacts.address}</p>
            <p>
              {data.contacts.phones[0] ?? ""}
              {data.contacts.email ? (
                <>
                  {" · "}
                  <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a>
                </>
              ) : null}
            </p>
          </div>
          <nav aria-label="Подвал">
            <Link href="/documents">Документы</Link>
            <Link href="/listing">Листинг</Link>
            <Link href="/disclosure">Раскрытие информации</Link>
            <Link href="/contacts">Контакты</Link>
          </nav>
          <p className={css.legal}>
            {data.contacts.license ? `Лицензия ${data.contacts.license}. ` : ""}Информация на сайте не является инвестиционной рекомендацией.
          </p>
        </footer>
        <ConceptSwitch current="marshrut" />
      </div>
    </ConceptPage>
  );
}
