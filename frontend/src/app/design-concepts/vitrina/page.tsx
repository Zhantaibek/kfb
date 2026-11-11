import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Inter_Tight } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import { pickNewsPhotos } from "../_shared/news-photos";
import css from "./vitrina.module.css";

/*
 * Концепция 34 — «Витрина»: презентационный язык (по мотивам apple.com) в фирменной бирюзе КФБ. Белый фон, огромные
 * центрированные заголовки, по одной мысли на экран, полноэкранные фото биржи и Бишкека, плитки 2×2 с фото,
 * чёрный экран с крупной цифрой, ссылки «Подробнее ›». Логотип, тексты и изображения Apple не используются.
 */
const tight = Inter_Tight({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--vt-font" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "34 · Витрина" };

export default async function VitrinaConcept() {
  const data = await loadHomeData();
  const chart = smoothPath(data.history, 500, 160, 10);
  const auction = data.auctions[0];
  const news = data.news.slice(0, 3);
  const photos = pickNewsPhotos(news);

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${tight.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <nav className={css.nav} aria-label="Основное меню">
            <Link href="/design-concepts/vitrina" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={22} height={20} priority />
            </Link>
            <Link href="/market">Торги</Link>
            <Link href="/market/quotes">Котировки</Link>
            <Link href="/listing">Листинг</Link>
            <Link href="/gcb">ГЦБ</Link>
            <Link href="/disclosure">Раскрытие</Link>
            <Link href="/news">Новости</Link>
            <Link href="/about">О бирже</Link>
            <Link href="/contacts">Контакты</Link>
          </nav>
        </header>

        <main id="main">
          {/* 1. Первый экран. */}
          <section className={css.hero} aria-labelledby="vt-hero">
            <p className={css.eyebrow} data-intro="fade">
              Кыргызская фондовая биржа
            </p>
            <h1 id="vt-hero" data-intro="rise" style={{ "--kc-d": "80ms" } as CSSProperties}>
              Рынок, открытый каждому.
            </h1>
            <p className={css.lead} data-intro="rise" style={{ "--kc-d": "160ms" } as CSSProperties}>
              Акции, облигации и государственные ценные бумаги Кыргызстана. Честные торги с 1994 года.
            </p>
            <p className={css.links} data-intro="rise" style={{ "--kc-d": "220ms" } as CSSProperties}>
              <Link href="/members" className={css.btn}>
                Начать инвестировать
              </Link>
              <Link href="/market/quotes" className={css.more}>
                Котировки
              </Link>
            </p>
            <div className={css.heroPhoto} data-intro="zoom" style={{ "--kc-d": "260ms" } as CSSProperties}>
              <Image src="/hero/kse-entrance-garden.jpg" alt="Вход в здание Кыргызской фондовой биржи" fill priority sizes="(max-width: 1200px) 100vw, 1200px" />
            </div>
          </section>

          {/* 2. Чёрный экран с крупной цифрой. */}
          <section className={css.black} aria-labelledby="vt-num">
            <p className={css.eyebrowDark} data-reveal>
              Раскрытие информации
            </p>
            <h2 id="vt-num" className={css.giant} data-reveal>
              {num(data.issuers)}
            </h2>
            <p className={css.giantText} data-reveal>
              компаний публикуют отчётность на бирже. Всё — в открытом доступе.
            </p>
            <dl className={css.facts} data-stagger>
              <div>
                <dd>{num(data.listed)}</dd>
                <dt>бумаг в официальном списке</dt>
              </div>
              <div>
                <dd>{num(data.index.capitalization, 1)}</dd>
                <dt>млрд сом — капитализация рынка</dt>
              </div>
              <div>
                <dd>{num(data.index.value, 0)}</dd>
                <dt>пунктов — индекс KSE</dt>
              </div>
            </dl>
            <Link href="/disclosure" className={css.moreDark}>
              Центр раскрытия информации
            </Link>
          </section>

          {/* 3. Плитки 2×2. */}
          <section className={css.tiles} aria-label="Разделы биржи">
            <Link href="/market/index" className={`${css.tile} ${css.tileChart}`}>
              <span className={css.tileText}>
                <b>Индекс KSE</b>
                <span>
                  {num(data.index.value, 2)} · {pct(data.index.change)}
                </span>
                <em>Подробнее</em>
              </span>
              {chart ? (
                <svg viewBox="0 0 500 160" preserveAspectRatio="none" aria-hidden="true" data-draw>
                  <defs>
                    <linearGradient id="vt-area" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#57b6c0" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#57b6c0" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={chart.area} fill="url(#vt-area)" />
                  <path d={chart.line} className={css.line} />
                </svg>
              ) : null}
            </Link>

            <Link href="/gcb" className={`${css.tile} ${css.tilePhoto}`}>
              <Image src="/hub/hub-gcb.jpg" alt="" fill sizes="(max-width: 800px) 100vw, 50vw" />
              <span className={css.tileText}>
                <b>Аукционы ГЦБ</b>
                <span>{auction ? `Ближайший — ${auction.date}, ${auction.volume}` : "Государственные бумаги Министерства финансов"}</span>
                <em>Календарь</em>
              </span>
            </Link>

            <Link href="/listing" className={`${css.tile} ${css.tilePhoto}`}>
              <Image src="/hub/hub-listing.jpg" alt="" fill sizes="(max-width: 800px) 100vw, 50vw" />
              <span className={css.tileText}>
                <b>Листинг</b>
                <span>Привлеките капитал инвесторов через биржу.</span>
                <em>Условия</em>
              </span>
            </Link>

            <Link href={EDU_URL} className={`${css.tile} ${css.tilePhoto}`} {...linkProps(EDU_URL)}>
              <Image src="/hub/hub-education.jpg" alt="" fill sizes="(max-width: 800px) 100vw, 50vw" />
              <span className={css.tileText}>
                <b>Учебный центр</b>
                <span>Курсы и семинары по рынку ценных бумаг.</span>
                <em>Программы</em>
              </span>
            </Link>
          </section>

          {/* 4. Полноэкранное фото с текстом. */}
          <section className={css.full} aria-labelledby="vt-full">
            <Image src="/hero/bishkek-ala-too.jpg" alt="Бишкек на фоне хребта Ала-Тоо" fill sizes="100vw" />
            <div className={css.fullText} data-reveal>
              <h2 id="vt-full">Капитал для экономики Кыргызстана.</h2>
              <p>Компании привлекают инвестиции, люди становятся совладельцами бизнеса — по единым и прозрачным правилам.</p>
              <Link href="/about" className={css.moreLight}>
                О бирже
              </Link>
            </div>
          </section>

          {/* 5. Новости. */}
          <section className={css.news} aria-labelledby="vt-news">
            <h2 id="vt-news" className={css.h2}>
              Новости
            </h2>
            <ul data-stagger>
              {news.map((item, i) => (
                <li key={item.slug}>
                  <Link href={`/news/${item.slug}`}>
                    <span className={css.newsPhoto}>
                      <Image src={photos[i]} alt="" fill sizes="(max-width: 720px) 100vw, 380px" />
                    </span>
                    <span className={css.newsText}>
                      <small>{item.tag}</small>
                      <b>{item.title}</b>
                      <time>{longDate(item.date)}</time>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className={css.newsMore}>
              <Link href="/news" className={css.more}>
                Все новости
              </Link>
            </p>
          </section>
        </main>

        <footer className={css.footer}>
          <p className={css.footNote}>Информация на сайте не является инвестиционной рекомендацией. Цены и данные — по итогам торговых сессий биржи.</p>
          <div className={css.footCols}>
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
            <nav aria-label="Инвесторам">
              <b>Инвесторам</b>
              <Link href="/members">Участники торгов</Link>
              <Link href={EDU_URL} {...linkProps(EDU_URL)}>
                Учебный центр
              </Link>
            </nav>
            <nav aria-label="Биржа">
              <b>Биржа</b>
              <Link href="/about">О бирже</Link>
              <Link href="/news">Новости</Link>
              <Link href="/contacts">Контакты</Link>
            </nav>
          </div>
          <p className={css.copy}>
            {data.contacts.copyright}. {data.contacts.address}. {data.contacts.phones[0] ?? ""}
          </p>
        </footer>
        <ConceptSwitch current="vitrina" />
      </div>
    </ConceptPage>
  );
}
