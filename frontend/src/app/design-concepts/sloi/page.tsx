import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Rubik } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct, steps } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import css from "./sloi.module.css";

/*
 * Концепция 38 — «Слои»: смелый продуктовый язык финтехов (по мотивам revolut.com) в фирменной бирюзе КФБ.
 * Огромная жирная типографика, полноэкранные цветные слои — белый, бирюзовый, тёмный, мятный — и макет телефона
 * с мобильной версией котировок КФБ на реальных данных. Логотип, тексты и изображения Revolut не используются.
 */
const rubik = Rubik({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"], variable: "--sl-font" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "38 · Слои" };

export default async function SloiConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const chart = smoothPath(data.history, 240, 70, 6);

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${rubik.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <Link href="/design-concepts/sloi" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={30} height={28} priority />
            <span>КФБ</span>
          </Link>
          <nav className={css.nav} aria-label="Основное меню">
            <Link href="/members">Инвесторам</Link>
            <Link href="/listing">Компаниям</Link>
            <Link href="/market">Торги</Link>
            <Link href="/gcb">ГЦБ</Link>
            <Link href="/about">О бирже</Link>
          </nav>
          <Link href="/members" className={css.headCta}>
            Начать
          </Link>
        </header>

        <main id="main">
          {/* 1. Первый экран: огромный заголовок и телефон. */}
          <section className={css.hero} aria-labelledby="sl-hero">
            <div className={css.heroText}>
              <h1 id="sl-hero" data-intro="rise">
                Рынок ценных бумаг.
                <span>Для каждого.</span>
              </h1>
              <p data-intro="rise" style={{ "--kc-d": "120ms" } as CSSProperties}>
                Акции, облигации и ГЦБ Кыргызстана — по честным ценам открытых торгов. Котировки и отчётность компаний всегда под рукой.
              </p>
              <div className={css.heroActions} data-intro="rise" style={{ "--kc-d": "200ms" } as CSSProperties}>
                <Link href="/members" className={css.btnDark}>
                  Начать инвестировать
                </Link>
                <Link href="/market/quotes" className={css.btnSoft}>
                  Котировки
                </Link>
              </div>
            </div>

            {/* Макет телефона: мобильная версия котировок КФБ. */}
            <div className={css.phoneWrap} data-intro="rise" style={{ "--kc-d": "160ms" } as CSSProperties}>
              <div className={css.phone} aria-label="Мобильная версия котировок КФБ">
                <span className={css.notch} aria-hidden="true" />
                <div className={css.screen}>
                  <p className={css.screenTop}>
                    <b>Котировки</b>
                    <span data-open={data.session.open || undefined}>{data.session.label}</span>
                  </p>
                  <Link href="/market/index" className={css.screenIndex}>
                    <small>Индекс KSE</small>
                    <b>{num(data.index.value, 2)}</b>
                    <span className={data.index.change >= 0 ? css.up : css.down}>{pct(data.index.change)}</span>
                    {chart ? (
                      <svg viewBox="0 0 240 70" preserveAspectRatio="none" aria-hidden="true">
                        <path d={chart.line} />
                      </svg>
                    ) : null}
                  </Link>
                  <ul>
                    {priced.slice(0, 5).map((item) => (
                      <li key={item.ticker}>
                        <Link href={item.href}>
                          <span className={css.avatar}>{item.ticker.slice(0, 2)}</span>
                          <span className={css.paper}>
                            <b>{item.ticker}</b>
                            <small>{item.name}</small>
                          </span>
                          <span className={css.price}>
                            <b>{num(item.price, 2)}</b>
                            <small>сом</small>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Бирюзовый слой: открытые цены. */}
          <section className={`${css.layer} ${css.teal}`} aria-labelledby="sl-open">
            <div className={css.layerInner}>
              <div>
                <h2 id="sl-open" className={css.big}>
                  Никаких скрытых цен.
                </h2>
                <p>Цена каждой бумаги — итог открытых торгов. Итоги каждой сессии публикуются для всех.</p>
                <Link href="/market" className={css.btnLight}>
                  Итоги торгов
                </Link>
              </div>
              <dl className={css.stats} data-stagger>
                <div>
                  <dd>{num(data.volume.volumeMln, 1)}</dd>
                  <dt>млн сом — объём сессии {longDate(data.session.date)}</dt>
                </div>
                <div>
                  <dd>{num(data.quotes.total)}</dd>
                  <dt>бумаг с котировками</dt>
                </div>
                <div>
                  <dd>{num(data.index.capitalization, 1)}</dd>
                  <dt>млрд сом — капитализация рынка</dt>
                </div>
              </dl>
            </div>
          </section>

          {/* 3. Тёмный слой: ГЦБ. */}
          <section className={`${css.layer} ${css.dark}`} aria-labelledby="sl-gcb">
            <div className={css.layerInner}>
              <div>
                <h2 id="sl-gcb" className={css.big}>
                  Государственные бумаги. Надёжно.
                </h2>
                <p>Министерство финансов размещает ГЦБ на аукционах биржи. Купить их можно через брокера.</p>
                <Link href="/gcb" className={css.btnLight}>
                  Календарь аукционов
                </Link>
              </div>
              <ul className={css.auctions} data-stagger>
                {data.auctions.slice(0, 3).map((item) => (
                  <li key={`${item.date}-${item.type}`}>
                    <small>{item.status}</small>
                    <b>{item.date}</b>
                    <span>
                      {item.type} · {item.volume}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 4. Мятный слой: раскрытие. */}
          <section className={`${css.layer} ${css.mint}`} aria-labelledby="sl-disc">
            <div className={css.layerInner}>
              <div>
                <h2 id="sl-disc" className={css.big}>
                  {num(data.issuers)} компаний. Всё открыто.
                </h2>
                <p>Эмитенты публикуют отчёты и существенные факты. Читайте, прежде чем инвестировать.</p>
                <Link href="/disclosure" className={css.btnDark}>
                  Центр раскрытия
                </Link>
              </div>
              <ul className={css.reports} data-stagger>
                {data.companyNews.slice(0, 3).map((item) => (
                  <li key={item.slug}>
                    <Link href={`/news/${item.slug}`}>
                      <small>
                        {item.company} · {item.date}
                      </small>
                      <b>{item.title}</b>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 5. Шаги. */}
          <section className={css.stepsLayer} aria-labelledby="sl-steps">
            <h2 id="sl-steps" className={css.big}>
              Четыре шага до первой сделки
            </h2>
            <ol data-stagger>
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
            <Link href={EDU_URL} {...linkProps(EDU_URL)}>
              Учебный центр
            </Link>
            <Link href="/contacts">Контакты</Link>
          </nav>
          <p className={css.legal}>
            {data.contacts.copyright}. {data.contacts.license ? `Лицензия ${data.contacts.license}. ` : ""}Информация на сайте не является инвестиционной рекомендацией.
          </p>
        </footer>
        <ConceptSwitch current="sloi" />
      </div>
    </ConceptPage>
  );
}
