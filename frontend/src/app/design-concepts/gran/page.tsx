import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage, Words } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import css from "./gran.module.css";

/*
 * Концепция 53 — «Грань». Строгая палитра: графит, бумажно-белый и один акцент — кобальт.
 * Креативная нота — «грань»: у фото и карточек срезан угол, через первый экран идёт настоящая линия индекса,
 * значение индекса набрано огромной контурной цифрой, которая заливается при прокрутке.
 * Шрифты — сайта (Unbounded / Manrope). Данные — loadHomeData(), фото — public (CREDITS.md).
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "53 · Грань" };

const nav = [
  { label: "Рынок", href: "/market" },
  { label: "Котировки", href: "/market/quotes" },
  { label: "ГЦБ", href: "/gcb" },
  { label: "Листинг", href: "/listing" },
  { label: "Раскрытие", href: "/disclosure" },
  { label: "О бирже", href: "/about" },
];

const typeName = { stock: "Акция", bond: "Облигация", gcb: "ГЦБ", metal: "Металл" } as const;

const doors = [
  {
    n: "01",
    title: "Инвесторам",
    text: "Как выбрать брокера, открыть счёт и купить первую ценную бумагу.",
    links: [
      { label: "С чего начать", href: "/investors" },
      { label: "Участники торгов", href: "/members" },
      { label: "Учебный центр", href: EDU_URL },
    ],
  },
  {
    n: "02",
    title: "Эмитентам",
    text: "Выпуск акций и облигаций, листинг и раскрытие информации.",
    links: [
      { label: "Листинг", href: "/listing" },
      { label: "Раскрытие информации", href: "/disclosure" },
      { label: "Тарифы", href: "/tariffs" },
    ],
  },
  {
    n: "03",
    title: "Участникам",
    text: "Правила торгов, документы и статистика для профессионалов рынка.",
    links: [
      { label: "Правила", href: "/regulations" },
      { label: "Документы", href: "/documents" },
      { label: "Статистика", href: "/statistics" },
    ],
  },
];

const steps = [
  { title: "Брокер", text: "Выберите брокера из списка участников торгов биржи." },
  { title: "Счёт", text: "Откройте брокерский счёт и счёт депо по паспорту." },
  { title: "Заявка", text: "Подайте заявку на покупку через брокера." },
  { title: "Сделка", text: "Сделка проходит на бирже, бумаги — на вашем счёте." },
];

/** Линия и заливка графика по ряду значений в прямоугольнике w×h. */
function chart(values: number[], w: number, h: number, pad = 10) {
  if (values.length < 2) return { line: "", area: "", last: { x: w, y: h / 2 }, min: 0, max: 0 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => ({ x: (i / (values.length - 1)) * w, y: pad + (1 - (v - min) / span) * (h - pad * 2) }));
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return { line, area: `${line} L${w} ${h} L0 ${h} Z`, last: pts[pts.length - 1], min, max };
}

function Arrow() {
  return (
    <svg className={css.arrow} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19 19 5M8 5h11v11" />
    </svg>
  );
}

