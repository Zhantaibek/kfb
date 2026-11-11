import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PT_Sans } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct, steps } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import css from "./gosservis.module.css";

/*
 * Концепция 29 — «Госсервис»: главная в стиле государственных порталов услуг. Строгий синий, крупный читаемый
 * PT Sans, подчёркнутые ссылки, жёлтый фокус. Важные объявления сверху, популярные услуги списком, пошаговые
 * инструкции, данные рынка простыми таблицами, приёмная биржи. Только реальные данные.
 */
const ptSans = PT_Sans({ subsets: ["latin", "cyrillic"], weight: ["400", "700"], variable: "--gs-font" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "29 · Госсервис" };

const services = [
  { title: "Котировки ценных бумаг", text: "Цены и объёмы по каждой бумаге за последнюю сессию", href: "/market/quotes" },
  { title: "Итоги торгов", text: "Результаты торговых сессий биржи", href: "/market" },
  { title: "Индекс KSE", text: "Значение индекса и его история", href: "/market/index" },
  { title: "Аукционы ГЦБ", text: "Календарь и итоги размещения государственных ценных бумаг", href: "/gcb" },
  { title: "Отчётность эмитентов", text: "Годовые отчёты и существенные факты компаний", href: "/disclosure" },
  { title: "Листинг", text: "Требования и порядок включения бумаг в список биржи", href: "/listing" },
  { title: "Участники торгов", text: "Брокеры и банки, допущенные к торгам", href: "/members" },
  { title: "Правила и документы", text: "Внутренние документы, тарифы, формы заявлений", href: "/documents" },
  { title: "Обучение", text: "Курсы и семинары учебного центра биржи", href: EDU_URL },
];

const listingSteps = [
  { title: "Изучите требования листинга", text: "Условия включения акций и облигаций в список биржи.", href: "/listing" },
  { title: "Подготовьте документы", text: "Формы заявлений и перечень документов — в разделе «Документы».", href: "/documents" },
  { title: "Обратитесь в биржу", text: "Специалисты биржи проконсультируют и примут заявление.", href: "/contacts" },
  { title: "Раскрывайте информацию", text: "После листинга компания публикует отчётность в Центре раскрытия.", href: "/disclosure" },
];

export default async function GosservisConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0).slice(0, 8);

  return (
    <ConceptPage accent="#0b3d91">
      <div className={`${css.page} ${ptSans.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к основному содержанию
        </a>

        <div className={css.official}>
          <div className={css.wrap}>
            <span>Официальный сайт ЗАО «Кыргызская фондовая биржа»</span>
            <span className={css.lang} aria-label="Язык сайта: русский">
              <b>Русский</b> · Кыргызча
            </span>
          </div>
        </div>

        <header className={css.header}>
          <div className={`${css.wrap} ${css.headRow}`}>
            <Link href="/design-concepts/gosservis" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
              <span className={css.logo}>
                <Image src="/brand/kse-mark.png" alt="" width={36} height={34} priority />
              </span>
              <span>
                <b>Кыргызская фондовая биржа</b>
                <small>Услуги и данные рынка ценных бумаг</small>
              </span>
            </Link>
            <form className={css.search} action="/search" role="search">
              <label htmlFor="gs-q" className={css.srOnly}>
                Поиск по сайту
              </label>
              <input id="gs-q" name="q" type="search" placeholder="Поиск по сайту" />
              <button type="submit">Найти</button>
            </form>
          </div>
          <nav className={css.wrap} aria-label="Основное меню">
            <ul className={css.nav}>
              <li>
                <Link href="/market">Торги</Link>
              </li>
              <li>
                <Link href="/listing">Эмитентам</Link>
              </li>
              <li>
                <Link href="/members">Инвесторам</Link>
              </li>
              <li>
                <Link href="/gcb">ГЦБ</Link>
              </li>
              <li>
                <Link href="/disclosure">Раскрытие информации</Link>
              </li>
              <li>
                <Link href="/about">О бирже</Link>
              </li>
              <li>
                <Link href="/contacts">Контакты</Link>
              </li>
            </ul>
          </nav>
        </header>

        <main id="main">
          {/* 1. Синяя полоса с заголовком. */}
          <section className={css.hero} aria-labelledby="gs-hero">
            <div className={css.wrap}>
              <h1 id="gs-hero">Услуги биржи для инвесторов и компаний</h1>
              <p>Котировки и итоги торгов, аукционы государственных ценных бумаг, отчётность эмитентов, листинг и документы — в одном месте.</p>
              <p className={css.session}>
                <span data-open={data.session.open || undefined} aria-hidden="true" />
                {data.session.label}. Торги по будням {data.session.hours} (время Бишкека). Последние итоги — {longDate(data.session.date)}.
              </p>
            </div>
          </section>

          <div className={css.wrap}>
            {/* 2. Важные объявления из админки. */}
            {data.urgent.length ? (
              <section className={css.notice} aria-labelledby="gs-notice">
                <h2 id="gs-notice">Важно</h2>
                <ul>
                  {data.urgent.slice(0, 2).map((item) => (
                    <li key={item.slug}>
                      <Link href={`/news/${item.slug}`}>{item.title}</Link>
                      <span>{item.date}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* 3. Популярные услуги. */}
            <section className={css.block} aria-labelledby="gs-services">
              <h2 id="gs-services">Популярные услуги</h2>
              <ul className={css.services}>
                {services.map((item) => (
                  <li key={item.title}>
                    <Link href={item.href} {...linkProps(item.href)}>
                      {item.title}
                    </Link>
                    <p>{item.text}</p>
                  </li>
                ))}
              </ul>
            </section>

            {/* 4. Пошаговые инструкции. */}
            <section className={css.block} aria-labelledby="gs-guides">
              <h2 id="gs-guides">Пошаговые инструкции</h2>
              <div className={css.guides}>
                <article aria-labelledby="gs-guide-1">
                  <h3 id="gs-guide-1">Как купить акции частному лицу</h3>
                  <ol className={css.steps}>
                    {steps.map((step) => (
                      <li key={step.title}>
                        <Link href={step.href} {...linkProps(step.href)}>
                          {step.title}
                        </Link>
                        <p>{step.text}</p>
                      </li>
                    ))}
                  </ol>
                </article>
                <article aria-labelledby="gs-guide-2">
                  <h3 id="gs-guide-2">Как компании пройти листинг</h3>
                  <ol className={css.steps}>
                    {listingSteps.map((step) => (
                      <li key={step.title}>
                        <Link href={step.href}>{step.title}</Link>
                        <p>{step.text}</p>
                      </li>
                    ))}
                  </ol>
                </article>
              </div>
            </section>

            {/* 5. Данные рынка простыми таблицами. */}
            <section className={css.block} aria-labelledby="gs-data">
              <h2 id="gs-data">Данные рынка</h2>
              <dl className={css.summary}>
                <div>
                  <dt>Индекс KSE</dt>
                  <dd>
                    {num(data.index.value, 2)} <small>({pct(data.index.change)})</small>
                  </dd>
                </div>
                <div>
                  <dt>Объём сессии</dt>
                  <dd>{num(data.volume.volumeMln, 1)} млн сом</dd>
                </div>
                <div>
                  <dt>Сделок</dt>
                  <dd>{num(data.volume.trades)}</dd>
                </div>
                <div>
                  <dt>Эмитентов</dt>
                  <dd>{num(data.issuers)}</dd>
                </div>
              </dl>
              <div className={css.tables}>
                <div className={css.tableWrap}>
                  <table>
                    <caption>Котировки последней сессии</caption>
                    <thead>
                      <tr>
                        <th scope="col">Бумага</th>
                        <th scope="col">Эмитент</th>
                        <th scope="col">Цена, сом</th>
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
                          <td>{num(item.volume, 1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Link href="/market/quotes" className={css.more}>
                    Все котировки
                  </Link>
                </div>
                <div className={css.tableWrap}>
                  <table>
                    <caption>Аукционы ГЦБ</caption>
                    <thead>
                      <tr>
                        <th scope="col">Дата</th>
                        <th scope="col">Выпуск</th>
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
                  <Link href="/gcb" className={css.more}>
                    Календарь аукционов
                  </Link>
                </div>
              </div>
            </section>

            {/* 6. Новости. */}
            <section className={css.block} aria-labelledby="gs-news">
              <h2 id="gs-news">Новости</h2>
              <ul className={css.news}>
                {data.news.slice(0, 4).map((item) => (
                  <li key={item.slug}>
                    <time>{longDate(item.date)}</time>
                    <Link href={`/news/${item.slug}`}>{item.title}</Link>
                  </li>
                ))}
              </ul>
              <Link href="/news" className={css.more}>
                Все новости
              </Link>
            </section>

            {/* 7. Приёмная. */}
            <section className={`${css.block} ${css.contact}`} aria-labelledby="gs-contact">
              <h2 id="gs-contact">Обратиться в биржу</h2>
              <dl>
                <div>
                  <dt>Адрес</dt>
                  <dd>{data.contacts.address}</dd>
                </div>
                <div>
                  <dt>Телефон</dt>
                  <dd>
                    {data.contacts.phones.map((phone) => (
                      <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                        {phone}
                      </a>
                    ))}
                  </dd>
                </div>
                {data.contacts.email ? (
                  <div>
                    <dt>Электронная почта</dt>
                    <dd>
                      <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a>
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt>Часы работы</dt>
                  <dd>Понедельник — пятница</dd>
                </div>
              </dl>
            </section>
          </div>
        </main>

        <footer className={css.footer}>
          <div className={css.wrap}>
            <nav aria-label="Подвал">
              <Link href="/about">О бирже</Link>
              <Link href="/documents">Документы</Link>
              <Link href="/members">Участники торгов</Link>
              <Link href="/news">Новости</Link>
              <Link href="/contacts">Контакты</Link>
            </nav>
            <p>
              {data.contacts.copyright}. {data.contacts.license ? `Лицензия ${data.contacts.license}. ` : ""}Информация на сайте не является инвестиционной рекомендацией.
            </p>
          </div>
        </footer>
        <ConceptSwitch current="gosservis" />
      </div>
    </ConceptPage>
  );
}
