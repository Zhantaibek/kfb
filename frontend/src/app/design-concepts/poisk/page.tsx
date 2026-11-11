import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Golos_Text } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linePath, linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import { Icon, type IconName } from "../_shared/Icon";
import { SearchBox, type Market } from "./SearchBox";
import css from "./poisk.module.css";

/*
 * Концепция 26 — «Поиск»: понятная главная биржи с поиском в центре внимания. Первый экран говорит, что это за
 * сайт, и сразу даёт найти бумагу, компанию или раздел (настоящий поиск сайта с мгновенными ответами); рядом —
 * карточка «Рынок сегодня». Ниже — что можно сделать на сайте, котировки, новости и частые вопросы.
 * Белый фон, один синий акцент, шрифт Golos Text. Только реальные данные.
 */
const golos = Golos_Text({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--ps-font" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "26 · Поиск" };

const actions: { icon: IconName; title: string; text: string; href: string; cta: string }[] = [
  { icon: "wallet", title: "Начать инвестировать", text: "Сделки на бирже проходят через брокера. Выберите участника торгов и откройте счёт.", href: "/members", cta: "Список брокеров" },
  { icon: "chart", title: "Смотреть котировки", text: "Цены, изменения и объёмы по каждой бумаге за последнюю торговую сессию.", href: "/market/quotes", cta: "Котировки" },
  { icon: "file", title: "Найти отчётность компании", text: "Годовые отчёты и существенные факты эмитентов — в Центре раскрытия информации.", href: "/disclosure", cta: "Центр раскрытия" },
  { icon: "bank", title: "Купить ГЦБ", text: "Государственные ценные бумаги Минфина размещаются на аукционах биржи.", href: "/gcb", cta: "Календарь аукционов" },
  { icon: "building", title: "Выйти на биржу", text: "Компаниям: листинг акций и облигаций, привлечение капитала инвесторов.", href: "/listing", cta: "Условия листинга" },
  { icon: "book", title: "Научиться инвестировать", text: "Курсы и семинары учебного центра биржи для инвесторов и специалистов.", href: EDU_URL, cta: "Учебный центр" },
];

const questions = [
  {
    q: "Как купить акции на бирже?",
    a: "Откройте счёт у брокера — участника торгов биржи. Брокер примет ваше поручение и выставит заявку на торговой сессии.",
    href: "/members",
    cta: "Список участников торгов",
  },
  {
    q: "Где найти отчётность компании?",
    a: "Годовые и квартальные отчёты, существенные факты и данные об эмитентах публикуются в Центре раскрытия информации.",
    href: "/disclosure",
    cta: "Центр раскрытия",
  },
  {
    q: "Когда проходят торги?",
    a: "Торговая сессия проходит по будням. Итоги — цены, объёмы и число сделок — публикуются после её закрытия.",
    href: "/market",
    cta: "Итоги торгов",
  },
  {
    q: "Как компании выйти на биржу?",
    a: "Листинг открывает доступ к капиталу инвесторов. Требования к эмитентам и порядок включения бумаг описаны в правилах биржи.",
    href: "/listing",
    cta: "Условия листинга",
  },
];

export default async function SearchConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const auction = data.auctions[0];
  const spark = linePath(data.history, 240, 60, 4);
  const hints = [priced[0]?.ticker, "ГЦБ", "Индекс", "Отчётность"].filter((hint): hint is string => Boolean(hint));
  // Данные для мгновенных ответов над выдачей поиска: бумаги, индекс, сессия, ближайший аукцион.
  const market: Market = {
    papers: priced.map(({ ticker, name, price, change, volume, href }) => ({ ticker, name, price, change, volume, href })),
    index: { value: data.index.value, change: data.index.change, spark: linePath(data.history, 120, 32, 3) },
    session: { open: data.session.open, label: data.session.label, hours: data.session.hours, date: longDate(data.session.date) },
    auction: auction ?? null,
  };

  return (
    <ConceptPage accent="#2346ff">
      <div className={`${css.page} ${golos.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <Link href="/design-concepts/poisk" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={32} height={30} priority />
            <span>
              <b>Кыргызская фондовая биржа</b>
              <small>Kyrgyz Stock Exchange</small>
            </span>
          </Link>
          <nav className={css.nav} aria-label="Основное меню">
            <Link href="/market">Торги</Link>
            <Link href="/market/quotes">Котировки</Link>
            <Link href="/disclosure">Раскрытие</Link>
            <Link href="/gcb">ГЦБ</Link>
            <Link href="/about">О бирже</Link>
            <Link href="/contacts">Контакты</Link>
          </nav>
        </header>

        <main id="main">
          {/* 1. Первый экран: кто мы + поиск слева, рынок сегодня справа. */}
          <section className={css.hero} aria-labelledby="ps-hero">
            <div className={css.heroText}>
              <p className={css.kicker} data-intro="fade">
                Официальный сайт биржи · с 1994 года
              </p>
              <h1 id="ps-hero" data-intro="rise" style={{ "--kc-d": "80ms" } as CSSProperties}>
                Ценные бумаги Кыргызстана — в&nbsp;одном месте
              </h1>
              <p className={css.lead} data-intro="rise" style={{ "--kc-d": "140ms" } as CSSProperties}>
                Торги акциями, облигациями и государственными ценными бумагами. Котировки, отчётность компаний и аукционы ГЦБ — найдите то, что нужно.
              </p>
              <div data-intro="rise" style={{ "--kc-d": "200ms" } as CSSProperties}>
                <SearchBox hints={hints} market={market} />
              </div>
            </div>

            <aside className={css.today} aria-labelledby="ps-today" data-intro="rise" style={{ "--kc-d": "240ms" } as CSSProperties}>
              <div className={css.todayHead}>
                <h2 id="ps-today">Рынок сегодня</h2>
                <span className={css.status} data-open={data.session.open || undefined}>
                  <i aria-hidden="true" />
                  {data.session.label}
                </span>
              </div>
              <Link href="/market/index" className={css.indexBox}>
                <small>Индекс KSE</small>
                <b>{num(data.index.value, 2)}</b>
                <span className={data.index.change >= 0 ? css.up : css.down}>{pct(data.index.change)} за сессию</span>
                {spark ? (
                  <svg viewBox="0 0 240 60" preserveAspectRatio="none" aria-hidden="true" data-draw>
                    <path d={spark} />
                  </svg>
                ) : null}
              </Link>
              <dl className={css.facts}>
                <div>
                  <dt>Объём сессии</dt>
                  <dd>{num(data.volume.volumeMln, 1)} млн сом</dd>
                </div>
                <div>
                  <dt>Сделок</dt>
                  <dd>{num(data.volume.trades)}</dd>
                </div>
                <div>
                  <dt>Часы торгов</dt>
                  <dd>{data.session.hours}</dd>
                </div>
                {auction ? (
                  <div>
                    <dt>Аукцион ГЦБ</dt>
                    <dd>
                      {auction.date} · {auction.volume}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <Link href="/market" className={css.todayLink}>
                Итоги торгов {longDate(data.session.date)} →
              </Link>
            </aside>
          </section>

          {/* 2. Что можно сделать на сайте. */}
          <section className={css.actions} aria-labelledby="ps-actions">
            <h2 id="ps-actions" className={css.title}>
              Что можно сделать на сайте
            </h2>
            <ul data-stagger>
              {actions.map((item) => (
                <li key={item.title}>
                  <Link href={item.href} {...linkProps(item.href)}>
                    <span className={css.actionIcon}>
                      <Icon name={item.icon} />
                    </span>
                    <b>{item.title}</b>
                    <span>{item.text}</span>
                    <em>{item.cta} →</em>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 3. Котировки. */}
          <section className={css.quotes} aria-labelledby="ps-quotes">
            <div className={css.titleRow}>
              <h2 id="ps-quotes" className={css.title}>
                Котировки последней сессии
              </h2>
              <Link href="/market/quotes">Все {num(data.quotes.total)} бумаг →</Link>
            </div>
            <div className={css.tableWrap} data-reveal>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Бумага</th>
                    <th scope="col">Компания</th>
                    <th scope="col">Цена, сом</th>
                    <th scope="col">Изменение</th>
                    <th scope="col">Объём</th>
                  </tr>
                </thead>
                <tbody>
                  {priced.slice(0, 6).map((item) => (
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
          </section>

          {/* 4. Новости. */}
          <section className={css.news} aria-labelledby="ps-news">
            <div className={css.titleRow}>
              <h2 id="ps-news" className={css.title}>
                Новости биржи
              </h2>
              <Link href="/news">Все новости →</Link>
            </div>
            <ul data-stagger>
              {data.news.slice(0, 3).map((item) => (
                <li key={item.slug}>
                  <Link href={`/news/${item.slug}`}>
                    <span className={css.newsPhoto}>
                      <Image src={item.photo} alt="" fill sizes="(max-width: 720px) 100vw, 360px" />
                    </span>
                    <time>{longDate(item.date)}</time>
                    <b>{item.title}</b>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 5. Частые вопросы. */}
          <section className={css.faq} aria-labelledby="ps-faq">
            <h2 id="ps-faq" className={css.title}>
              Частые вопросы
            </h2>
            <div className={css.faqList} data-reveal>
              {questions.map((item, i) => (
                <details key={item.q} open={i === 0}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                  <Link href={item.href}>{item.cta} →</Link>
                </details>
              ))}
            </div>
          </section>
        </main>

        <footer className={css.footer}>
          <div className={css.footBrand}>
            <Image src="/brand/kse-mark.png" alt="" width={32} height={30} />
            <b>Кыргызская фондовая биржа</b>
            <p>{data.contacts.address}</p>
            <p>
              {data.contacts.phones.map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                  {phone}
                </a>
              ))}
            </p>
            {data.contacts.email ? <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a> : null}
          </div>
          <nav aria-label="Рынок">
            <b>Рынок</b>
            <Link href="/market">Итоги торгов</Link>
            <Link href="/market/quotes">Котировки</Link>
            <Link href="/market/index">Индекс KSE</Link>
            <Link href="/gcb">Аукционы ГЦБ</Link>
          </nav>
          <nav aria-label="Эмитентам и участникам">
            <b>Эмитентам</b>
            <Link href="/listing">Листинг</Link>
            <Link href="/disclosure">Раскрытие информации</Link>
            <Link href="/members">Участники торгов</Link>
            <Link href="/documents">Документы</Link>
          </nav>
          <nav aria-label="О бирже">
            <b>Биржа</b>
            <Link href="/about">О бирже</Link>
            <Link href="/news">Новости</Link>
            <Link href={EDU_URL} {...linkProps(EDU_URL)}>
              Учебный центр
            </Link>
            <Link href="/contacts">Контакты</Link>
          </nav>
          <p className={css.legal}>
            {data.contacts.copyright}. {data.contacts.license ? `Лицензия ${data.contacts.license}. ` : ""}Информация на сайте не является инвестиционной рекомендацией.
          </p>
        </footer>
        <ConceptSwitch current="poisk" />
      </div>
    </ConceptPage>
  );
}
