import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import css from "./polden.module.css";

/*
 * Концепция 61 — «Полдень». Тёплый журнальный стиль: терракота, песок и глубокий бирюзовый,
 * асимметричная журнальная сетка, крупная типографика (базовый кегль 24px). Шрифты сайта, данные — loadHomeData().
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "61 · Полдень" };

const nav = [
  { label: "Рынок", href: "/market" },
  { label: "Котировки", href: "/market/quotes" },
  { label: "ГЦБ", href: "/gcb" },
  { label: "Листинг", href: "/listing" },
  { label: "Раскрытие", href: "/disclosure" },
  { label: "Новости", href: "/news" },
];

const sectors = [
  { title: "Авиация", photo: "/sectors/airport.jpg" },
  { title: "Энергетика", photo: "/sectors/hydro.jpg" },
  { title: "Финансы", photo: "/sectors/bank.jpg" },
  { title: "Горнодобыча", photo: "/sectors/gold-mine.jpg" },
  { title: "Нефть и газ", photo: "/sectors/oil.jpg" },
  { title: "Связь", photo: "/sectors/telecom.jpg" },
];

const months = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

function Delta({ value }: { value: number }) {
  return (
    <span className={css.delta} data-dir={value > 0 ? "up" : value < 0 ? "down" : undefined}>
      {pct(value)}
    </span>
  );
}

export default async function PoldenConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const chart = smoothPath(
    data.indexSeries.map((row) => row.value),
    400,
    120,
    8,
  );
  const sessionDate = data.session.date ? longDate(data.session.date) : "последней сессии";
  const phones = data.contacts.phones.length ? data.contacts.phones : ["+996 312 31 14 84"];
  const address = data.contacts.address || "г. Бишкек, ул. Московская, 172";
  const email = data.contacts.email || "office@kse.kg";
  const [lead, ...rest] = data.news;

  return (
    <ConceptPage accent="#c4552d">
      <div className={css.page}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <div className={css.wrap}>
            <div className={css.topline}>
              <span>{sessionDate}</span>
              <span className={css.live} data-open={data.session.open ? "" : undefined}>
                <i aria-hidden="true" /> {data.session.label}
              </span>
              <span>
                KSE <b>{num(data.index.value, 2)}</b> <Delta value={data.index.change} />
              </span>
            </div>
            <div className={css.bar}>
              <Link href="/design-concepts/polden" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
                <Image src="/brand/kse-mark.png" alt="" width={48} height={45} priority />
                <span>
                  Кыргызская
                  <br />
                  фондовая биржа
                </span>
              </Link>
              <nav aria-label="Основные разделы" className={css.nav}>
                {nav.map((item) => (
                  <Link key={item.label} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <Link href="/members" className={css.btn}>
                Инвестировать
              </Link>
            </div>
          </div>
        </header>

        <main id="main" className={css.wrap}>
          {/* ——— Первый экран ——— */}
          <section className={css.hero}>
            <div className={css.heroPhoto} data-intro="fade">
              <Image src="/hero/bishkek-ala-too.jpg" alt="Бишкек и хребет Ала-Тоо" fill priority sizes="(max-width: 1100px) 100vw, 60vw" />
              <div className={css.heroText}>
                <p className={css.kicker}>Рынок капитала Кыргызстана</p>
                <h1>
                  Время
                  <br />
                  вкладывать
                  <br />
                  <em>в своё</em>
                </h1>
              </div>
            </div>
            <div className={css.heroSide}>
              <Link href="/market/index" className={css.indexCard} data-intro="rise" style={{ "--kc-d": "120ms" } as CSSProperties}>
                <small>Индекс KSE · {sessionDate}</small>
                <b>{num(data.index.value, 2)}</b>
                <Delta value={data.index.change} />
                {chart ? (
                  <svg viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
                    <path d={chart.area} className={css.area} />
                    <path d={chart.line} pathLength={1} className={css.line} />
                  </svg>
                ) : null}
                <span>Капитализация {num(data.index.capitalization, 1)} млн сом</span>
              </Link>
              <div className={css.lead} data-intro="rise" style={{ "--kc-d": "220ms" } as CSSProperties}>
                <p>Акции компаний страны, облигации и государственные бумаги — открытые торги и отчётность эмитентов.</p>
                <div className={css.ctas}>
                  <Link href="/members" className={css.btn}>
                    С чего начать
                  </Link>
                  <Link href="/listing" className={css.btnLine}>
                    Эмитентам
                  </Link>
                </div>
              </div>
              <dl className={css.figures} data-intro="rise" style={{ "--kc-d": "320ms" } as CSSProperties}>
                <div>
                  <dt>Объём</dt>
                  <dd>{num(data.volume.volumeMln, 1)} млн</dd>
                </div>
                <div>
                  <dt>Сделок</dt>
                  <dd>{num(data.volume.trades)}</dd>
                </div>
                <div>
                  <dt>Эмитентов</dt>
                  <dd>{data.issuers}</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* ——— Котировки и аукционы ——— */}
          <section className={css.market}>
            <div data-reveal>
              <div className={css.head}>
                <h2>Котировки</h2>
                <Link href="/market/quotes">Все бумаги →</Link>
              </div>
              <table className={css.table}>
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
                          <small>{item.name}</small>
                        </Link>
                      </th>
                      <td>{num(item.price, 2)}</td>
                      <td>
                        <Delta value={item.change} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={css.gcb} data-reveal style={{ "--kc-d": "120ms" } as CSSProperties}>
              <div className={css.head}>
                <h2>Аукционы ГЦБ</h2>
                <Link href="/gcb">Календарь →</Link>
              </div>
              {data.auctions.length ? (
                <ol>
                  {data.auctions.slice(0, 4).map((a) => {
                    const [d, m] = a.date.split(".");
                    return (
                      <li key={`${a.date}-${a.type}`}>
                        <span className={css.date}>
                          <b>{d}</b>
                          <small>{months[Number(m) - 1] ?? ""}</small>
                        </span>
                        <span>
                          <b>{a.type}</b>
                          <small>
                            {a.volume} · {a.status}
                          </small>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className={css.muted}>Расписание аукционов Минфина — на странице ГЦБ.</p>
              )}
              {data.leaders.length ? (
                <div className={css.leaders}>
                  <h3>Лидеры недели</h3>
                  <ul>
                    {data.leaders.slice(0, 3).map((r) => (
                      <li key={r.ticker}>
                        <b>{r.ticker}</b>
                        <span>{num(r.volume)} сом</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>

          {/* ——— Отрасли ——— */}
          <section className={css.block}>
            <div className={css.head} data-reveal>
              <h2>Экономика страны — на бирже</h2>
              <Link href="/listing">Компании в листинге →</Link>
            </div>
            <div className={css.sectors} data-stagger>
              {sectors.map((s) => (
                <Link key={s.title} href="/listing" className={css.sector}>
                  <Image src={s.photo} alt="" fill sizes="(max-width: 700px) 50vw, 16vw" />
                  <span>{s.title}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* ——— Журнал ——— */}
          {lead ? (
            <section className={`${css.block} ${css.mag}`}>
              <Link href={`/news/${lead.slug}`} className={css.magLead} data-reveal>
                <span className={css.magPhoto}>
                  <Image src={lead.photo} alt="" fill sizes="(max-width: 1100px) 100vw, 55vw" />
                </span>
                <small>
                  {longDate(lead.date)} · {lead.tag}
                </small>
                <b>{lead.title}</b>
                <span>{lead.excerpt}</span>
              </Link>
              <div className={css.magSide} data-reveal style={{ "--kc-d": "120ms" } as CSSProperties}>
                <h2>Новости</h2>
                <ul>
                  {[...rest, ...data.companyNews].slice(0, 4).map((item) => (
                    <li key={item.slug}>
                      <Link href={`/news/${item.slug}`}>
                        <small>{longDate(item.date)}</small>
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href={EDU_URL} className={css.edu} {...linkProps(EDU_URL)}>
                  <small>Учебный центр</small>
                  <b>Курсы для начинающих инвесторов →</b>
                </Link>
              </div>
            </section>
          ) : null}
        </main>

        <footer className={css.footer}>
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
            </nav>
            <small>
              {data.contacts.copyright}
              {data.contacts.license ? ` · Лицензия ${data.contacts.license}` : ""}
            </small>
          </div>
        </footer>

        <ConceptSwitch current="polden" />
      </div>
    </ConceptPage>
  );
}
