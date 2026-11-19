import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct, steps } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import { Icon, type IconName } from "../_shared/Icon";
import css from "./chertezh.module.css";

/*
 * Концепция 37 — «Чертёж»: строгий технический язык (по мотивам vercel.com). Белый лист с видимой сеткой линий,
 * ячейки с метками «+» в углах, моноширинные цифры Geist Mono, чёрные кнопки и одна бирюзовая деталь — статус и
 * ссылки. Логотип, тексты и изображения Vercel не используются.
 */
const geist = Geist({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--ch-font" });
const mono = Geist_Mono({ subsets: ["latin", "cyrillic"], weight: ["400", "500"], variable: "--ch-mono" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "37 · Чертёж" };

const services: { icon: IconName; title: string; text: string; href: string }[] = [
  { icon: "chart", title: "Торги", text: "Акции, облигации и драгоценные металлы на торговых сессиях.", href: "/market" },
  { icon: "bank", title: "Аукционы ГЦБ", text: "Размещение государственных ценных бумаг.", href: "/gcb" },
  { icon: "file", title: "Раскрытие", text: "Отчётность и существенные факты эмитентов.", href: "/disclosure" },
  { icon: "building", title: "Листинг", text: "Включение бумаг компаний в список биржи.", href: "/listing" },
  { icon: "users", title: "Участники", text: "Брокеры и банки, допущенные к торгам.", href: "/members" },
  { icon: "book", title: "Обучение", text: "Курсы учебного центра биржи.", href: EDU_URL },
];

export default async function ChertezhConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0).slice(0, 8);
  const chart = smoothPath(data.history, 300, 70, 6);

  return (
    <ConceptPage accent="#0a0a0a">
      <div className={`${css.page} ${geist.variable} ${mono.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <div className={css.headInner}>
            <Link href="/design-concepts/chertezh" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={24} height={22} priority />
              <span>КФБ</span>
            </Link>
            <nav className={css.nav} aria-label="Основное меню">
              <Link href="/market">Торги</Link>
              <Link href="/market/quotes">Котировки</Link>
              <Link href="/listing">Листинг</Link>
              <Link href="/gcb">ГЦБ</Link>
              <Link href="/disclosure">Раскрытие</Link>
              <Link href="/news">Новости</Link>
            </nav>
            <Link href="/contacts" className={css.btnOutlineSm}>
              Контакты
            </Link>
            <Link href="/members" className={css.btnDarkSm}>
              Начать
            </Link>
          </div>
        </header>

        <main id="main" className={css.frame}>
          {/* 1. Первый экран на сетке. */}
          <section className={css.hero} aria-labelledby="ch-hero">
            <p className={css.status} data-intro="fade">
              <i data-open={data.session.open || undefined} aria-hidden="true" />
              {data.session.label} · {data.session.hours}
            </p>
            <h1 id="ch-hero" data-intro="rise" style={{ "--kc-d": "80ms" } as CSSProperties}>
              Инфраструктура рынка капитала.
              <span>Кыргызская фондовая биржа.</span>
            </h1>
            <p className={css.lead} data-intro="rise" style={{ "--kc-d": "160ms" } as CSSProperties}>
              Торги, листинг, раскрытие информации и аукционы ГЦБ — по единым правилам, в открытом доступе.
            </p>
            <div className={css.actions} data-intro="rise" style={{ "--kc-d": "240ms" } as CSSProperties}>
              <Link href="/members" className={css.btnDark}>
                Начать инвестировать
              </Link>
              <Link href="/market/quotes" className={css.btnOutline}>
                Открыть котировки
              </Link>
            </div>
          </section>

          {/* 2. Ячейки с цифрами. */}
          <section className={css.cells} aria-label="Рынок сейчас">
            <Link href="/market/index" className={css.cell}>
              <small>Индекс KSE</small>
              <b>{num(data.index.value, 2)}</b>
              <span className={data.index.change >= 0 ? css.up : css.down}>{pct(data.index.change)}</span>
              {chart ? (
                <svg viewBox="0 0 300 70" preserveAspectRatio="none" aria-hidden="true" data-draw>
                  <path d={chart.line} />
                </svg>
              ) : null}
            </Link>
            <Link href="/market" className={css.cell}>
              <small>Объём сессии</small>
              <b>{num(data.volume.volumeMln, 1)}</b>
              <span>млн сом · {num(data.volume.trades)} сделок</span>
            </Link>
            <Link href="/disclosure" className={css.cell}>
              <small>Эмитентов</small>
              <b>{num(data.issuers)}</b>
              <span>{num(data.listed)} бумаг в листинге</span>
            </Link>
            <Link href="/market/index" className={css.cell}>
              <small>Капитализация</small>
              <b>{num(data.index.capitalization, 1)}</b>
              <span>млрд сом</span>
            </Link>
          </section>

          {/* 3. Котировки. */}
          <section className={css.block} aria-labelledby="ch-quotes">
            <div className={css.blockHead}>
              <h2 id="ch-quotes">Котировки</h2>
              <span className={css.mono}>сессия {longDate(data.session.date)}</span>
            </div>
            <div className={css.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Тикер</th>
                    <th scope="col">Эмитент</th>
                    <th scope="col">Цена, сом</th>
                    <th scope="col">Изм.</th>
                    <th scope="col">Объём</th>
                  </tr>
                </thead>
                <tbody>
                  {priced.map((item) => (
                    <tr key={item.ticker}>
                      <th scope="row">
                        <Link href={item.href}>{item.ticker}</Link>
                      </th>
                      <td>{item.name}</td>
                      <td>{num(item.price, 2)}</td>
                      <td className={item.change > 0 ? css.up : item.change < 0 ? css.down : css.flat}>{item.change ? pct(item.change) : "0,00%"}</td>
                      <td>{num(item.volume, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Link href="/market/quotes" className={css.blockLink}>
              Все {num(data.quotes.total)} бумаг →
            </Link>
          </section>

          {/* 4. Сервисы сеткой без зазоров. */}
          <section className={css.block} aria-labelledby="ch-services">
            <div className={css.blockHead}>
              <h2 id="ch-services">Сервисы биржи</h2>
            </div>
            <ul className={css.grid}>
              {services.map((item) => (
                <li key={item.title}>
                  <Link href={item.href} {...linkProps(item.href)}>
                    <Icon name={item.icon} className={css.gridIcon} />
                    <b>{item.title}</b>
                    <span>{item.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 5. Шаги. */}
          <section className={css.block} aria-labelledby="ch-steps">
            <div className={css.blockHead}>
              <h2 id="ch-steps">Как начать</h2>
            </div>
            <ol className={css.steps}>
              {steps.map((step, i) => (
                <li key={step.title}>
                  <Link href={step.href} {...linkProps(step.href)}>
                    <span className={css.mono}>{String(i + 1).padStart(2, "0")}</span>
                    <b>{step.title}</b>
                    <span>{step.text}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          {/* 6. Новости. */}
          <section className={css.block} aria-labelledby="ch-news">
            <div className={css.blockHead}>
              <h2 id="ch-news">Новости</h2>
              <Link href="/news" className={css.headLink}>
                Все новости →
              </Link>
            </div>
            <ul className={css.news}>
              {data.news.slice(0, 4).map((item) => (
                <li key={item.slug}>
                  <Link href={`/news/${item.slug}`}>
                    <time className={css.mono}>{item.date}</time>
                    <b>{item.title}</b>
                    <span>{item.tag}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 7. Финал. */}
          <section className={css.final} aria-labelledby="ch-final">
            <h2 id="ch-final">Откройте счёт у брокера — и рынок открыт.</h2>
            <div className={css.actions}>
              <Link href="/members" className={css.btnLight}>
                Выбрать брокера
              </Link>
              <Link href="/contacts" className={css.btnGhostLight}>
                Связаться с биржей
              </Link>
            </div>
          </section>
        </main>

        <footer className={css.footer}>
          <div className={css.footInner}>
            <div>
              <b>Кыргызская фондовая биржа</b>
              <p>{data.contacts.address}</p>
              <p className={css.mono}>
                {data.contacts.phones[0] ?? ""}
                {data.contacts.email ? ` · ${data.contacts.email}` : ""}
              </p>
            </div>
            <nav aria-label="Подвал">
              <Link href="/market">Итоги торгов</Link>
              <Link href="/listing">Листинг</Link>
              <Link href="/disclosure">Раскрытие</Link>
              <Link href="/documents">Документы</Link>
              <Link href="/about">О бирже</Link>
            </nav>
          </div>
          <p className={css.legal}>
            {data.contacts.copyright}. {data.contacts.license ? `Лицензия ${data.contacts.license}. ` : ""}Информация на сайте не является инвестиционной рекомендацией.
          </p>
        </footer>
        <ConceptSwitch current="chertezh" />
      </div>
    </ConceptPage>
  );
}
