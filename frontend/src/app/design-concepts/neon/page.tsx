import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import css from "./neon.module.css";

/*
 * Концепция 58 — «Неон». Потребительский финтех: почти чёрный фон, свечения фиолетового и бирюзового,
 * стеклянные карточки с размытием, крупная типографика (базовый кегль 24px). Шрифты сайта, данные — loadHomeData().
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "58 · Неон" };

const nav = [
  { label: "Рынок", href: "/market" },
  { label: "Котировки", href: "/market/quotes" },
  { label: "ГЦБ", href: "/gcb" },
  { label: "Листинг", href: "/listing" },
  { label: "Новости", href: "/news" },
];

const products = [
  { key: "stocks", title: "Акции", text: "Доли в компаниях Кыргызстана: аэропорты, банки, энергетика.", href: "/market/quotes", tone: "violet" },
  { key: "bonds", title: "Облигации", text: "Фиксированный доход от корпоративных выпусков.", href: "/market/quotes", tone: "cyan" },
  { key: "gcb", title: "ГЦБ", text: "Казначейские векселя и облигации Минфина на аукционах.", href: "/gcb", tone: "lime" },
  { key: "metals", title: "Металлы", text: "Золото и серебро в биржевом обращении.", href: "/market/quotes", tone: "amber" },
] as const;

function Delta({ value }: { value: number }) {
  return (
    <span className={css.delta} data-dir={value > 0 ? "up" : value < 0 ? "down" : undefined}>
      {pct(value)}
    </span>
  );
}

export default async function NeonConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const chart = smoothPath(
    data.indexSeries.map((row) => row.value),
    520,
    200,
    12,
  );
  const sessionDate = data.session.date ? longDate(data.session.date) : "последней сессии";
  const phones = data.contacts.phones.length ? data.contacts.phones : ["+996 312 31 14 84"];
  const address = data.contacts.address || "г. Бишкек, ул. Московская, 172";
  const email = data.contacts.email || "office@kse.kg";
  const groups = {
    stocks: data.quotes.stocks.filter((r) => r.price > 0),
    bonds: data.quotes.bonds.filter((r) => r.price > 0),
    gcb: [] as typeof priced,
    metals: data.quotes.metals.filter((r) => r.price > 0),
  };
  const auctionVolume = data.auctions.reduce((sum, a) => sum + (parseFloat(a.volume.replace(/[^\d.,]/g, "").replace(",", ".")) || 0), 0);

  return (
    <ConceptPage accent="#8b5cf6">
      <div className={css.page}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>
        <span className={`${css.glow} ${css.glowA}`} aria-hidden="true" />
        <span className={`${css.glow} ${css.glowB}`} aria-hidden="true" />

        <header className={css.header}>
          <div className={css.wrap}>
            <Link href="/design-concepts/neon" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={44} height={41} priority />
              <span>KSE</span>
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

        <main id="main" className={css.wrap}>
          {/* ——— Первый экран ——— */}
          <section className={css.hero}>
            <div className={css.heroText}>
              <p className={css.pill} data-intro="fade">
                <i aria-hidden="true" data-open={data.session.open ? "" : undefined} />
                {data.session.label} · торги {sessionDate}
              </p>
              <h1 data-intro="rise">
                Ваш капитал
                <br />
                <span>растёт здесь</span>
              </h1>
              <p className={css.lead} data-intro="rise" style={{ "--kc-d": "150ms" } as CSSProperties}>
                Биржа Кыргызстана: {data.quotes.total} бумаг, {data.issuers} эмитентов и открытые котировки каждой сессии.
              </p>
              <div className={css.ctas} data-intro="rise" style={{ "--kc-d": "300ms" } as CSSProperties}>
                <Link href="/members" className={css.btn}>
                  Открыть счёт у брокера
                </Link>
                <Link href="/market" className={css.btnGhost}>
                  Смотреть рынок →
                </Link>
              </div>
              <ul className={css.stats} data-stagger>
                <li>
                  <b>{num(data.volume.volumeMln, 1)}</b>
                  <span>млн сом за сессию</span>
                </li>
                <li>
                  <b>{num(data.volume.trades)}</b>
                  <span>сделок</span>
                </li>
                <li>
                  <b>{data.listed}</b>
                  <span>компаний в листинге</span>
                </li>
              </ul>
            </div>

            <div className={css.heroCards} data-intro="zoom" style={{ "--kc-d": "200ms" } as CSSProperties}>
              <Link href="/market/index" className={`${css.glass} ${css.indexCard}`}>
                <span className={css.cardHead}>
                  <span>Индекс KSE</span>
                  <Delta value={data.index.change} />
                </span>
                <b>{num(data.index.value, 2)}</b>
                {chart ? (
                  <svg viewBox="0 0 520 200" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="neon-line" x1="0" x2="1">
                        <stop offset="0" stopColor="#8b5cf6" />
                        <stop offset="1" stopColor="#22d3ee" />
                      </linearGradient>
                      <linearGradient id="neon-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0" stopColor="#22d3ee" stopOpacity="0.35" />
                        <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={chart.area} fill="url(#neon-fill)" />
                    <path d={chart.line} pathLength={1} className={css.line} stroke="url(#neon-line)" />
                  </svg>
                ) : null}
                <small>Капитализация {num(data.index.capitalization, 1)} млн сом</small>
              </Link>
              <div className={`${css.glass} ${css.topCard}`}>
                <span className={css.cardHead}>
                  <span>Самые активные</span>
                  <Link href="/market/quotes">Все</Link>
                </span>
                <ul>
                  {priced.slice(0, 5).map((item) => (
                    <li key={item.ticker}>
                      <Link href={item.href} title={item.name}>
                        <b>{item.ticker}</b>
                        <span>{num(item.price, 2)}</span>
                        <Delta value={item.change} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ——— Продукты ——— */}
          <section className={css.section}>
            <h2 data-reveal>Четыре рынка — один счёт</h2>
            <div className={css.products} data-stagger>
              {products.map((p) => {
                const rows = groups[p.key].slice(0, 3);
                return (
                  <Link key={p.key} href={p.href} className={`${css.glass} ${css.product}`} data-tone={p.tone}>
                    <span className={css.productGlow} aria-hidden="true" />
                    <b>{p.title}</b>
                    <p>{p.text}</p>
                    {rows.length ? (
                      <ul>
                        {rows.map((r) => (
                          <li key={r.ticker}>
                            <span>{r.ticker}</span>
                            <em>{num(r.price, 2)}</em>
                          </li>
                        ))}
                      </ul>
                    ) : p.key === "gcb" ? (
                      <ul>
                        {data.auctions.slice(0, 3).map((a) => (
                          <li key={`${a.date}-${a.type}`}>
                            <span>{a.date.slice(0, 5)}</span>
                            <em>{a.volume}</em>
                          </li>
                        ))}
                        {!data.auctions.length ? <li className={css.dim}>Календарь на странице ГЦБ</li> : null}
                      </ul>
                    ) : (
                      <ul>
                        <li className={css.dim}>Сделок в сессии не было</li>
                      </ul>
                    )}
                    <span className={css.more}>Подробнее →</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ——— Цифры ——— */}
          <section className={`${css.section} ${css.numbers}`} data-reveal>
            <div>
              <b className={css.gradText}>{num(data.index.value, 0)}</b>
              <span>пунктов — индекс KSE</span>
            </div>
            <div>
              <b className={css.gradText}>{data.issuers}</b>
              <span>эмитентов на бирже</span>
            </div>
            <div>
              <b className={css.gradText}>{auctionVolume ? num(auctionVolume, 0) : data.quotes.total}</b>
              <span>{auctionVolume ? "млн сом — ближайшие аукционы ГЦБ" : "бумаг в котировках"}</span>
            </div>
          </section>

          {/* ——— Как начать ——— */}
          <section className={css.section}>
            <div className={css.howRow}>
              <div className={css.howText} data-reveal>
                <h2>Три шага до первой бумаги</h2>
                <p>Биржа не открывает счета напрямую: сделки заключают брокеры — участники торгов с лицензией.</p>
                <Link href={EDU_URL} className={css.btnGhost} {...linkProps(EDU_URL)}>
                  Пройти курс в учебном центре →
                </Link>
              </div>
              <ol className={css.steps} data-stagger>
                <li className={css.glass}>
                  <b>1</b>
                  <span>Выберите брокера</span>
                  <small>Список участников торгов — на сайте биржи</small>
                </li>
                <li className={css.glass}>
                  <b>2</b>
                  <span>Откройте счёт</span>
                  <small>По паспорту, онлайн или в офисе брокера</small>
                </li>
                <li className={css.glass}>
                  <b>3</b>
                  <span>Купите бумагу</span>
                  <small>Заявка уходит на биржу, бумага — на ваш счёт депо</small>
                </li>
              </ol>
            </div>
          </section>

          {/* ——— Новости ——— */}
          {data.news.length ? (
            <section className={css.section}>
              <div className={css.rowHead} data-reveal>
                <h2>Новости</h2>
                <Link href="/news">Все новости →</Link>
              </div>
              <div className={css.news} data-stagger>
                {data.news.slice(0, 3).map((item) => (
                  <Link key={item.slug} href={`/news/${item.slug}`} className={`${css.glass} ${css.newsCard}`}>
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

          {/* ——— Призыв ——— */}
          <section className={css.cta} data-reveal="zoom">
            <h2>Готовы к первой сделке?</h2>
            <p>Участники торгов помогут открыть счёт и подать заявку.</p>
            <Link href="/members" className={css.btnLight}>
              Выбрать брокера
            </Link>
          </section>
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
              <Link href="/disclosure">Раскрытие</Link>
            </nav>
            <small>{data.contacts.copyright}</small>
          </div>
        </footer>

        <ConceptSwitch current="neon" />
      </div>
    </ConceptPage>
  );
}
