import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import css from "./split.module.css";

/*
 * Концепция 63 — «Сплит». Экран поделён надвое: слева закреплённая тёмная колонка (логотип, индекс, сессия, меню),
 * справа прокручивается светлое содержимое. Палитра — чёрно-синий, белый и коралл. Базовый кегль 24px.
 * Шрифты сайта, данные — loadHomeData().
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "63 · Сплит" };

const nav = [
  { label: "Котировки", href: "#quotes" },
  { label: "Аукционы ГЦБ", href: "#gcb" },
  { label: "Направления", href: "#paths" },
  { label: "Новости", href: "#news" },
  { label: "Контакты", href: "#contacts" },
];

function Delta({ value }: { value: number }) {
  return (
    <span className={css.delta} data-dir={value > 0 ? "up" : value < 0 ? "down" : undefined}>
      {pct(value)}
    </span>
  );
}

export default async function SplitConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const chart = smoothPath(
    data.indexSeries.map((row) => row.value),
    400,
    140,
    8,
  );
  const sessionDate = data.session.date ? longDate(data.session.date) : "последней сессии";
  const phones = data.contacts.phones.length ? data.contacts.phones : ["+996 312 31 14 84", "+996 551 31 14 84"];
  const address = data.contacts.address || "г. Бишкек, ул. Московская, 172";
  const email = data.contacts.email || "office@kse.kg";
  const maxVol = Math.max(1, ...priced.slice(0, 8).map((i) => i.volume));

  return (
    <ConceptPage accent="#ff6b4a">
      <div className={css.page}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        {/* ——— Левая закреплённая колонка ——— */}
        <aside className={css.side}>
          <Link href="/design-concepts/split" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={50} height={47} priority />
            <span>
              Кыргызская
              <br />
              фондовая биржа
            </span>
          </Link>

          <Link href="/market/index" className={css.index} data-intro="fade">
            <small>Индекс KSE</small>
            <b>{num(data.index.value, 2)}</b>
            <Delta value={data.index.change} />
            {chart ? (
              <svg viewBox="0 0 400 140" preserveAspectRatio="none" aria-hidden="true">
                <path d={chart.area} className={css.area} />
                <path d={chart.line} pathLength={1} className={css.line} />
              </svg>
            ) : null}
          </Link>

          <dl className={css.session}>
            <div>
              <dt>Сессия</dt>
              <dd className={css.live} data-open={data.session.open ? "" : undefined}>
                <i aria-hidden="true" /> {data.session.label}
              </dd>
            </div>
            <div>
              <dt>Торги</dt>
              <dd>{sessionDate}</dd>
            </div>
            <div>
              <dt>Объём</dt>
              <dd>{num(data.volume.volumeMln, 1)} млн сом</dd>
            </div>
            <div>
              <dt>Сделок</dt>
              <dd>{num(data.volume.trades)}</dd>
            </div>
          </dl>

          <nav aria-label="Разделы страницы" className={css.nav}>
            {nav.map((item, i) => (
              <a key={item.href} href={item.href}>
                <small>0{i + 1}</small>
                {item.label}
              </a>
            ))}
          </nav>

          <Link href="/members" className={css.btn}>
            Начать инвестировать
          </Link>
        </aside>

        {/* ——— Правая прокручиваемая часть ——— */}
        <main id="main" className={css.main}>
          <section className={css.hero}>
            <div className={css.heroPhoto} data-intro="fade">
              <Image src="/hero/kse-entrance-garden.jpg" alt="Вход в здание Кыргызской фондовой биржи" fill priority sizes="(max-width: 1100px) 100vw, 66vw" />
            </div>
            <div className={css.heroText}>
              <h1 data-intro="rise">
                Биржа,
                <br />
                где видно <em>всё</em>
              </h1>
              <p data-intro="rise" style={{ "--kc-d": "150ms" } as CSSProperties}>
                Цены каждой бумаги, аукционы Минфина и отчётность {data.issuers} эмитентов — в открытом доступе.
              </p>
              <div className={css.heroNums} data-intro="rise" style={{ "--kc-d": "300ms" } as CSSProperties}>
                <div>
                  <b>{data.quotes.total}</b>
                  <span>бумаг в котировках</span>
                </div>
                <div>
                  <b>{data.listed}</b>
                  <span>компаний в листинге</span>
                </div>
                <div>
                  <b>{num(data.index.capitalization, 0)}</b>
                  <span>млн сом капитализация</span>
                </div>
              </div>
            </div>
          </section>

          <section id="quotes" className={css.section}>
            <div className={css.head} data-reveal>
              <h2>Котировки</h2>
              <Link href="/market/quotes">Все бумаги →</Link>
            </div>
            <ol className={css.quotes} data-stagger>
              {priced.slice(0, 8).map((item) => (
                <li key={item.ticker}>
                  <Link href={item.href}>
                    <b>{item.ticker}</b>
                    <span className={css.qName}>{item.name}</span>
                    <span className={css.qBar}>
                      <i style={{ "--w": `${Math.max(2, (item.volume / maxVol) * 100)}%` } as CSSProperties} />
                    </span>
                    <em>{num(item.price, 2)}</em>
                    <Delta value={item.change} />
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section id="gcb" className={css.section}>
            <div className={css.head} data-reveal>
              <h2>Аукционы ГЦБ</h2>
              <Link href="/gcb">Календарь →</Link>
            </div>
            <div className={css.gcbGrid} data-stagger>
              {data.auctions.length ? (
                data.auctions.slice(0, 4).map((a) => (
                  <div key={`${a.date}-${a.type}`} className={css.auction}>
                    <b>{a.date.slice(0, 5)}</b>
                    <span>{a.type}</span>
                    <em>{a.volume}</em>
                    <small>{a.status}</small>
                  </div>
                ))
              ) : (
                <p className={css.muted}>Расписание аукционов Минфина — на странице ГЦБ.</p>
              )}
              {data.leaders.length ? (
                <div className={`${css.auction} ${css.leaders}`}>
                  <small>Лидеры недели по объёму</small>
                  {data.leaders.slice(0, 3).map((r) => (
                    <span key={r.ticker}>
                      <b>{r.ticker}</b> {num(r.volume)} сом
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <section id="paths" className={css.section}>
            <div className={css.head} data-reveal>
              <h2>Направления</h2>
            </div>
            <div className={css.paths} data-stagger>
              <Link href="/investors" className={css.path}>
                <span className={css.pathPhoto}>
                  <Image src="/hub/hub-members.jpg" alt="" fill sizes="(max-width: 1100px) 100vw, 33vw" />
                </span>
                <b>Инвесторам</b>
                <span>Брокер, счёт и первая бумага — по шагам</span>
              </Link>
              <Link href="/listing" className={css.path}>
                <span className={css.pathPhoto}>
                  <Image src="/hero/issuer-signing.jpg" alt="" fill sizes="(max-width: 1100px) 100vw, 33vw" />
                </span>
                <b>Эмитентам</b>
                <span>Листинг, выпуск акций и облигаций</span>
              </Link>
              <Link href={EDU_URL} className={css.path} {...linkProps(EDU_URL)}>
                <span className={css.pathPhoto}>
                  <Image src="/hub/hub-education.jpg" alt="" fill sizes="(max-width: 1100px) 100vw, 33vw" />
                </span>
                <b>Учебный центр</b>
                <span>Курсы для инвесторов и специалистов</span>
              </Link>
            </div>
          </section>

          {data.news.length ? (
            <section id="news" className={css.section}>
              <div className={css.head} data-reveal>
                <h2>Новости</h2>
                <Link href="/news">Все новости →</Link>
              </div>
              <div className={css.news} data-stagger>
                {[...data.news, ...data.companyNews].slice(0, 4).map((item) => (
                  <Link key={item.slug} href={`/news/${item.slug}`} className={css.newsItem}>
                    <span className={css.newsPhoto}>
                      <Image src={item.photo} alt="" fill sizes="240px" />
                    </span>
                    <span>
                      <small>
                        {longDate(item.date)} · {item.tag}
                      </small>
                      <b>{item.title}</b>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section id="contacts" className={`${css.section} ${css.contacts}`}>
            <h2 data-reveal>Свяжитесь с биржей</h2>
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
            </div>
            <p className={css.legal}>
              {data.contacts.copyright}
              {data.contacts.license ? ` · Лицензия ${data.contacts.license}` : ""}
            </p>
          </section>
        </main>

        <ConceptSwitch current="split" />
      </div>
    </ConceptPage>
  );
}
