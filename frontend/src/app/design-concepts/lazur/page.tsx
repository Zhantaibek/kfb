import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import css from "./lazur.module.css";

/*
 * Концепция 59 — «Лазурь». Светлый дружелюбный стиль: небесный градиент, пастельные карточки
 * (мята, персик, сирень), фото в мягких «каплях», крупная типографика (базовый кегль 24px).
 * Шрифты сайта, данные — loadHomeData().
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "59 · Лазурь" };

const nav = [
  { label: "Рынок", href: "/market" },
  { label: "Котировки", href: "/market/quotes" },
  { label: "ГЦБ", href: "/gcb" },
  { label: "Эмитентам", href: "/listing" },
  { label: "Новости", href: "/news" },
];

const doors = [
  { title: "Инвесторам", text: "Как выбрать брокера и купить первую бумагу", href: "/investors", tone: "mint", photo: "/hub/hub-members.jpg" },
  { title: "Эмитентам", text: "Листинг, выпуск акций и облигаций", href: "/listing", tone: "peach", photo: "/hero/issuer-signing.jpg" },
  { title: "Участникам", text: "Правила торгов, документы, статистика", href: "/members", tone: "lilac", photo: "/hub/hub-market.jpg" },
  { title: "Учиться", text: "Курсы учебного центра биржи", href: EDU_URL, tone: "sun", photo: "/hub/hub-education.jpg" },
] as const;

function Delta({ value }: { value: number }) {
  return (
    <span className={css.delta} data-dir={value > 0 ? "up" : value < 0 ? "down" : undefined}>
      {pct(value)}
    </span>
  );
}

export default async function LazurConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const sessionDate = data.session.date ? longDate(data.session.date) : "последней сессии";
  const phones = data.contacts.phones.length ? data.contacts.phones : ["+996 312 31 14 84"];
  const address = data.contacts.address || "г. Бишкек, ул. Московская, 172";
  const email = data.contacts.email || "office@kse.kg";
  const tags = priced.slice(0, 8);
  const maxVol = Math.max(1, ...priced.slice(0, 6).map((i) => i.volume));

  return (
    <ConceptPage accent="#2563eb">
      <div className={css.page}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <div className={css.wrap}>
            <Link href="/design-concepts/lazur" className={css.logo} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={46} height={43} priority />
              <span>
                Фондовая
                <br />
                биржа
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
              Открыть счёт
            </Link>
          </div>
        </header>

        <main id="main">
          {/* ——— Первый экран ——— */}
          <section className={`${css.wrap} ${css.hero}`}>
            <div className={css.heroText}>
              <p className={css.tag} data-intro="fade">
                Торги {sessionDate}
              </p>
              <h1 data-intro="rise">
                Инвестируйте
                <br />
                в <em>свою</em> страну
              </h1>
              <p className={css.lead} data-intro="rise" style={{ "--kc-d": "150ms" } as CSSProperties}>
                Акции аэропортов, банков и энергетики, облигации и государственные бумаги — на бирже Кыргызстана.
              </p>
              <div className={css.ctas} data-intro="rise" style={{ "--kc-d": "300ms" } as CSSProperties}>
                <Link href="/members" className={css.btn}>
                  С чего начать
                </Link>
                <Link href="/market/quotes" className={css.btnLine}>
                  Все котировки
                </Link>
              </div>
              <div className={css.tags} data-stagger>
                {tags.map((item) => (
                  <Link key={item.ticker} href={item.href} title={item.name}>
                    <b>{item.ticker}</b> {num(item.price, 2)} <Delta value={item.change} />
                  </Link>
                ))}
              </div>
            </div>
            <div className={css.heroArt} data-intro="zoom" style={{ "--kc-d": "200ms" } as CSSProperties}>
              <span className={`${css.blob} ${css.blobA}`}>
                <Image src="/hero/bishkek-ala-too.jpg" alt="Бишкек и горы Ала-Тоо" fill priority sizes="(max-width: 1000px) 100vw, 45vw" />
              </span>
              <span className={`${css.blob} ${css.blobB}`}>
                <Image src="/carousel/gold.jpg" alt="" fill sizes="300px" />
              </span>
              <Link href="/market/index" className={css.indexBubble}>
                <small>Индекс KSE</small>
                <b>{num(data.index.value, 2)}</b>
                <Delta value={data.index.change} />
              </Link>
              <span className={css.volBubble}>
                <small>Объём сессии</small>
                <b>{num(data.volume.volumeMln, 1)} млн</b>
              </span>
            </div>
          </section>

          {/* ——— Четыре двери ——— */}
          <section className={`${css.wrap} ${css.block}`}>
            <h2 data-reveal>Кому и зачем</h2>
            <div className={css.doors} data-stagger>
              {doors.map((d) => (
                <Link key={d.title} href={d.href} className={css.door} data-tone={d.tone} {...linkProps(d.href)}>
                  <span className={css.doorPhoto}>
                    <Image src={d.photo} alt="" fill sizes="(max-width: 900px) 100vw, 25vw" />
                  </span>
                  <b>{d.title}</b>
                  <span>{d.text}</span>
                  <i aria-hidden="true">→</i>
                </Link>
              ))}
            </div>
          </section>

          {/* ——— Рынок ——— */}
          <section className={css.market}>
            <div className={`${css.wrap} ${css.marketGrid}`}>
              <div className={css.marketText} data-reveal>
                <h2>Рынок сегодня</h2>
                <p>
                  {num(data.volume.trades)} сделок на {num(data.volume.volumeMln, 1)} млн сом. {data.quotes.total} бумаг в котировках, {data.issuers} эмитентов.
                </p>
                <dl className={css.facts}>
                  <div>
                    <dt>Капитализация</dt>
                    <dd>{num(data.index.capitalization, 1)} млн сом</dd>
                  </div>
                  <div>
                    <dt>Сессия</dt>
                    <dd>{data.session.hours}</dd>
                  </div>
                  <div>
                    <dt>В листинге</dt>
                    <dd>{data.listed} компаний</dd>
                  </div>
                </dl>
                <Link href="/market" className={css.btnLine}>
                  Итоги торгов →
                </Link>
              </div>
              <div className={css.marketCard} data-reveal style={{ "--kc-d": "120ms" } as CSSProperties}>
                <span className={css.cardHead}>Самые активные бумаги</span>
                <ol className={css.volList}>
                  {priced.slice(0, 6).map((item) => (
                    <li key={item.ticker}>
                      <Link href={item.href}>
                        <b>{item.ticker}</b>
                        <small>{item.name}</small>
                        <span className={css.bar}>
                          <i style={{ "--w": `${Math.max(3, (item.volume / maxVol) * 100)}%` } as CSSProperties} />
                        </span>
                        <em>{num(item.price, 2)} сом</em>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
              <div className={css.gcbCard} data-reveal style={{ "--kc-d": "240ms" } as CSSProperties}>
                <span className={css.cardHead}>Аукционы ГЦБ</span>
                {data.auctions.length ? (
                  <ul>
                    {data.auctions.slice(0, 3).map((a) => (
                      <li key={`${a.date}-${a.type}`}>
                        <b>{longDate(a.date)}</b>
                        <span>
                          {a.type} · {a.volume}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Календарь аукционов Минфина — на странице ГЦБ.</p>
                )}
                <Link href="/gcb" className={css.btnSmall}>
                  Календарь
                </Link>
              </div>
            </div>
          </section>

          {/* ——— Новости ——— */}
          {data.news.length ? (
            <section className={`${css.wrap} ${css.block}`}>
              <div className={css.rowHead} data-reveal>
                <h2>Что нового</h2>
                <Link href="/news">Все новости →</Link>
              </div>
              <div className={css.news} data-stagger>
                {data.news.slice(0, 3).map((item, i) => (
                  <Link key={item.slug} href={`/news/${item.slug}`} className={css.newsCard} data-tone={["mint", "peach", "lilac"][i % 3]}>
                    <span className={css.newsPhoto}>
                      <Image src={item.photo} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" />
                    </span>
                    <small>
                      {longDate(item.date)} · {item.tag}
                    </small>
                    <b>{item.title}</b>
                    <span>{item.excerpt}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* ——— Призыв ——— */}
          <section className={css.wrap}>
            <div className={css.cta} data-reveal="zoom">
              <div>
                <h2>Первая сделка — через брокера</h2>
                <p>Участники торгов откроют счёт и помогут с заявкой. Биржа — там, где проходит сделка.</p>
              </div>
              <Link href="/members" className={css.btn}>
                Список брокеров
              </Link>
            </div>
          </section>
        </main>

        <footer className={css.footer}>
          <div className={css.wrap}>
            <div>
              <b>Кыргызская фондовая биржа</b>
              <span>{address}</span>
              {data.contacts.license ? <span>Лицензия {data.contacts.license}</span> : null}
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
            <small>{data.contacts.copyright}</small>
          </div>
        </footer>

        <ConceptSwitch current="lazur" />
      </div>
    </ConceptPage>
  );
}
