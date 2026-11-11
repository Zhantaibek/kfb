import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct, steps } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import { Icon, type IconName } from "../_shared/Icon";
import css from "./prilozhenie.module.css";

/*
 * Концепция 41 — «Приложение»: сайт биржи как веб-приложение (по мотивам интерфейсов Stripe Dashboard и Notion)
 * в фирменной бирюзе. Слева меню разделов с группами и статусом сессии, сверху строка с поиском, справа рабочая
 * область из карточек: показатели, график индекса, лидеры, котировки, аукционы ГЦБ, сообщения эмитентов, новости.
 */
const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--ap-font" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "41 · Приложение" };

const menu: { title: string; items: { icon: IconName; label: string; href: string; current?: boolean }[] }[] = [
  {
    title: "Рынок",
    items: [
      { icon: "chart", label: "Обзор", href: "/design-concepts/prilozhenie", current: true },
      { icon: "coin", label: "Котировки", href: "/market/quotes" },
      { icon: "arrowUpRight", label: "Индекс KSE", href: "/market/index" },
      { icon: "bank", label: "Аукционы ГЦБ", href: "/gcb" },
    ],
  },
  {
    title: "Компании",
    items: [
      { icon: "file", label: "Раскрытие", href: "/disclosure" },
      { icon: "building", label: "Листинг", href: "/listing" },
      { icon: "users", label: "Участники торгов", href: "/members" },
    ],
  },
  {
    title: "Биржа",
    items: [
      { icon: "megaphone", label: "Новости", href: "/news" },
      { icon: "book", label: "Учебный центр", href: EDU_URL },
      { icon: "phone", label: "Контакты", href: "/contacts" },
    ],
  },
];

