import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Commissioner } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct, steps } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import { AudienceSwitch } from "./AudienceSwitch";
import css from "./vhody.module.css";

/*
 * Концепция 31 — «Два входа»: первый экран — две большие «двери»: «Я инвестор» и «Я представляю компанию».
 * Выбор переключает содержимое страницы под аудиторию (рынок, котировки, шаги и ГЦБ — или листинг,
 * раскрытие и документы). Тёмно-зелёная дверь инвестора, песочная дверь компании, шрифт Commissioner.
 */
const commissioner = Commissioner({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"], variable: "--vh-font" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "31 · Два входа" };

const benefits = [
  { title: "Капитал от инвесторов", text: "Размещение акций и облигаций открывает доступ к деньгам частных и институциональных инвесторов." },
  { title: "Рыночная оценка", text: "Цена бумаг складывается на открытых торгах — это понятная оценка компании для партнёров и банков." },
  { title: "Доверие и узнаваемость", text: "Компания в списке биржи раскрывает отчётность — это сигнал прозрачности для клиентов." },
];

const listingSteps = [
  { title: "Изучите требования", text: "Условия включения акций и облигаций в список биржи.", href: "/listing" },
  { title: "Подготовьте документы", text: "Формы заявлений и перечень документов.", href: "/documents" },
  { title: "Обратитесь в биржу", text: "Специалисты проконсультируют и примут заявление.", href: "/contacts" },
  { title: "Раскрывайте информацию", text: "Публикуйте отчётность в Центре раскрытия.", href: "/disclosure" },
];

export default async function VhodyConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0).slice(0, 6);

  return (
    <ConceptPage accent="#0f3d2e">
      <div className={`${css.page} ${commissioner.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <Link href="/design-concepts/vhody" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={32} height={30} priority />
            <span>Кыргызская фондовая биржа</span>
          </Link>
          <nav className={css.nav} aria-label="Основное меню">
            <Link href="/market">Торги</Link>
            <Link href="/disclosure">Раскрытие</Link>
            <Link href="/about">О бирже</Link>
            <Link href="/contacts">Контакты</Link>
          </nav>
          <Link href="/members" className={css.member}>
            Я участник торгов →
          </Link>
        </header>

        <main id="main">
          <h1 className={css.ask}>Кыргызская фондовая биржа · выберите раздел</h1>

          <AudienceSwitch>
            {/* ---------- Инвестору ---------- */}
            <section data-for="investor" className={css.panel} aria-labelledby="vh-inv-market">
              <h2 id="vh-inv-market" className={css.title}>
                Рынок сейчас
              </h2>
              <dl className={css.stats}>
                <div>
                  <dt>Индекс KSE</dt>
                  <dd>{num(data.index.value, 2)}</dd>
                  <small className={data.index.change >= 0 ? css.up : css.down}>{pct(data.index.change)}</small>
                </div>
                <div>
                  <dt>Объём сессии</dt>
                  <dd>{num(data.volume.volumeMln, 1)}</dd>
                  <small>млн сом</small>
                </div>
                <div>
                  <dt>Сделок</dt>
                  <dd>{num(data.volume.trades)}</dd>
                  <small>{longDate(data.session.date)}</small>
                </div>
                <div>
                  <dt>Сессия</dt>
                  <dd className={css.small}>{data.session.open ? "Открыта" : "Закрыта"}</dd>
                  <small>{data.session.hours}</small>
                </div>
              </dl>
            </section>

            <section data-for="investor" className={css.panel} aria-labelledby="vh-inv-quotes">
              <div className={css.titleRow}>
                <h2 id="vh-inv-quotes" className={css.title}>
                  Что торгуется
                </h2>
                <Link href="/market/quotes">Все котировки →</Link>
              </div>
              <ul className={css.quotes}>
                {priced.map((item) => (
                  <li key={item.ticker}>
                    <Link href={item.href}>
                      <b>{item.ticker}</b>
                      <span>{item.name}</span>
                      <strong>{num(item.price, 2)} сом</strong>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section data-for="investor" className={css.panel} aria-labelledby="vh-inv-steps">
              <h2 id="vh-inv-steps" className={css.title}>
                Как купить первые бумаги
              </h2>
              <ol className={css.steps}>
                {steps.map((step, i) => (
                  <li key={step.title}>
                    <Link href={step.href} {...linkProps(step.href)}>
                      <span>{i + 1}</span>
                      <b>{step.title}</b>
                      <small>{step.text}</small>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>

            {data.auctions.length ? (
              <section data-for="investor" className={css.panel} aria-labelledby="vh-inv-gcb">
                <div className={css.titleRow}>
                  <h2 id="vh-inv-gcb" className={css.title}>
                    Надёжнее — ГЦБ
                  </h2>
                  <Link href="/gcb">Календарь аукционов →</Link>
                </div>
                <ul className={css.auctions}>
                  {data.auctions.map((item) => (
                    <li key={`${item.date}-${item.type}`}>
                      <b>{item.date}</b>
                      <span>{item.type}</span>
                      <span>{item.volume}</span>
                      <em>{item.status}</em>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* ---------- Компании ---------- */}
            <section data-for="company" className={css.panel} aria-labelledby="vh-co-why">
              <h2 id="vh-co-why" className={css.title}>
                Зачем компании биржа
              </h2>
              <ul className={css.benefits}>
                {benefits.map((item, i) => (
                  <li key={item.title}>
                    <span>0{i + 1}</span>
                    <b>{item.title}</b>
                    <p>{item.text}</p>
                  </li>
                ))}
              </ul>
              <dl className={css.stats}>
                <div>
                  <dt>Эмитентов раскрывают отчётность</dt>
                  <dd>{num(data.issuers)}</dd>
                </div>
                <div>
                  <dt>Бумаг в официальном списке</dt>
                  <dd>{num(data.listed)}</dd>
                </div>
                <div>
                  <dt>Капитализация рынка</dt>
                  <dd>{num(data.index.capitalization, 1)}</dd>
                  <small>млрд сом</small>
                </div>
              </dl>
            </section>

            <section data-for="company" className={css.panel} aria-labelledby="vh-co-steps">
              <h2 id="vh-co-steps" className={css.title}>
                Как выйти на биржу
              </h2>
              <ol className={css.steps}>
                {listingSteps.map((step, i) => (
                  <li key={step.title}>
                    <Link href={step.href}>
                      <span>{i + 1}</span>
                      <b>{step.title}</b>
                      <small>{step.text}</small>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>

            <section data-for="company" className={css.panel} aria-labelledby="vh-co-docs">
              <h2 id="vh-co-docs" className={css.title}>
                Что пригодится эмитенту
              </h2>
              <ul className={css.links}>
                <li>
                  <Link href="/listing">
                    <b>Листинг</b>
                    <span>Требования и порядок включения бумаг в список</span>
                  </Link>
                </li>
                <li>
                  <Link href="/disclosure">
                    <b>Центр раскрытия</b>
                    <span>Как и где публиковать отчётность</span>
                  </Link>
                </li>
                <li>
                  <Link href="/documents">
                    <b>Документы и тарифы</b>
                    <span>Правила биржи и формы заявлений</span>
                  </Link>
                </li>
                <li>
                  <Link href={EDU_URL} {...linkProps(EDU_URL)}>
                    <b>Обучение</b>
                    <span>Семинары для специалистов компаний</span>
                  </Link>
                </li>
              </ul>
            </section>
          </AudienceSwitch>

          {/* Общее для всех: новости. */}
          <section className={css.news} aria-labelledby="vh-news">
            <div className={css.titleRow}>
              <h2 id="vh-news" className={css.title}>
                Новости биржи
              </h2>
              <Link href="/news">Все новости →</Link>
            </div>
            <ul>
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
        </main>

        <footer className={css.footer}>
          <div>
            <b>Кыргызская фондовая биржа</b>
            <p>{data.contacts.address}</p>
            <p>
              {data.contacts.phones[0] ?? ""}
              {data.contacts.email ? (
                <>
                  {" · "}
                  <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a>
                </>
              ) : null}
            </p>
          </div>
          <nav aria-label="Подвал">
            <Link href="/market">Итоги торгов</Link>
            <Link href="/listing">Листинг</Link>
            <Link href="/members">Участники торгов</Link>
            <Link href="/documents">Документы</Link>
            <Link href="/contacts">Контакты</Link>
          </nav>
          <p className={css.legal}>
            {data.contacts.copyright}. {data.contacts.license ? `Лицензия ${data.contacts.license}. ` : ""}Информация на сайте не является инвестиционной рекомендацией.
          </p>
        </footer>
        <ConceptSwitch current="vhody" />
      </div>
    </ConceptPage>
  );
}