export default async function GranConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const series = data.indexSeries.map((row) => row.value);
  const hero = chart(series, 600, 220, 16);
  const big = chart(series, 800, 320, 18);
  const first = data.indexSeries[0]?.date ?? "";
  const lastDate = data.indexSeries.at(-1)?.date ?? "";
  const sessionDate = data.session.date ? longDate(data.session.date) : "последней сессии";
  const up = data.index.change >= 0;
  const indexWhole = Math.round(data.index.value);
  const phones = data.contacts.phones.length ? data.contacts.phones : ["+996 312 31 14 84"];
  const address = data.contacts.address || "г. Бишкек, ул. Московская, 172";
  const email = data.contacts.email || "office@kse.kg";

  return (
    <ConceptPage accent="#2f45e0">
      <div className={css.page}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <div className={css.strip}>
          <div className={css.wrap}>
            <span className={css.status} data-open={data.session.open ? "" : undefined}>
              <i aria-hidden="true" />
              {data.session.label} · {data.session.hours}
            </span>
            <span>Торги {sessionDate}</span>
            <Link href="/market/index">
              KSE <b>{num(data.index.value, 2)}</b> <em data-up={up ? "" : undefined}>{pct(data.index.change)}</em>
            </Link>
            <span className={css.stripHide}>
              Объём <b>{num(data.volume.volumeMln, 1)} млн сом</b> · {num(data.volume.trades)} сделок
            </span>
          </div>
        </div>

        <header className={css.header}>
          <div className={css.wrap}>
            <Link href="/design-concepts/gran" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={30} height={28} priority />
              <span>
                Кыргызская
                <br />
                фондовая биржа
              </span>
            </Link>
            <nav aria-label="Основные разделы">
              {nav.map((item) => (
                <Link key={item.label} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link href="/members" className={css.btn}>
              Начать инвестировать
            </Link>
          </div>
        </header>

        <main id="main">
          {/* ——— Первый экран ——— */}
          <section className={`${css.wrap} ${css.hero}`}>
            <div className={css.heroText}>
              <p className={css.eyebrow} data-intro="fade">
                <span aria-hidden="true" /> Рынок капитала Кыргызстана
              </p>
              <h1 data-intro="words">
                <Words text="Капитал страны —" />
                <br />
                <em>
                  <Words text="в работе" from={3} />
                </em>
              </h1>
              <p className={css.lead} data-intro="rise" style={{ "--kc-d": "450ms" } as CSSProperties}>
                Акции, облигации, государственные ценные бумаги и драгоценные металлы. Прозрачные торги, открытые котировки
                и отчётность эмитентов — в одном месте.
              </p>
              <div className={css.ctas} data-intro="rise" style={{ "--kc-d": "600ms" } as CSSProperties}>
                <Link href="/members" className={css.btn}>
                  Начать инвестировать
                </Link>
                <Link href="/listing" className={css.btnGhost}>
                  Разместить выпуск <Arrow />
                </Link>
              </div>
              <dl className={css.figures} data-intro="rise" style={{ "--kc-d": "750ms" } as CSSProperties}>
                <div>
                  <dt>Индекс KSE</dt>
                  <dd>{num(data.index.value, 2)}</dd>
                </div>
                <div>
                  <dt>Объём сессии</dt>
                  <dd>{num(data.volume.volumeMln, 1)} млн</dd>
                </div>
                <div>
                  <dt>В котировках</dt>
                  <dd>{data.quotes.total} бумаг</dd>
                </div>
              </dl>
            </div>

            <div className={css.heroVisual} data-intro="fade" style={{ "--kc-d": "150ms" } as CSSProperties}>
              <div className={css.facet}>
                <Image src="/hero/bishkek-ala-too.jpg" alt="Бишкек и хребет Ала-Тоо" fill priority sizes="(max-width: 900px) 100vw, 46vw" />
                <svg className={css.heroLine} viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true">
                  <path d={hero.area} className={css.heroArea} />
                  <path d={hero.line} pathLength={1} />
                </svg>
              </div>
              <Link href="/market/index" className={css.plate}>
                <span>Индекс KSE · {lastDate}</span>
                <b>{num(data.index.value, 2)}</b>
                <em data-up={up ? "" : undefined}>
                  {up ? "▲" : "▼"} {pct(data.index.change)}
                </em>
              </Link>
              {/* Гравированные грани: тонкие диагонали, продолжающие срез фото. */}
              <svg className={css.hairlines} viewBox="0 0 200 200" aria-hidden="true">
                <path d="M0 120 120 0M0 150 150 0M0 180 180 0" />
              </svg>
            </div>
          </section>

          {/* ——— Лента котировок ——— */}
          {priced.length ? (
            <div className={css.ribbon} aria-label="Котировки последней сессии">
              <div className={css.ribbonTrack}>
                {[0, 1].map((copy) => (
                  <ul key={copy} aria-hidden={copy ? "true" : undefined}>
                    {priced.slice(0, 14).map((item) => (
                      <li key={item.ticker}>
                        <b>{item.ticker}</b>
                        <span>{num(item.price, 2)}</span>
                        <em data-up={item.change >= 0 ? "" : undefined}>{pct(item.change)}</em>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          ) : null}

          {/* ——— Три входа ——— */}
          <section className={`${css.wrap} ${css.section}`}>
            <header className={css.head} data-reveal>
              <p className={css.eyebrow}>
                <span aria-hidden="true" /> Для кого биржа
              </p>
              <h2>Три входа на рынок</h2>
            </header>
            <div className={css.doors} data-stagger>
              {doors.map((door) => (
                <article key={door.n} className={css.door}>
                  <span className={css.doorN}>{door.n}</span>
                  <h3>{door.title}</h3>
                  <p>{door.text}</p>
                  <ul>
                    {door.links.map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} {...linkProps(link.href)}>
                          {link.label} <Arrow />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          {/* ——— Рынок: график и таблица ——— */}
          <section className={css.dark}>
            <div className={`${css.wrap} ${css.section}`}>
              <header className={css.head} data-reveal>
                <p className={css.eyebrow}>
                  <span aria-hidden="true" /> Рынок · {sessionDate}
                </p>
                <h2>Индекс и котировки</h2>
              </header>
              <div className={css.market}>
                <figure className={css.chart} data-reveal>
                  <figcaption>
                    <span>Индекс KSE, последние {series.length} сессий</span>
                    <b>{num(data.index.value, 2)}</b>
                    <em data-up={up ? "" : undefined}>{pct(data.index.change)} за сессию</em>
                  </figcaption>
                  <div className={css.chartBox}>
                    <svg viewBox="0 0 800 320" preserveAspectRatio="none" aria-hidden="true">
                      {[0.25, 0.5, 0.75].map((y) => (
                        <line key={y} x1="0" x2="800" y1={320 * y} y2={320 * y} />
                      ))}
                      <path d={big.area} className={css.chartArea} />
                      <path d={big.line} className={css.chartLine} pathLength={1} />
                    </svg>
                    <i className={css.dot} style={{ left: `${(big.last.x / 800) * 100}%`, top: `${(big.last.y / 320) * 100}%` }} aria-hidden="true" />
                    <span className={css.axisMax}>{num(big.max, 0)}</span>
                    <span className={css.axisMin}>{num(big.min, 0)}</span>
                  </div>
                  <div className={css.axisX}>
                    <span>{first}</span>
                    <span>{lastDate}</span>
                  </div>
                </figure>

                <div className={css.table} data-reveal style={{ "--kc-d": "120ms" } as CSSProperties}>
                  <table>
                    <caption className={css.sr}>Котировки последней сессии</caption>
                    <thead>
                      <tr>
                        <th scope="col">Бумага</th>
                        <th scope="col">Цена, сом</th>
                        <th scope="col">Изм.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priced.slice(0, 8).map((item) => (
                        <tr key={item.ticker}>
                          <th scope="row">
                            <Link href={item.href}>
                              <b>{item.ticker}</b>
                              <span>
                                {typeName[item.type]} · {item.name}
                              </span>
                            </Link>
                          </th>
                          <td>{num(item.price, 2)}</td>
                          <td>
                            <em data-up={item.change >= 0 ? "" : undefined} data-flat={item.change === 0 ? "" : undefined}>
                              {pct(item.change)}
                            </em>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Link href="/market/quotes" className={css.more}>
                    Все котировки <Arrow />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ——— Огромная цифра ——— */}
          <section className={css.giant} aria-label={`Индекс KSE: ${num(data.index.value, 2)} пунктов`}>
            <div className={css.wrap}>
              <p className={css.giantNum} data-reveal aria-hidden="true">
                {num(indexWhole)}
              </p>
              <div className={css.giantText} data-reveal>
                <p>
                  пунктов — индекс KSE на {sessionDate}. Капитализация бумаг индекса —{" "}
                  <b>{num(data.index.capitalization, 1)} млн сом</b>.
                </p>
                <Link href="/market/index" className={css.btnGhost}>
                  Как считается индекс <Arrow />
                </Link>
              </div>
            </div>
          </section>

          {/* ——— ГЦБ ——— */}
          {data.auctions.length ? (
            <section className={`${css.wrap} ${css.section}`}>
              <header className={css.headRow} data-reveal>
                <div>
                  <p className={css.eyebrow}>
                    <span aria-hidden="true" /> Государственные ценные бумаги
                  </p>
                  <h2>Аукционы Минфина</h2>
                </div>
                <Link href="/gcb" className={css.btnGhost}>
                  Календарь аукционов <Arrow />
                </Link>
              </header>
              <ol className={css.auctions} data-stagger>
                {data.auctions.map((item) => {
                  const [d, m, y] = item.date.split(".");
                  return (
                    <li key={`${item.date}-${item.type}`}>
                      <Link href="/gcb">
                        <span className={css.date}>
                          <b>
                            {d}.{m}
                          </b>
                          <small>{y}</small>
                        </span>
                        <span className={css.aType}>{item.type.toUpperCase()}</span>
                        <span className={css.aVol}>{item.volume}</span>
                        <span className={css.aStatus}>{item.status}</span>
                        <Arrow />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          ) : null}

          {/* ——— Как начать ——— */}
          <section className={css.paper2}>
            <div className={`${css.wrap} ${css.section}`}>
              <header className={css.head} data-reveal>
                <p className={css.eyebrow}>
                  <span aria-hidden="true" /> Частным инвесторам
                </p>
                <h2>Первая сделка — за четыре шага</h2>
              </header>
              <ol className={css.steps} data-stagger>
                {steps.map((step, i) => (
                  <li key={step.title}>
                    <span className={css.stepN}>{String(i + 1).padStart(2, "0")}</span>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ——— Новости ——— */}
          {data.news.length ? (
            <section className={`${css.wrap} ${css.section}`}>
              <header className={css.headRow} data-reveal>
                <div>
                  <p className={css.eyebrow}>
                    <span aria-hidden="true" /> Пресс-центр
                  </p>
                  <h2>Новости биржи</h2>
                </div>
                <Link href="/news" className={css.btnGhost}>
                  Все новости <Arrow />
                </Link>
              </header>
              <div className={css.news} data-stagger>
                {data.news.slice(0, 3).map((item) => (
                  <Link key={item.slug} href={`/news/${item.slug}`} className={css.newsCard}>
                    <span className={css.newsPhoto}>
                      <Image src={item.photo} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" />
                    </span>
                    <span className={css.newsMeta}>
                      {item.date} · {item.tag}
                    </span>
                    <b>{item.title}</b>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* ——— Призыв ——— */}
          <section className={css.wrap}>
            <div className={css.cta} data-reveal="zoom">
              <svg className={css.ctaFacets} viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true">
                <path d="M400 0 L400 300 L190 300 Z" />
                <path d="M400 60 L400 300 L280 300 Z" />
              </svg>
              <h2>Начните с выбора брокера</h2>
              <p>Список лицензированных участников торгов — с контактами и условиями обслуживания.</p>
              <Link href="/members" className={css.btnLight}>
                Участники торгов <Arrow />
              </Link>
            </div>
          </section>
        </main>

        <footer className={css.footer}>
          <div className={css.wrap}>
            <div className={css.footTop}>
              <Link href="/design-concepts/gran" className={css.logo} aria-label="Кыргызская фондовая биржа">
                <Image src="/brand/kse-mark.png" alt="" width={30} height={28} />
                <span>
                  Кыргызская
                  <br />
                  фондовая биржа
                </span>
              </Link>
              <address>
                <span>{address}</span>
                <span>{phones.join(" · ")}</span>
                <a href={`mailto:${email}`}>{email}</a>
              </address>
            </div>
            <div className={css.cols}>
              <div>
                <b>Рынок</b>
                <Link href="/market">Итоги торгов</Link>
                <Link href="/market/quotes">Котировки</Link>
                <Link href="/market/index">Индекс KSE</Link>
                <Link href="/gcb">ГЦБ</Link>
              </div>
              <div>
                <b>Эмитентам</b>
                <Link href="/listing">Листинг</Link>
                <Link href="/disclosure">Раскрытие информации</Link>
                <Link href="/tariffs">Тарифы</Link>
              </div>
              <div>
                <b>Инвесторам</b>
                <Link href="/investors">С чего начать</Link>
                <Link href="/members">Участники торгов</Link>
                <Link href={EDU_URL} {...linkProps(EDU_URL)}>
                  Учебный центр
                </Link>
              </div>
              <div>
                <b>Биржа</b>
                <Link href="/about">О бирже</Link>
                <Link href="/news">Новости</Link>
                <Link href="/contacts">Контакты</Link>
              </div>
            </div>
            <div className={css.legal}>
              <span>{data.contacts.copyright}</span>
              {data.contacts.license ? <span>Лицензия {data.contacts.license}</span> : null}
            </div>
          </div>
        </footer>

        <ConceptSwitch current="gran" />
      </div>
    </ConceptPage>
  );
}
