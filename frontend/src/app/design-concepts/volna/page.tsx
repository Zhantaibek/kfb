import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Inter } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct, steps } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import { Icon, type IconName } from "../_shared/Icon";
import { pickNewsPhotos } from "../_shared/news-photos";
import css from "./volna.module.css";

/*
 * Концепция 32 — «Волна»: визуальный язык крупных финтех-платформ (по мотивам stripe.com) — диагональная
 * анимированная градиентная волна на первом экране, плавающие «окна продукта» на реальных данных (бумага, индекс,
 * аукцион ГЦБ), лента партнёров, карточки с макетами интерфейса, тёмно-синий блок с цифрами рынка, градиентный финал.
 * Логотип, тексты и изображения Stripe не используются — наполнение реальные данные КФБ.
 */
const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--vl-font" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "32 · Волна" };

/** Иконки шагов инвестора: брокер, обучение, выбор бумаг, заявка. */
const stepIcons: IconName[] = ["users", "book", "chart", "file"];
export default async function VolnaConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const top = priced[0];
  const chart = smoothPath(data.history, 320, 110, 8);
  const auction = data.auctions[0];
  const first = data.indexSeries[0];
  const news = data.news.slice(0, 3);
  const photos = pickNewsPhotos(news);

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${inter.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        {/* Волна: под шапкой и первым экраном, срезана по диагонали. */}
        <div className={css.wave} aria-hidden="true">
          <span />
        </div>

        <header className={css.header}>
          <Link href="/design-concepts/volna" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={30} height={28} priority />
            <span>КФБ</span>
          </Link>
          <nav className={css.nav} aria-label="Основное меню">
            <Link href="/market">Торги</Link>
            <Link href="/listing">Эмитентам</Link>
            <Link href="/members">Инвесторам</Link>
            <Link href="/gcb">ГЦБ</Link>
            <Link href="/disclosure">Раскрытие</Link>
            <Link href="/about">О бирже</Link>
          </nav>
          <Link href="/contacts" className={css.headLink}>
            Контакты
          </Link>
          <Link href="/members" className={css.headCta}>
            Начать →
          </Link>
        </header>

        <main id="main">
          {/* 1. Первый экран. */}
          <section className={css.hero} aria-labelledby="vl-hero">
            <div className={css.heroText}>
              <p className={css.pill} data-intro="fade">
                <span>Новое</span> Аукцион ГЦБ {auction ? auction.date : "в календаре"} →
              </p>
              <h1 id="vl-hero" data-intro="rise" style={{ "--kc-d": "80ms" } as CSSProperties}>
                Инфраструктура рынка капитала Кыргызстана
              </h1>
              <p className={css.lead} data-intro="rise" style={{ "--kc-d": "160ms" } as CSSProperties}>
                Торги акциями, облигациями и государственными ценными бумагами, листинг и раскрытие информации — для {num(data.issuers)} эмитентов и тысяч инвесторов.
              </p>
              <div className={css.heroActions} data-intro="rise" style={{ "--kc-d": "240ms" } as CSSProperties}>
                <Link href="/members" className={css.btnDark}>
                  Начать инвестировать →
                </Link>
                <Link href="/listing" className={css.btnText}>
                  Привлечь капитал →
                </Link>
              </div>
            </div>

            {/* Плавающие окна продукта на реальных данных. */}
            <div className={css.stage} data-intro="rise" style={{ "--kc-d": "200ms" } as CSSProperties}>
              <Link href="/market/index" className={`${css.window} ${css.indexWin}`}>
                <span className={css.winBar}>
                  <i />
                  <i />
                  <i />
                  <small>Индекс KSE</small>
                </span>
                <span className={css.winBody}>
                  <b className={css.big}>{num(data.index.value, 2)}</b>
                  <small className={data.index.change >= 0 ? css.up : css.down}>{pct(data.index.change)} за сессию</small>
                  {chart ? (
                    <svg viewBox="0 0 320 110" preserveAspectRatio="none" aria-hidden="true" data-draw>
                      <defs>
                        <linearGradient id="vl-area" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#57b6c0" stopOpacity="0.32" />
                          <stop offset="100%" stopColor="#57b6c0" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={chart.area} fill="url(#vl-area)" />
                      <path d={chart.line} className={css.line} />
                    </svg>
                  ) : null}
                  <small className={css.muted}>
                    {first ? `${first.date} — ` : ""}
                    {longDate(data.session.date)}
                  </small>
                </span>
              </Link>

              {top ? (
                <Link href={top.href} className={`${css.window} ${css.ticketWin}`}>
                  <span className={css.ticketHead}>
                    <span className={css.ticker}>{top.ticker.slice(0, 2)}</span>
                    <span>
                      <b>{top.ticker}</b>
                      <small>{top.name}</small>
                    </span>
                  </span>
                  <span className={css.ticketRow}>
                    <small>Цена</small>
                    <b>{num(top.price, 2)} сом</b>
                  </span>
                  <span className={css.ticketRow}>
                    <small>Объём сессии</small>
                    <b>{num(top.volume, 1)}</b>
                  </span>
                  <span className={css.ticketBtn}>Купить через брокера</span>
                </Link>
              ) : null}

              {auction ? (
                <Link href="/gcb" className={`${css.window} ${css.auctionWin}`}>
                  <small>Аукцион ГЦБ · {auction.status}</small>
                  <b>{auction.type}</b>
                  <span>
                    {auction.date} · {auction.volume}
                  </span>
                </Link>
              ) : null}
            </div>
          </section>

          {/* 2. Партнёры. */}
          {data.partners.length ? (
            <section className={css.logos} aria-label="Партнёры биржи">
              <ul>
                {data.partners.slice(0, 8).map((p) => (
                  <li key={p.slug}>
                    <Link href={`/about/partners/${p.slug}`} title={p.name}>
                      {p.logo ? <Image src={p.logo} alt={p.mark} width={140} height={48} unoptimized /> : <b>{p.mark}</b>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* 3. Продукты биржи с макетами интерфейса. */}
          <section className={css.products} aria-labelledby="vl-products">
            <p className={css.eyebrow}>Платформа</p>
            <h2 id="vl-products" className={css.h2}>
              Всё, что нужно рынку ценных бумаг
            </h2>
            <p className={css.sub}>Торги, раскрытие информации и государственные займы работают на одной инфраструктуре — открыто и по единым правилам.</p>

            <div className={css.cards} data-stagger>
              <Link href="/market/quotes" className={css.card}>
                <span className={css.cardTag} data-tone="violet">
                  Торги
                </span>
                <b>Котировки и итоги сессий</b>
                <span>Цены, объёмы и число сделок по каждой бумаге.</span>
                <span className={css.mock}>
                  {priced.slice(0, 4).map((item) => (
                    <span key={item.ticker} className={css.mockRow}>
                      <b>{item.ticker}</b>
                      <span>{num(item.price, 2)}</span>
                      <em className={item.change > 0 ? css.up : item.change < 0 ? css.down : undefined}>{item.change ? pct(item.change) : "0,00%"}</em>
                    </span>
                  ))}
                </span>
              </Link>

              <Link href="/disclosure" className={css.card}>
                <span className={css.cardTag} data-tone="pink">
                  Раскрытие
                </span>
                <b>Отчётность эмитентов</b>
                <span>Отчёты и существенные факты {num(data.issuers)} компаний.</span>
                <span className={css.mock}>
                  {data.companyNews.slice(0, 3).map((item) => (
                    <span key={item.slug} className={css.mockNews}>
                      <i aria-hidden="true" />
                      <span>
                        <small>{item.company}</small>
                        {item.title}
                      </span>
                    </span>
                  ))}
                </span>
              </Link>

              <Link href="/gcb" className={css.card}>
                <span className={css.cardTag} data-tone="amber">
                  ГЦБ
                </span>
                <b>Аукционы государственных бумаг</b>
                <span>Размещение бумаг Министерства финансов.</span>
                <span className={css.mock}>
                  {data.auctions.slice(0, 3).map((item) => (
                    <span key={`${item.date}-${item.type}`} className={css.mockRow}>
                      <b>{item.date}</b>
                      <span>{item.volume}</span>
                      <em>{item.status}</em>
                    </span>
                  ))}
                </span>
              </Link>
            </div>
          </section>

          {/* 4. Тёмный блок с цифрами. */}
          <section className={css.dark} aria-labelledby="vl-numbers">
            <div className={css.darkInner}>
              <p className={css.eyebrowLight}>Рынок в цифрах</p>
              <h2 id="vl-numbers" className={css.h2}>
                Биржа, которой доверяют эмитенты и инвесторы
              </h2>
              <dl className={css.numbers} data-stagger>
                <div>
                  <dt>Индекс KSE</dt>
                  <dd>{num(data.index.value, 0)}</dd>
                </div>
                <div>
                  <dt>Капитализация, млрд сом</dt>
                  <dd>{num(data.index.capitalization, 1)}</dd>
                </div>
                <div>
                  <dt>Эмитентов раскрывают отчётность</dt>
                  <dd>{num(data.issuers)}</dd>
                </div>
                <div>
                  <dt>Бумаг в официальном списке</dt>
                  <dd>{num(data.listed)}</dd>
                </div>
                <div>
                  <dt>Объём сессии, млн сом</dt>
                  <dd>{num(data.volume.volumeMln, 1)}</dd>
                </div>
                <div>
                  <dt>Год основания</dt>
                  <dd>1994</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* 5. Путь инвестора: слева заголовок и действия, справа лента шагов с примерами на реальных данных. */}
          <section className={css.path} aria-labelledby="vl-path">
            <div className={css.pathIntro}>
              <p className={css.eyebrow}>Инвесторам</p>
              <h2 id="vl-path" className={css.h2}>
                От первого шага до первой сделки
              </h2>
              <p className={css.sub}>Четыре шага — и вы владелец ценных бумаг компаний Кыргызстана. Сделку проводит лицензированный брокер, биржа обеспечивает честные торги.</p>
              <div className={css.pathActions}>
                <Link href="/members" className={css.btnDark}>
                  Выбрать брокера →
                </Link>
                <Link href={EDU_URL} className={css.btnText} {...linkProps(EDU_URL)}>
                  Курсы учебного центра →
                </Link>
              </div>
            </div>

            <ol className={css.steps} data-stagger>
              {steps.map((step, i) => (
                <li key={step.title}>
                  <Link href={step.href} {...linkProps(step.href)} className={css.step}>
                    <span className={css.stepIcon}>
                      <Icon name={stepIcons[i] ?? "arrowRight"} />
                    </span>
                    <span className={css.stepBody}>
                      <small>Шаг {i + 1}</small>
                      <b>{step.title}</b>
                      <span>{step.text}</span>
                      {i === 2 && top ? (
                        <span className={css.stepExample}>
                          <em>Например</em>
                          <strong>{top.ticker}</strong> {top.name} — {num(top.price, 2)} сом
                        </span>
                      ) : null}
                      {i === 3 && top ? (
                        <span className={css.stepExample}>
                          <em>Пример поручения</em>
                          Купить <strong>{top.ticker}</strong> по цене до {num(top.price, 2)} сом на ближайшей сессии
                        </span>
                      ) : null}
                    </span>
                    <span className={css.stepGo} aria-hidden="true">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          {/* 6. Новости. */}
          <section className={css.news} aria-labelledby="vl-news">
            <div className={css.newsHead}>
              <h2 id="vl-news" className={css.h2}>
                Новости
              </h2>
              <Link href="/news">Все новости →</Link>
            </div>
            <ul data-stagger>
              {news.map((item, i) => (
                <li key={item.slug}>
                  <Link href={`/news/${item.slug}`}>
                    <span className={css.newsPhoto}>
                      <Image src={photos[i]} alt="" fill sizes="(max-width: 720px) 100vw, 360px" />
                    </span>
                    <small>
                      {item.tag} · {longDate(item.date)}
                    </small>
                    <b>{item.title}</b>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 7. Финал. */}
          <section className={css.final} aria-labelledby="vl-final">
            <div className={css.finalInner}>
              <div>
                <h2 id="vl-final">Готовы начать?</h2>
                <p>Выберите брокера и откройте счёт — или узнайте, как компании выйти на биржу.</p>
              </div>
              <div className={css.finalActions}>
                <Link href="/members" className={css.btnDark}>
                  Выбрать брокера →
                </Link>
                <Link href="/contacts" className={css.btnWhite}>
                  Связаться с биржей
                </Link>
              </div>
            </div>
          </section>
        </main>

        <footer className={css.footer}>
          <div className={css.footBrand}>
            <Image src="/brand/kse-mark.png" alt="" width={30} height={28} />
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
          <nav aria-label="Биржа">
            <b>Биржа</b>
            <Link href="/about">О бирже</Link>
            <Link href="/news">Новости</Link>
            <Link href="/members">Участники торгов</Link>
            <Link href={EDU_URL} {...linkProps(EDU_URL)}>
              Учебный центр
            </Link>
          </nav>
          <p className={css.legal}>
            {data.contacts.copyright}. {data.contacts.license ? `Лицензия ${data.contacts.license}. ` : ""}Информация на сайте не является инвестиционной рекомендацией.
          </p>
        </footer>
        <ConceptSwitch current="volna" />
      </div>
    </ConceptPage>
  );
}
