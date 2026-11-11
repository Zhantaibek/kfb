import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Inter, Oswald } from "next/font/google";
import { loadIssuerData } from "@/lib/cms/public";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, nav, num } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import { Icon } from "../_shared/Icon";
import { sectorPhoto } from "../_shared/SectorPhoto";
import { short } from "../karta/regions";
import { Calculator } from "./Calculator";
import css from "./limon.module.css";

/*
 * Концепция 24 — «Лайм»: повтор устройства и визуального языка главной wise.com по снимкам страницы — белый фон,
 * ярко-лаймовый #9fe870 и лесной зелёный #163300, тяжёлые узкие заголовки капслоком, кнопки-«таблетки»,
 * калькулятор на первом экране, лаймовая секция со сравнением, круглые «флаги»-фото, карточки, тёмно-зелёный блок,
 * красочный фон с белой карточкой, серый список «везде» и серый подвал.
 * Логотип, тексты, иллюстрации и отзывы Wise не используются — наполнение реальные данные КФБ.
 */
const display = Oswald({ subsets: ["latin", "cyrillic"], weight: ["600", "700"], variable: "--lm-display" });
const text = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], variable: "--lm-text" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "24 · Лайм" };

const audiences = [
  { title: "Частным инвесторам", text: "Счёт у брокера, первые акции и облигации — и котировки по итогам каждой сессии.", href: "/investors", cta: "Как начать", tone: "lime" },
  { title: "Компаниям", text: "Привлекайте капитал: размещение акций и облигаций, листинг и раскрытие отчётности.", href: "/listing", cta: "Условия листинга", tone: "forest" },
  { title: "Участникам торгов", text: "Брокеры и банки: правила торгов, тарифы и документы биржи.", href: "/documents", cta: "Документы", tone: "lime" },
  { title: "Покупателям ГЦБ", text: "Государственные ценные бумаги Министерства финансов — через аукционы на бирже.", href: "/gcb", cta: "Календарь ГЦБ", tone: "forest" },
];

