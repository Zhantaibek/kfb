import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Manrope } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import { Icon, type IconName } from "../_shared/Icon";
import { pickNewsPhotos } from "../_shared/news-photos";
import css from "./siyanie.module.css";

/*
 * Концепция 33 — «Сияние»: тёмный язык современных технологичных продуктов (по мотивам linear.app) в фирменной
 * бирюзе КФБ. Почти чёрный фон, бирюзовое свечение, текст-градиент, стеклянные карточки с тонкими светящимися
 * краями, большое «окно терминала» на реальных данных, лента новостей как журнал изменений.
 * Логотип, тексты и изображения Linear не используются.
 */
const manrope = Manrope({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"], variable: "--sy-font" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "33 · Сияние" };

const features: { icon: IconName; title: string; text: string; href: string }[] = [
  { icon: "chart", title: "Торги", text: "Акции, облигации и металлы на открытых торговых сессиях.", href: "/market" },
  { icon: "bank", title: "ГЦБ", text: "Аукционы государственных ценных бумаг Министерства финансов.", href: "/gcb" },
  { icon: "file", title: "Раскрытие", text: "Отчётность и существенные факты эмитентов в одном месте.", href: "/disclosure" },
  { icon: "building", title: "Листинг", text: "Путь компании к инвесторам: требования и сопровождение.", href: "/listing" },
  { icon: "users", title: "Участники", text: "Брокеры и банки, допущенные к торгам на бирже.", href: "/members" },
  { icon: "book", title: "Обучение", text: "Курсы и семинары учебного центра биржи.", href: EDU_URL },
];

export default async function SiyanieConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const chart = smoothPath(data.history, 600, 180, 10);
  const news = data.news.slice(0, 4);
  const photos = pickNewsPhotos(news);

  return (
    <ConceptPage accent="#57b6c0">
      <div className={`${css.page} ${manrope.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>
        <div className={css.glow} aria-hidden="true" />

        <header className={css.header}>
          <Link href="/design-concepts/siyanie" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={26} height={24} priority />
            <span>Кыргызская фондовая биржа</span>
          </Link>
          <nav className={css.nav} aria-label="Основное меню">
            <Link href="/market">Торги</Link>
            <Link href="/listing">Эмитентам</Link>
            <Link href="/members">Инвесторам</Link>
            <Link href="/gcb">ГЦБ</Link>
            <Link href="/news">Новости</Link>
          </nav>
          <Link href="/contacts" className={css.headLink}>
            Контакты
          </Link>
          <Link href="/members" className={css.headCta}>
            Начать
          </Link>
        </header>

        <main id="main">
          {/* 1. Первый экран по центру. */}
          <section className={css.hero} aria-labelledby="sy-hero">
            <Link href="/market/index" className={css.pill} data-intro="fade">
              <i data-open={data.session.open || undefined} aria-hidden="true" />
              Индекс KSE {num(data.index.value, 2)} · {data.session.label.toLowerCase()} →
            </Link>
            <h1 id="sy-hero" data-intro="rise" style={{ "--kc-d": "80ms" } as CSSProperties}>
              Рынок капитала Кыргызстана.
              <br />
              <span>Открыто и прозрачно.</span>
            </h1>
            <p data-intro="rise" style={{ "--kc-d": "160ms" } as CSSProperties}>
              Торги ценными бумагами, аукционы ГЦБ и раскрытие информации {num(data.issuers)} эмитентов — на одной бирже с 1994 года.
            </p>
            <div className={css.heroActions} data-intro="rise" style={{ "--kc-d": "240ms" } as CSSProperties}>
              <Link href="/members" className={css.btnLight}>
                Начать инвестировать
              </Link>
              <Link href="/market/quotes" className={css.btnGhost}>
                Котировки →
              </Link>
            </div>
          </section>

          {/* 2. Окно терминала на реальных данных. */}
          <section className={css.terminalWrap} aria-label="Рынок сейчас" data-intro="zoom" style={{ "--kc-d": "300ms" } as CSSProperties}>
            <div className={css.terminal}>
              <aside className={css.side}>
                <span className={css.sideHead}>
                  <i />
                  <i />
                  <i />
                </span>
                <Link href="/market" aria-current="page">
                  <Icon name="chart" /> Рынок
                </Link>
                <Link href="/market/quotes">
                  <Icon name="coin" /> Котировки
                </Link>
                <Link href="/market/index">
                  <Icon name="arrowUpRight" /> Индекс
                </Link>
                <Link href="/gcb">
                  <Icon name="bank" /> ГЦБ
                </Link>
                <Link href="/disclosure">
                  <Icon name="file" /> Раскрытие
                </Link>
              </aside>
              <div className={css.termMain}>
                <div className={css.termTop}>
                  <div>
                    <small>Индекс KSE · {longDate(data.session.date)}</small>
                    <b>{num(data.index.value, 2)}</b>
                    <span className={data.index.change >= 0 ? css.up : css.down}>{pct(data.index.change)}</span>
                  </div>
                  <dl>
                    <div>
                      <dt>Объём</dt>
                      <dd>{num(data.volume.volumeMln, 1)} млн</dd>
                    </div>
                    <div>
                      <dt>Сделок</dt>
                      <dd>{num(data.volume.trades)}</dd>
                    </div>
                    <div>
                      <dt>Капитализация</dt>
                      <dd>{num(data.index.capitalization, 1)} млрд</dd>
                    </div>
                  </dl>
                </div>
                {chart ? (
                  <svg className={css.chart} viewBox="0 0 600 180" preserveAspectRatio="none" aria-hidden="true" data-draw>
                    <defs>
                      <linearGradient id="sy-area" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#57b6c0" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#57b6c0" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={chart.area} fill="url(#sy-area)" />
                    <path d={chart.line} className={css.line} />
                  </svg>
                ) : null}
              </div>
              <div className={css.termQuotes}>
                <p>Котировки сессии</p>
                <ul>
                  {priced.slice(0, 7).map((item) => (
                    <li key={item.ticker}>
                      <Link href={item.href}>
                        <b>{item.ticker}</b>
                        <span>{num(item.price, 2)}</span>
                        <em className={item.change > 0 ? css.up : item.change < 0 ? css.down : undefined}>{item.change ? pct(item.change) : "0,00%"}</em>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Партнёры. */}
          {data.partners.length ? (
            <section className={css.logos} aria-label="Партнёры биржи">
              <p>Работаем вместе с ведущими институтами рынка</p>
              <ul>
                {data.partners.slice(0, 7).map((p) => (
                  <li key={p.slug}>
                    <Link href={`/about/partners/${p.slug}`} title={p.name}>
                      {p.logo ? <Image src={p.logo} alt={p.mark} width={130} height={44} unoptimized /> : <b>{p.mark}</b>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* 4. Возможности — стеклянная сетка. */}
          <section className={css.features} aria-labelledby="sy-features">
            <h2 id="sy-features" className={css.h2}>
              Вся инфраструктура рынка — <span>в одном месте</span>
            </h2>
            <ul data-stagger>
              {features.map((item) => (
                <li key={item.title}>
                  <Link href={item.href} {...linkProps(item.href)} className={css.feature}>
                    <span className={css.featureIcon}>
                      <Icon name={item.icon} />
                    </span>
                    <b>{item.title}</b>
                    <span>{item.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 5. Цифры. */}
          <section className={css.numbers} aria-label="Рынок в цифрах">
            <dl data-stagger>
              <div>
                <dt>Эмитентов</dt>
                <dd>{num(data.issuers)}</dd>
              </div>
              <div>
                <dt>Бумаг в листинге</dt>
                <dd>{num(data.listed)}</dd>
              </div>
              <div>
                <dt>Капитализация, млрд сом</dt>
                <dd>{num(data.index.capitalization, 1)}</dd>
              </div>
              <div>
                <dt>Лет на рынке</dt>
                <dd>{new Date().getFullYear() - 1994}</dd>
              </div>
            </dl>
          </section>

          {/* 6. Новости как журнал. */}
          <section className={css.log} aria-labelledby="sy-log">
            <div className={css.logHead}>
              <h2 id="sy-log" className={css.h2}>
                Новости
              </h2>
              <Link href="/news">Все новости →</Link>
            </div>
            <ol>
              {news.map((item, i) => (
                <li key={item.slug}>
                  <time>{longDate(item.date)}</time>
                  <Link href={`/news/${item.slug}`} className={css.logItem}>
                    <span className={css.logPhoto}>
                      <Image src={photos[i]} alt="" fill sizes="(max-width: 720px) 100vw, 220px" />
                    </span>
                    <span>
                      <small>{item.tag}</small>
                      <b>{item.title}</b>
                      <span>{item.excerpt}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          {/* 7. Финал. */}
          <section className={css.final} aria-labelledby="sy-final">
            <h2 id="sy-final" className={css.h2}>
              Начните инвестировать <span>сегодня</span>
            </h2>
            <p>Выберите брокера — участника торгов — и откройте счёт.</p>
            <div className={css.heroActions}>
              <Link href="/members" className={css.btnLight}>
                Выбрать брокера
              </Link>
              <Link href="/contacts" className={css.btnGhost}>
                Связаться с биржей →
              </Link>
            </div>
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
            <Link href="/disclosure">Раскрытие</Link>
            <Link href="/documents">Документы</Link>
            <Link href="/about">О бирже</Link>
          </nav>
          <p className={css.legal}>
            {data.contacts.copyright}. {data.contacts.license ? `Лицензия ${data.contacts.license}. ` : ""}Информация на сайте не является инвестиционной рекомендацией.
          </p>
        </footer>
        <ConceptSwitch current="siyanie" />
      </div>
    </ConceptPage>
  );
}