export default async function PrilozhenieConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0).slice(0, 7);
  const chart = smoothPath(data.history, 700, 220, 12);
  const spark = smoothPath(data.history, 160, 40, 4);
  const first = data.indexSeries[0];
  const last = data.indexSeries.at(-1);
  const maxLeader = Math.max(1, ...data.leaders.map((row) => row.volume));

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${inter.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        {/* Боковое меню. */}
        <aside className={css.side}>
          <Link href="/design-concepts/prilozhenie" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={26} height={24} priority />
            <span>
              <b>КФБ</b>
              <small>Кыргызская фондовая биржа</small>
            </span>
          </Link>
          <Link href="/search" className={css.sideSearch}>
            <Icon name="search" />
            Поиск
            <kbd>/</kbd>
          </Link>
          <nav aria-label="Разделы">
            {menu.map((group) => (
              <div key={group.title} className={css.group}>
                <p>{group.title}</p>
                {group.items.map((item) => (
                  <Link key={item.label} href={item.href} aria-current={item.current ? "page" : undefined} {...linkProps(item.href)}>
                    <Icon name={item.icon} />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <div className={css.sessionCard} data-open={data.session.open || undefined}>
            <span>
              <i aria-hidden="true" />
              {data.session.label}
            </span>
            <small>По будням {data.session.hours} · Бишкек {data.session.clock}</small>
          </div>
        </aside>

        <div className={css.main}>
          {/* Верхняя строка. */}
          <header className={css.top}>
            <p className={css.crumbs}>
              Рынок <span>/</span> <b>Обзор</b>
            </p>
            <div className={css.topActions}>
              <Link href="/documents" className={css.btnGhost}>
                Документы
              </Link>
              <Link href="/members" className={css.btn}>
                Начать инвестировать
              </Link>
            </div>
          </header>

          <main id="main" className={css.content}>
            <div className={css.titleRow}>
              <div>
                <h1>Обзор рынка</h1>
                <p>Итоги торговой сессии {longDate(data.session.date)}. Данные Кыргызской фондовой биржи.</p>
              </div>
              <Link href="/market" className={css.btnGhost}>
                Все итоги торгов
              </Link>
            </div>

            {/* Показатели. */}
            <section className={css.kpis} aria-label="Показатели">
              <Link href="/market/index" className={css.card}>
                <small>Индекс KSE</small>
                <b>{num(data.index.value, 2)}</b>
                <span className={data.index.change >= 0 ? css.up : css.down}>{pct(data.index.change)}</span>
                {spark ? (
                  <svg viewBox="0 0 160 40" preserveAspectRatio="none" aria-hidden="true">
                    <path d={spark.line} />
                  </svg>
                ) : null}
              </Link>
              <Link href="/market" className={css.card}>
                <small>Объём сессии</small>
                <b>{num(data.volume.volumeMln, 1)}</b>
                <span>млн сом</span>
              </Link>
              <Link href="/market" className={css.card}>
                <small>Сделок</small>
                <b>{num(data.volume.trades)}</b>
                <span>за сессию</span>
              </Link>
              <Link href="/disclosure" className={css.card}>
                <small>Эмитентов</small>
                <b>{num(data.issuers)}</b>
                <span>{num(data.listed)} бумаг в листинге</span>
              </Link>
            </section>

            {/* График и лидеры. */}
            <div className={css.row}>
              <section className={`${css.card} ${css.wide}`} aria-labelledby="ap-chart">
                <div className={css.cardHead}>
                  <h2 id="ap-chart">Индекс KSE</h2>
                  <span>Капитализация {num(data.index.capitalization, 1)} млрд сом</span>
                </div>
                {chart ? (
                  <figure className={css.chart}>
                    <svg viewBox="0 0 700 220" preserveAspectRatio="none" aria-hidden="true" data-draw>
                      <defs>
                        <linearGradient id="ap-area" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#57b6c0" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="#57b6c0" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={chart.area} fill="url(#ap-area)" />
                      <path d={chart.line} className={css.line} />
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

              <section className={css.card} aria-labelledby="ap-leaders">
                <div className={css.cardHead}>
                  <h2 id="ap-leaders">Лидеры недели</h2>
                  <span>тыс. сом</span>
                </div>
                {data.leaders.length ? (
                  <ul className={css.bars}>
                    {data.leaders.slice(0, 6).map((row) => (
                      <li key={row.ticker}>
                        <span>
                          <b>{row.ticker}</b>
                          <small>{num(row.volume, 1)}</small>
                        </span>
                        <i style={{ width: `${Math.max(3, (row.volume / maxLeader) * 100)}%` }} aria-hidden="true" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={css.empty}>Итоги недели появятся после сессии.</p>
                )}
              </section>
            </div>

            {/* Котировки и ГЦБ. */}
            <div className={css.row}>
              <section className={`${css.card} ${css.wide}`} aria-labelledby="ap-quotes">
                <div className={css.cardHead}>
                  <h2 id="ap-quotes">Котировки</h2>
                  <Link href="/market/quotes">Все {num(data.quotes.total)} →</Link>
                </div>
                <div className={css.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Бумага</th>
                        <th scope="col">Эмитент</th>
                        <th scope="col">Цена</th>
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
                          <td>
                            <span className={item.change > 0 ? css.badgeUp : item.change < 0 ? css.badgeDown : css.badge}>{item.change ? pct(item.change) : "0,00%"}</span>
                          </td>
                          <td>{num(item.volume, 1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className={css.card} aria-labelledby="ap-gcb">
                <div className={css.cardHead}>
                  <h2 id="ap-gcb">Аукционы ГЦБ</h2>
                  <Link href="/gcb">Календарь →</Link>
                </div>
                <ul className={css.list}>
                  {data.auctions.map((item) => (
                    <li key={`${item.date}-${item.type}`}>
                      <span className={css.listIcon}>
                        <Icon name="bank" />
                      </span>
                      <span>
                        <b>{item.date}</b>
                        <small>
                          {item.type} · {item.volume}
                        </small>
                      </span>
                      <span className={css.badge}>{item.status}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Сообщения, новости, шаги. */}
            <div className={css.row3}>
              <section className={css.card} aria-labelledby="ap-company">
                <div className={css.cardHead}>
                  <h2 id="ap-company">Сообщения эмитентов</h2>
                  <Link href="/disclosure">Все →</Link>
                </div>
                <ul className={css.feed}>
                  {data.companyNews.map((item) => (
                    <li key={item.slug}>
                      <Link href={`/news/${item.slug}`}>
                        <small>
                          {item.company} · {item.date}
                        </small>
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={css.card} aria-labelledby="ap-news">
                <div className={css.cardHead}>
                  <h2 id="ap-news">Новости биржи</h2>
                  <Link href="/news">Все →</Link>
                </div>
                <ul className={css.feed}>
                  {data.news.slice(0, 4).map((item) => (
                    <li key={item.slug}>
                      <Link href={`/news/${item.slug}`}>
                        <small>
                          {item.tag} · {item.date}
                        </small>
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={css.card} aria-labelledby="ap-start">
                <div className={css.cardHead}>
                  <h2 id="ap-start">С чего начать</h2>
                </div>
                <ol className={css.check}>
                  {steps.map((step, i) => (
                    <li key={step.title}>
                      <Link href={step.href} {...linkProps(step.href)}>
                        <span>{i + 1}</span>
                        <b>{step.title}</b>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <footer className={css.footer}>
              <span>{data.contacts.copyright}</span>
              <span>
                {data.contacts.address} · {data.contacts.phones[0] ?? ""}
              </span>
              <span>{data.contacts.license ? `Лицензия ${data.contacts.license}. ` : ""}Информация не является инвестиционной рекомендацией.</span>
            </footer>
          </main>
        </div>
        <ConceptSwitch current="prilozhenie" />
      </div>
    </ConceptPage>
  );
}