export default async function LimonConcept() {
  const [data, issuerData] = await Promise.all([loadHomeData(), loadIssuerData()]);
  const priced = data.instruments.filter((i) => i.price > 0);
  const sessionText = data.live ? `Сессия ${longDate(data.session.date)}` : "Демо-данные";
  const maxLeader = Math.max(1, ...data.leaders.map((r) => r.volume));
  const issuers = [...issuerData.issuers].sort((a, b) => short(a.name).localeCompare(short(b.name), "ru")).slice(0, 40);
  const hrefOf = new Map(data.instruments.map((i) => [i.ticker, i.href]));

  return (
    <ConceptPage accent="#9fe870">
      <div className={`${css.page} ${display.variable} ${text.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <Link href="/design-concepts/limon" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={30} height={28} priority />
            <span>KSE</span>
          </Link>
          <nav className={css.nav} aria-label="Основное меню">
            <Link href="/investors">Инвесторам</Link>
            <Link href="/listing">Эмитентам</Link>
            <Link href="/market">Торги</Link>
          </nav>
          <div className={css.headRight}>
            <span className={css.lang}>
              <i aria-hidden="true" /> RU
            </span>
            <Link href="/contacts">Помощь</Link>
            <Link href="/search">Поиск</Link>
            <Link href="/members" className={css.limePill}>
              Начать инвестировать
            </Link>
          </div>
          <details className={css.menu}>
            <summary>Меню</summary>
            <nav aria-label="Меню (мобильное)">
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href="/members">Участники торгов</Link>
              <Link href="/contacts">Контакты</Link>
            </nav>
          </details>
        </header>

        <main id="main">
          {/* 1. Первый экран: заголовок слева, калькулятор справа. */}
          <section className={css.hero} aria-labelledby="lm-hero">
            <div className={css.heroText} data-intro="rise">
              <h1 id="lm-hero">Покупайте ценные бумаги Кыргызстана по честной цене</h1>
              <p>Цены формируются на открытых торгах и видны каждому. Покупайте акции, облигации и ГЦБ через лицензированного брокера.</p>
              <Link href="/members" className={css.limeBtn}>
                Открыть счёт у брокера
              </Link>
            </div>
            <div className={css.heroCard} data-intro="rise" style={{ "--kc-d": "150ms" } as CSSProperties}>
              <div className={css.cardTop}>
                <Image src="/hero/bishkek-ala-too.jpg" alt="" fill sizes="520px" priority />
                <p className={css.cardShout}>Ценные бумаги {num(data.issuers)} эмитентов</p>
                <p className={css.cardSub}>Посчитайте, сколько бумаг можно купить:</p>
              </div>
              <Calculator items={priced.slice(0, 10).map(({ ticker, name, price, href }) => ({ ticker, name, price, href }))} sessionText={sessionText} />
            </div>
          </section>

          {/* 2. Три преимущества с иконками. */}
          <section className={css.trio} aria-label="Почему биржа" data-stagger>
            <div>
              <span className={css.roundIcon}>
                <Icon name="users" />
              </span>
              <b>Доверяют эмитенты и инвесторы</b>
              <p>
                {num(data.issuers)} компаний раскрывают отчётность, {num(data.listed)} бумаг — в официальном списке биржи.
              </p>
            </div>
            <div>
              <span className={css.roundIcon}>
                <Icon name="file" />
              </span>
              <b>Лицензия регулятора</b>
              <p>{data.contacts.license ? `Биржа работает по лицензии ${data.contacts.license}.` : "Биржа работает по лицензии регулятора."}</p>
            </div>
            <div>
              <span className={css.roundIcon}>
                <Icon name="phone" />
              </span>
              <b>Поддержка инвесторов</b>
              <p>
                Звоните {data.contacts.phones[0] ?? ""} или пишите на{" "}
                <a href={`mailto:${data.contacts.email}`} className={css.underline}>
                  {data.contacts.email}
                </a>
                .
              </p>
            </div>
          </section>

          {/* 3. Лаймовая секция со сравнением. */}
          <section className={css.lime} aria-labelledby="lm-open">
            <h2 id="lm-open" className={css.shout} data-stagger><span className={css.line}>Больше никаких</span><span className={css.line}>скрытых цен</span></h2>
            <p className={css.limeText} data-reveal>
              Цена каждой бумаги — это итог открытых торгов. Котировки, объёмы и число сделок публикуются после каждой сессии.
            </p>
            <div className={css.limeActions} data-reveal>
              <Link href="/market/quotes" className={css.forestPill}>
                Смотреть котировки
              </Link>
              <Link href="/market" className={css.underline}>
                Итоги торгов
              </Link>
            </div>
            {data.leaders.length ? (
              <div className={css.compare} data-reveal>
                <div className={css.compareHead}>
                  <span>
                    <small>Лидеры недели</small>
                    <b>по объёму сделок</b>
                  </span>
                  <span>
                    <small>Единица</small>
                    <b>{data.live ? "тыс. сом" : "объём"}</b>
                  </span>
                </div>
                <ul className={css.compareRows} data-stagger>
                  {data.leaders.map((row, i) => (
                    <li key={row.ticker} style={{ "--w": `${Math.max(42, (row.volume / maxLeader) * 100)}%` } as CSSProperties} data-first={i === 0 || undefined}>
                      <Link href={hrefOf.get(row.ticker) ?? "/market/quotes"}>
                        <span className={css.rowLogo}>{row.ticker.slice(0, 2)}</span>
                        <span>
                          <b>{row.ticker}</b>
                          <small>
                            {row.name} · {num(row.deals)} сделок
                          </small>
                        </span>
                        <b className={css.rowVal}>{num(row.volume, 1)}</b>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/market" className={css.underline}>
                  Все итоги недели
                </Link>
              </div>
            ) : null}
          </section>

          {/* 4. Защита. */}
          <section className={css.safe} aria-labelledby="lm-safe">
            <div className={css.safeTop}>
              <div data-reveal>
                <h2 id="lm-safe">Рынок, защищённый правилами</h2>
                <p>Каждая сделка проходит через лицензированного участника торгов, а эмитенты раскрывают отчётность по правилам биржи.</p>
                <Link href="/documents" className={css.limePillSm}>
                  Правила и документы биржи
                </Link>
              </div>
              <span className={css.safeArt} aria-hidden="true">
                <Image src="/hero/kse-entrance-garden.jpg" alt="" fill sizes="240px" />
              </span>
            </div>
            <ul className={css.safeList} data-stagger>
              <li>
                <span className={css.roundIcon}>
                  <Icon name="users" />
                </span>
                <p>Сделки заключают только лицензированные брокеры и банки — список открыт на сайте биржи.</p>
              </li>
              <li>
                <span className={css.roundIcon}>
                  <Icon name="file" />
                </span>
                <p>Эмитенты публикуют отчёты и существенные факты в Центре раскрытия информации.</p>
              </li>
              <li>
                <span className={css.roundIcon}>
                  <Icon name="bank" />
                </span>
                <p>Учёт прав на ценные бумаги ведут центральный депозитарий и регистраторы.</p>
              </li>
            </ul>
          </section>

          {/* 5. Круглые «флаги» — фото отраслей торгуемых бумаг. */}
          <section className={css.flags} aria-label="Бумаги последней сессии">
            <Link href="/market/quotes" className={css.flagArrow} aria-label="Все котировки">
              <Icon name="arrowRight" />
            </Link>
            <ul>
              {priced.slice(0, 12).map((q) => (
                <li key={q.ticker}>
                  <Link href={q.href} title={`${q.ticker} — ${q.name}`}>
                    <Image src={sectorPhoto(q.name, q.type, q.ticker)} alt="" fill sizes="96px" />
                    <span className={css.srOnly}>{q.ticker}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 6. Карточки аудиторий (вместо отзывов — их у нас нет). */}
          <section className={css.far} aria-labelledby="lm-far">
            <h2 id="lm-far" className={css.shout} data-stagger><span className={css.line}>Для тех,</span><span className={css.line}>кто думает</span><span className={css.line}>наперёд</span></h2>
            <ul className={css.farCards} data-stagger>
              {audiences.map((a) => (
                <li key={a.title} data-tone={a.tone}>
                  <b>{a.title}</b>
                  <p>{a.text}</p>
                  <Link href={a.href}>{a.cta}</Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 7. Тёмно-зелёный блок. */}
          <section className={css.forest} aria-labelledby="lm-mission" data-reveal="zoom">
            <h2 id="lm-mission" className={css.shoutLime} data-stagger><span className={css.line}>Капитал без барьеров</span></h2>
            <p data-reveal>
              Биржа с 1994 года помогает компаниям Кыргызстана привлекать инвестиции, а людям — вкладывать в экономику страны. Просто, открыто и по правилам.
            </p>
            <Link href="/about" className={css.limePillSm}>
              Подробнее о бирже
            </Link>
          </section>

          {/* 8. Красочный фон с белой карточкой. */}
          <section className={css.paint} aria-labelledby="lm-learn">
            <span className={css.paintBg} aria-hidden="true">
              <Image src="/sectors/hydro.jpg" alt="" fill sizes="100vw" />
            </span>
            <div className={css.paintCard} data-reveal="zoom">
              <h2 id="lm-learn" className={css.shout} data-stagger><span className={css.line}>Научитесь</span><span className={css.line}>инвестировать</span><span className={css.line}>с нуля</span></h2>
              <p>Учебный центр биржи: курсы и семинары по рынку ценных бумаг для инвесторов и специалистов.</p>
              <Link href={EDU_URL} className={css.forestPill} {...linkProps(EDU_URL)}>
                Перейти в учебный центр
              </Link>
            </div>
          </section>

          {/* 9. Серый список «везде» — эмитенты биржи. */}
          <section className={css.everywhere} aria-labelledby="lm-all">
            <h2 id="lm-all">Компании, которые раскрывают отчётность на бирже.</h2>
            <span className={css.tag}>Эмитенты</span>
            <ul className={css.issuers} data-stagger>
              {issuers.map((i) => (
                <li key={i.slug}>
                  <Link href={`/disclosure/${i.slug}`}>
                    <span className={css.issuerDot} aria-hidden="true">
                      {short(i.name).slice(0, 1)}
                    </span>
                    <span>{short(i.name)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/disclosure" className={css.underline}>
              Все {num(data.issuers)} эмитентов
            </Link>
          </section>
        </main>

        <footer className={css.footer}>
          <div className={css.footCols}>
            <nav aria-label="Рынок">
              <b>Рынок</b>
              <Link href="/market">Итоги торгов</Link>
              <Link href="/market/quotes">Котировки</Link>
              <Link href="/market/index">Индекс KSE</Link>
              <Link href="/gcb">ГЦБ</Link>
            </nav>
            <nav aria-label="Ресурсы">
              <b>Ресурсы</b>
              <Link href="/listing">Листинг</Link>
              <Link href="/disclosure">Раскрытие информации</Link>
              <Link href="/documents">Документы</Link>
              <Link href={EDU_URL} {...linkProps(EDU_URL)}>
                Учебный центр
              </Link>
            </nav>
            <nav aria-label="Компания">
              <b>Биржа</b>
              <Link href="/about">О бирже</Link>
              <Link href="/news">Новости</Link>
              <Link href="/members">Участники торгов</Link>
              <Link href="/contacts">Контакты</Link>
            </nav>
          </div>
          <div className={css.footLogo}>
            <Image src="/brand/kse-mark.png" alt="" width={34} height={32} />
            <span>Кыргызская фондовая биржа</span>
          </div>
          <p className={css.legal}>
            {data.contacts.copyright}
            <br />
            {data.contacts.license ? `Деятельность ЗАО «Кыргызская фондовая биржа» осуществляется по лицензии ${data.contacts.license}. ` : ""}
            {data.contacts.address}. Информация на сайте не является инвестиционной рекомендацией.
          </p>
        </footer>
        <ConceptSwitch current="limon" />
      </div>
    </ConceptPage>
  );
}
