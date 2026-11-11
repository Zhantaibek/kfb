import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Inter } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, nav, num, pct, services, steps } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import { Icon, type IconName } from "../_shared/Icon";
import { pickNewsPhotos } from "../_shared/news-photos";
import css from "./sovremennyi.module.css";

/*
 * Концепция 43 — «Современный»: самый обычный современный сайт биржи, без особых приёмов. Привычная структура:
 * шапка, первый экран с фото, партнёры, услуги, рынок сегодня, шаги, аукцион ГЦБ, новости, призыв и подвал.
 * Белый фон, фирменная бирюза, Inter, скругления 12–20px.
 */
const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--sm-font" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "43 · Современный" };

const serviceIcons: IconName[] = ["chart", "building", "bank", "coin", "file", "book"];

export default async function SovremennyiConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0).slice(0, 6);
  const chart = smoothPath(data.history, 520, 160, 10);
  const auction = data.auctions[0];
  const news = data.news.slice(0, 3);
  const photos = pickNewsPhotos(news);

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${inter.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        {/* Шапка. */}
        <header className={css.header}>
          <div className={css.headInner}>
            <Link href="/design-concepts/sovremennyi" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={34} height={32} priority />
              <span>
                <b>Кыргызская фондовая биржа</b>
                <small>Kyrgyz Stock Exchange</small>
              </span>
            </Link>
            <nav className={css.nav} aria-label="Основное меню">
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className={css.headActions}>
              <Link href="/contacts" className={css.btnGhost}>
                Контакты
              </Link>
              <Link href="/members" className={css.btn}>
                Начать инвестировать
              </Link>
            </div>
          </div>
        </header>

        <main id="main">
          {/* 1. Первый экран. */}
          <section className={css.hero} aria-labelledby="sm-hero">
            <div className={css.heroText}>
              <p className={css.badge} data-intro="fade">
                <i data-open={data.session.open || undefined} aria-hidden="true" />
                {data.session.label} · торги по будням {data.session.hours}
              </p>
              <h1 id="sm-hero" data-intro="rise" style={{ "--kc-d": "80ms" } as CSSProperties}>
                Фондовый рынок Кыргызстана
              </h1>
              <p className={css.lead} data-intro="rise" style={{ "--kc-d": "140ms" } as CSSProperties}>
                Торги акциями, облигациями и государственными ценными бумагами. Котировки, отчётность компаний и аукционы ГЦБ — на одном сайте.
              </p>
              <div className={css.heroActions} data-intro="rise" style={{ "--kc-d": "200ms" } as CSSProperties}>
                <Link href="/members" className={css.btnLg}>
                  Начать инвестировать
                </Link>
                <Link href="/market/quotes" className={css.btnGhostLg}>
                  Котировки
                </Link>
              </div>
              <dl className={css.heroStats} data-intro="rise" style={{ "--kc-d": "260ms" } as CSSProperties}>
                <div>
                  <dt>{num(data.issuers)}</dt>
                  <dd>эмитентов</dd>
                </div>
                <div>
                  <dt>{num(data.quotes.total)}</dt>
                  <dd>бумаг на торгах</dd>
                </div>
                <div>
                  <dt>1994</dt>
                  <dd>год основания</dd>
                </div>
              </dl>
            </div>
            <div className={css.heroMedia} data-intro="fade" style={{ "--kc-d": "120ms" } as CSSProperties}>
              <Image src="/hero/kse-entrance-garden.jpg" alt="Здание Кыргызской фондовой биржи" fill priority sizes="(max-width: 960px) 100vw, 50vw" />
              <Link href="/market/index" className={css.heroCard}>
                <small>Индекс KSE</small>
                <b>{num(data.index.value, 2)}</b>
                <span className={data.index.change >= 0 ? css.up : css.down}>{pct(data.index.change)} за сессию</span>
              </Link>
            </div>
          </section>

          {/* 2. Партнёры. */}
          {data.partners.length ? (
            <section className={css.partners} aria-label="Партнёры">
              <p>Партнёры биржи</p>
              <ul>
                {data.partners.slice(0, 8).map((p) => (
                  <li key={p.slug}>
                    <Link href={`/about/partners/${p.slug}`} title={p.name}>
                      {p.logo ? <Image src={p.logo} alt={p.mark} width={130} height={44} unoptimized /> : <b>{p.mark}</b>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* 3. Услуги. */}
          <section className={css.section} aria-labelledby="sm-services">
            <div className={css.sectionHead}>
              <p className={css.eyebrow}>Услуги</p>
              <h2 id="sm-services">Что делает биржа</h2>
              <p>Организуем торги, помогаем компаниям привлекать капитал и обеспечиваем прозрачность рынка.</p>
            </div>
            <ul className={css.services} data-stagger>
              {services.map((item, i) => (
                <li key={item.title}>
                  <Link href={item.href} {...linkProps(item.href)}>
                    <span className={css.serviceIcon}>
                      <Icon name={serviceIcons[i] ?? "arrowRight"} />
                    </span>
                    <b>{item.title}</b>
                    <span>{item.text}</span>
                    <em>Подробнее →</em>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 4. Рынок сегодня. */}
          <section className={`${css.section} ${css.grey}`} aria-labelledby="sm-market">
            <div className={css.inner}>
              <div className={css.sectionHeadRow}>
                <div>
                  <p className={css.eyebrow}>Рынок</p>
                  <h2 id="sm-market">Рынок сегодня</h2>
                </div>
                <Link href="/market" className={css.btnGhost}>
                  Итоги торгов
                </Link>
              </div>
              <div className={css.market}>
                <Link href="/market/index" className={css.indexCard}>
                  <span className={css.cardHead}>
                    <small>Индекс KSE · {longDate(data.session.date)}</small>
                    <span className={data.index.change >= 0 ? css.pillUp : css.pillDown}>{pct(data.index.change)}</span>
                  </span>
                  <b>{num(data.index.value, 2)}</b>
                  {chart ? (
                    <svg viewBox="0 0 520 160" preserveAspectRatio="none" aria-hidden="true" data-draw>
                      <defs>
                        <linearGradient id="sm-area" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#57b6c0" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#57b6c0" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={chart.area} fill="url(#sm-area)" />
                      <path d={chart.line} className={css.line} />
                    </svg>
                  ) : null}
                  <span className={css.indexFoot}>
                    <span>
                      Объём <b>{num(data.volume.volumeMln, 1)} млн сом</b>
                    </span>
                    <span>
                      Сделок <b>{num(data.volume.trades)}</b>
                    </span>
                    <span>
                      Капитализация <b>{num(data.index.capitalization, 1)} млрд</b>
                    </span>
                  </span>
                </Link>
                <div className={css.quotesCard}>
                  <div className={css.cardHead}>
                    <b>Котировки</b>
                    <Link href="/market/quotes">Все →</Link>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Бумага</th>
                        <th scope="col">Цена, сом</th>
                        <th scope="col">Изм.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priced.map((item) => (
                        <tr key={item.ticker}>
                          <th scope="row">
                            <Link href={item.href}>
                              {item.ticker}
                              <small>{item.name}</small>
                            </Link>
                          </th>
                          <td>{num(item.price, 2)}</td>
                          <td className={item.change > 0 ? css.up : item.change < 0 ? css.down : css.flat}>{item.change ? pct(item.change) : "0,00%"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Как начать. */}
          <section className={css.section} aria-labelledby="sm-steps">
            <div className={css.sectionHead}>
              <p className={css.eyebrow}>Инвесторам</p>
              <h2 id="sm-steps">Как начать инвестировать</h2>
              <p>Четыре простых шага до первой сделки на бирже.</p>
            </div>
            <ol className={css.steps} data-stagger>
              {steps.map((step, i) => (
                <li key={step.title}>
                  <Link href={step.href} {...linkProps(step.href)}>
                    <span className={css.stepNum}>{i + 1}</span>
                    <b>{step.title}</b>
                    <span>{step.text}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          {/* 6. Аукцион ГЦБ. */}
          {auction ? (
            <section className={css.banner} aria-labelledby="sm-gcb">
              <div className={css.bannerText}>
                <p className={css.eyebrowLight}>Государственные ценные бумаги</p>
                <h2 id="sm-gcb">Ближайший аукцион ГЦБ — {longDate(auction.date)}</h2>
                <p>
                  Выпуск {auction.type}, объём {auction.volume}. Статус: {auction.status.toLowerCase()}.
                </p>
              </div>
              <Link href="/gcb" className={css.btnLight}>
                Календарь аукционов
              </Link>
            </section>
          ) : null}

          {/* 7. Новости. */}
          <section className={css.section} aria-labelledby="sm-news">
            <div className={css.sectionHeadRow}>
              <div>
                <p className={css.eyebrow}>Пресс-центр</p>
                <h2 id="sm-news">Последние новости</h2>
              </div>
              <Link href="/news" className={css.btnGhost}>
                Все новости
              </Link>
            </div>
            <ul className={css.news} data-stagger>
              {news.map((item, i) => (
                <li key={item.slug}>
                  <Link href={`/news/${item.slug}`}>
                    <span className={css.newsPhoto}>
                      <Image src={photos[i]} alt="" fill sizes="(max-width: 720px) 100vw, 380px" />
                    </span>
                    <span className={css.newsBody}>
                      <small>
                        {item.tag} · {longDate(item.date)}
                      </small>
                      <b>{item.title}</b>
                      <span>{item.excerpt}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 8. Призыв. */}
          <section className={css.cta} aria-labelledby="sm-cta">
            <h2 id="sm-cta">Готовы начать инвестировать?</h2>
            <p>Выберите брокера — участника торгов — и откройте счёт. Учебный центр поможет разобраться в основах.</p>
            <div className={css.heroActions}>
              <Link href="/members" className={css.btnLight}>
                Выбрать брокера
              </Link>
              <Link href={EDU_URL} className={css.btnOutlineLight} {...linkProps(EDU_URL)}>
                Учебный центр
              </Link>
            </div>
          </section>
        </main>

        <footer className={css.footer}>
          <div className={css.footGrid}>
            <div className={css.footBrand}>
              <span className={css.footLogo}>
                <Image src="/brand/kse-mark.png" alt="" width={30} height={28} />
                <b>Кыргызская фондовая биржа</b>
              </span>
              <p>{data.contacts.address}</p>
              <p>{data.contacts.phones.join(", ")}</p>
              {data.contacts.email ? <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a> : null}
            </div>
            <nav aria-label="Рынок">
              <b>Рынок</b>
              <Link href="/market">Итоги торгов</Link>
              <Link href="/market/quotes">Котировки</Link>
              <Link href="/market/index">Индекс KSE</Link>
              <Link href="/gcb">ГЦБ</Link>
            </nav>
            <nav aria-label="Эмитентам">
              <b>Эмитентам</b>
              <Link href="/listing">Листинг</Link>
              <Link href="/disclosure">Раскрытие информации</Link>
              <Link href="/documents">Документы</Link>
            </nav>
            <nav aria-label="О бирже">
              <b>О бирже</b>
              <Link href="/about">О компании</Link>
              <Link href="/news">Новости</Link>
              <Link href="/members">Участники торгов</Link>
              <Link href="/contacts">Контакты</Link>
            </nav>
          </div>
          <p className={css.legal}>
            {data.contacts.copyright}. {data.contacts.license ? `Лицензия ${data.contacts.license}. ` : ""}Информация на сайте не является инвестиционной рекомендацией.
          </p>
        </footer>
        <ConceptSwitch current="sovremennyi" />
      </div>
    </ConceptPage>
  );
}
