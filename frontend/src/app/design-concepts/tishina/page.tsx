import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Inter, Lora } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct, steps } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import { pickNewsPhotos } from "../_shared/news-photos";
import css from "./tishina.module.css";

/*
 * Концепция 40 — «Тишина»: спокойный дорогой язык (по мотивам wealthsimple.com) в фирменной бирюзе КФБ.
 * Тёплый кремовый фон, крупная антиква Lora, много воздуха, мягкие фото со скруглёнными углами, разговорный тон,
 * тонкие цифры без рамок. Логотип, тексты и изображения Wealthsimple не используются.
 */
const lora = Lora({ subsets: ["latin", "cyrillic"], weight: ["400", "500"], variable: "--ti-serif" });
const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], variable: "--ti-sans" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "40 · Тишина" };

export default async function TishinaConcept() {
  const data = await loadHomeData();
  const auction = data.auctions[0];
  const news = data.news.slice(0, 3);
  const photos = pickNewsPhotos(news);

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${lora.variable} ${inter.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <Link href="/design-concepts/tishina" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={28} height={26} priority />
            <span>Кыргызская фондовая биржа</span>
          </Link>
          <nav className={css.nav} aria-label="Основное меню">
            <Link href="/members">Инвесторам</Link>
            <Link href="/listing">Компаниям</Link>
            <Link href="/market">Торги</Link>
            <Link href="/about">О бирже</Link>
          </nav>
          <Link href="/members" className={css.headCta}>
            Начать
          </Link>
        </header>

        <main id="main">
          {/* 1. Первый экран. */}
          <section className={css.hero} aria-labelledby="ti-hero">
            <div className={css.heroText}>
              <h1 id="ti-hero" data-intro="rise">
                Спокойные инвестиции в экономику Кыргызстана
              </h1>
              <p data-intro="rise" style={{ "--kc-d": "120ms" } as CSSProperties}>
                Акции, облигации и государственные бумаги — на открытых торгах, по понятным правилам. Без спешки и без лишнего шума.
              </p>
              <div className={css.heroActions} data-intro="rise" style={{ "--kc-d": "200ms" } as CSSProperties}>
                <Link href="/members" className={css.btn}>
                  Начать инвестировать
                </Link>
                <Link href="/market/quotes" className={css.link}>
                  Посмотреть котировки
                </Link>
              </div>
            </div>
            <div className={css.heroPhoto} data-intro="fade" style={{ "--kc-d": "160ms" } as CSSProperties}>
              <Image src="/hero/kse-entrance-garden.jpg" alt="Вход в здание Кыргызской фондовой биржи" fill priority sizes="(max-width: 900px) 100vw, 48vw" />
              <Link href="/market/index" className={css.floatCard}>
                <small>Индекс KSE</small>
                <b>{num(data.index.value, 2)}</b>
                <span className={data.index.change >= 0 ? css.up : css.down}>{pct(data.index.change)} за сессию</span>
              </Link>
            </div>
          </section>

          {/* 2. Почему биржа — три тихих факта. */}
          <section className={css.why} aria-labelledby="ti-why">
            <h2 id="ti-why" className={css.h2}>
              Почему через биржу
            </h2>
            <dl data-stagger>
              <div>
                <dt>{num(data.issuers)}</dt>
                <dd>компаний раскрывают отчётность — её может прочитать каждый.</dd>
              </div>
              <div>
                <dt>{num(data.quotes.total)}</dt>
                <dd>бумаг с ценами последней сессии, сложившимися на открытых торгах.</dd>
              </div>
              <div>
                <dt>1994</dt>
                <dd>год основания биржи. Более трёх десятилетий на рынке страны.</dd>
              </div>
            </dl>
          </section>

          {/* 3. Большое утверждение. */}
          <section className={css.statement} aria-label="Принцип биржи">
            <p data-reveal>Цена каждой бумаги — итог открытых торгов. Итоги каждой сессии мы публикуем для всех.</p>
            <Link href="/market" className={css.link}>
              Итоги торгов {longDate(data.session.date)}
            </Link>
          </section>

          {/* 4. Два спокойных рассказа с фото. */}
          <section className={css.story} aria-labelledby="ti-gcb">
            <div className={css.storyPhoto} data-reveal>
              <Image src="/hub/hub-gcb.jpg" alt="" fill sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
            <div className={css.storyText} data-reveal>
              <p className={css.eyebrow}>Государственные бумаги</p>
              <h2 id="ti-gcb" className={css.h2}>
                Надёжный первый шаг
              </h2>
              <p>
                Министерство финансов размещает государственные ценные бумаги на аукционах биржи.
                {auction ? ` Ближайший аукцион — ${longDate(auction.date)}, объём ${auction.volume}.` : ""}
              </p>
              <Link href="/gcb" className={css.link}>
                Календарь аукционов
              </Link>
            </div>
          </section>

          <section className={css.story} data-flip aria-labelledby="ti-disc">
            <div className={css.storyPhoto} data-reveal>
              <Image src="/hero/issuer-signing.jpg" alt="" fill sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
            <div className={css.storyText} data-reveal>
              <p className={css.eyebrow}>Раскрытие информации</p>
              <h2 id="ti-disc" className={css.h2}>
                Знайте, во что вкладываете
              </h2>
              <p>Компании, чьи бумаги обращаются на бирже, публикуют годовые отчёты и существенные факты. Прочитайте их, прежде чем принимать решение.</p>
              <Link href="/disclosure" className={css.link}>
                Центр раскрытия
              </Link>
            </div>
          </section>

          {/* 5. Шаги. */}
          <section className={css.steps} aria-labelledby="ti-steps">
            <h2 id="ti-steps" className={css.h2}>
              С чего начать
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

          {/* 6. Новости. */}
          <section className={css.news} aria-labelledby="ti-news">
            <div className={css.newsHead}>
              <h2 id="ti-news" className={css.h2}>
                Новости
              </h2>
              <Link href="/news" className={css.link}>
                Все новости
              </Link>
            </div>
            <ul data-stagger>
              {news.map((item, i) => (
                <li key={item.slug}>
                  <Link href={`/news/${item.slug}`}>
                    <span className={css.newsPhoto}>
                      <Image src={photos[i]} alt="" fill sizes="(max-width: 720px) 100vw, 380px" />
                    </span>
                    <time>{longDate(item.date)}</time>
                    <b>{item.title}</b>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 7. Тихий финал. */}
          <section className={css.final} aria-labelledby="ti-final">
            <h2 id="ti-final">Появились вопросы? Мы рядом.</h2>
            <p>
              {data.contacts.phones[0] ?? ""}
              {data.contacts.email ? ` · ${data.contacts.email}` : ""}
            </p>
            <div className={css.heroActions}>
              <Link href="/contacts" className={css.btn}>
                Связаться с биржей
              </Link>
              <Link href={EDU_URL} className={css.link} {...linkProps(EDU_URL)}>
                Учебный центр
              </Link>
            </div>
          </section>
        </main>

        <footer className={css.footer}>
          <nav aria-label="Подвал">
            <Link href="/market">Итоги торгов</Link>
            <Link href="/listing">Листинг</Link>
            <Link href="/disclosure">Раскрытие</Link>
            <Link href="/documents">Документы</Link>
            <Link href="/about">О бирже</Link>
          </nav>
          <p>
            {data.contacts.copyright}. {data.contacts.address}. {data.contacts.license ? `Лицензия ${data.contacts.license}. ` : ""}Информация на сайте не является инвестиционной
            рекомендацией.
          </p>
        </footer>
        <ConceptSwitch current="tishina" />
      </div>
    </ConceptPage>
  );
}
