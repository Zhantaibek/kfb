import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { longDate, nav, num, pct } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import { Icon } from "../_shared/Icon";
import { pickNewsPhotos } from "../_shared/news-photos";
import css from "./korporativnyi.module.css";

/*
 * Концепция 49 — «Корпоративный»: по мотивам сайтов ICE и UBS. Премиальная подача: первый экран — тёмная бирюза
 * с крупным заявлением и фото здания биржи справа, внизу строка рынка; затем три направления крупными блоками
 * «фото + текст» с чередованием сторон, полоса цифр, цитата-миссия, новости с большими фото и бирюзовый призыв.
 * Много воздуха, тонкие линии, сдержанные анимации. Цвета и шрифты основного сайта.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "49 · Корпоративный" };

const directions = [
  {
    n: "01",
    title: "Торги ценными бумагами",
    text: "Организованные торги акциями, облигациями и драгоценными металлами. Цена складывается из заявок участников на открытой торговой сессии, итоги публикуются каждый день.",
    href: "/market",
    link: "Итоги торгов",
    photo: "/hero/market-charts.jpg",
  },
  {
    n: "02",
    title: "Листинг и раскрытие информации",
    text: "Компании выходят на биржу, чтобы привлечь капитал. Биржа ведёт официальный список ценных бумаг и публикует отчёты эмитентов для всех участников рынка.",
    href: "/listing",
    link: "Условия листинга",
    photo: "/hero/issuer-signing.jpg",
  },
  {
    n: "03",
    title: "Государственные ценные бумаги",
    text: "Аукционы по размещению казначейских векселей и облигаций Министерства финансов — один из самых надёжных инструментов на рынке Кыргызстана.",
    href: "/gcb",
    link: "Календарь аукционов",
    photo: "/hub/hub-gcb.jpg",
  },
];

export default async function KorporativnyiConcept() {
  const data = await loadHomeData();
  const news = data.news.slice(0, 3);
  const photos = pickNewsPhotos(news);
  const volumeK = data.volume.volumeMln < 1;

  return (
    <ConceptPage accent="#57b6c0">
      <div className={css.page}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <main id="main">
          {/* Первый экран: шапка поверх тёмного фона, крупное заявление, фото справа, строка рынка. */}
          <section className={css.hero} aria-labelledby="kp-hero">
            <header className={css.header}>
              <Link href="/design-concepts/korporativnyi" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
                <Image src="/brand/kse-mark.png" alt="" width={38} height={36} priority />
                <span>Кыргызская фондовая биржа</span>
              </Link>
              <nav className={css.nav} aria-label="Основное меню">
                {nav.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <Link href="/contacts" className={css.headBtn}>
                Связаться
              </Link>
            </header>

            <div className={css.heroPhoto} aria-hidden="true">
              <Image src="/hero/kse-entrance-garden.jpg" alt="" fill priority sizes="(max-width: 900px) 100vw, 50vw" />
            </div>

            <div className={css.heroText}>
              <p className={css.eyebrow} data-intro="fade">
                С 1994 года
              </p>
              <h1 id="kp-hero" data-intro="rise">
                Мы строим рынок капитала Кыргызстана
              </h1>
              <p className={css.heroLead} data-intro="fade" style={{ "--kc-d": "160ms" } as CSSProperties}>
                Инфраструктура для инвесторов, компаний и государства: прозрачные торги, листинг и раскрытие информации.
              </p>
              <div className={css.heroActions} data-intro="fade" style={{ "--kc-d": "260ms" } as CSSProperties}>
                <Link href="/about" className={css.btnLight}>
                  О бирже
                </Link>
                <Link href="/market" className={css.btnLine}>
                  Рынок сегодня <Icon name="arrowRight" />
                </Link>
              </div>
            </div>

            <dl className={css.ticker}>
              <div>
                <dt>Индекс KSE</dt>
                <dd>
                  {num(data.index.value, 2)}
                  <small data-up={data.index.change > 0 || undefined} data-down={data.index.change < 0 || undefined}>
                    {pct(data.index.change)}
                  </small>
                </dd>
              </div>
              <div>
                <dt>Объём торгов</dt>
                <dd>
                  {volumeK ? num(data.volume.volumeMln * 1000) : num(data.volume.volumeMln, 1)} <small>{volumeK ? "тыс. сом" : "млн сом"}</small>
                </dd>
              </div>
              <div>
                <dt>Капитализация</dt>
                <dd>
                  {num(data.index.capitalization, 1)} <small>млрд сом</small>
                </dd>
              </div>
              <div>
                <dt>Сессия</dt>
                <dd>
                  {data.session.label} <small>{data.session.hours}</small>
                </dd>
              </div>
            </dl>
          </section>

          {/* Направления: фото и текст с чередованием сторон. */}
          <section className={css.directions} aria-labelledby="kp-dir">
            <div className={css.wrap}>
              <p className={css.eyebrowDark}>Что мы делаем</p>
              <h2 id="kp-dir" className={css.sectionTitle}>
                Три направления — один открытый рынок
              </h2>
            </div>
            {directions.map((item, i) => (
              <article key={item.n} className={css.direction} data-flip={i % 2 === 1 || undefined}>
                <div className={css.dirPhoto} data-reveal="fade">
                  <Image src={item.photo} alt="" fill sizes="(max-width: 900px) 100vw, 50vw" />
                </div>
                <div className={css.dirText} data-reveal="rise">
                  <span className={css.dirNum}>{item.n}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <Link href={item.href} className={css.textLink}>
                    {item.link} <Icon name="arrowRight" />
                  </Link>
                </div>
              </article>
            ))}
          </section>

          {/* Полоса цифр. */}
          <section className={css.numbers} aria-label="Биржа в цифрах">
            <div className={css.wrap}>
              <dl data-stagger="">
                <div>
                  <dt>Год основания</dt>
                  <dd>1994</dd>
                </div>
                <div>
                  <dt>Эмитентов</dt>
                  <dd>{num(data.issuers)}</dd>
                </div>
                <div>
                  <dt>Бумаг в листинге</dt>
                  <dd>{num(data.listed)}</dd>
                </div>
                <div>
                  <dt>Инструментов в торгах</dt>
                  <dd>{num(data.quotes.total)}</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Цитата-миссия. */}
          <section className={css.mission} aria-label="Миссия">
            <div className={css.wrap}>
              <blockquote data-reveal="rise">
                <p>«{data.tagline || "Рынок ценных бумаг Кыргызстана. Котировки, итоги торгов и отчёты эмитентов — в одном месте."}»</p>
                <footer>Кыргызская фондовая биржа</footer>
              </blockquote>
            </div>
          </section>

          {/* Новости. */}
          {news.length ? (
            <section className={css.wrap} aria-labelledby="kp-news">
              <div className={css.newsHead}>
                <div>
                  <p className={css.eyebrowDark}>Новости</p>
                  <h2 id="kp-news" className={css.sectionTitle}>
                    События биржи
                  </h2>
                </div>
                <Link href="/news" className={css.textLink}>
                  Все новости <Icon name="arrowRight" />
                </Link>
              </div>
              <div className={css.news} data-stagger="">
                {news.map((item, i) => (
                  <Link key={item.slug} href={`/news/${item.slug}`} className={css.newsCard}>
                    <span className={css.newsPhoto}>
                      <Image src={photos[i]} alt="" fill sizes="(max-width: 900px) 100vw, 400px" />
                    </span>
                    <span className={css.newsMeta}>
                      {item.tag ? <em>{item.tag}</em> : null}
                      <time>{longDate(item.date)}</time>
                    </span>
                    <b>{item.title}</b>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* Призыв. */}
          <section className={css.cta} aria-labelledby="kp-cta">
            <div className={`${css.wrap} ${css.ctaInner}`} data-reveal="rise">
              <h2 id="kp-cta">Станьте частью рынка капитала</h2>
              <div>
                <Link href="/investors" className={css.btnDark}>
                  Инвесторам
                </Link>
                <Link href="/listing" className={css.btnDarkLine}>
                  Компаниям
                </Link>
              </div>
            </div>
          </section>
        </main>

        <footer className={css.footer}>
          <div className={`${css.wrap} ${css.footInner}`}>
            <div className={css.footBrand}>
              <Image src="/brand/kse-mark.png" alt="" width={40} height={38} />
              <p>{data.contacts.address}</p>
              <p>{data.contacts.phones.join(" · ")}</p>
              {data.contacts.email ? <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a> : null}
            </div>
            <div>
              <h3>Рынок</h3>
              <Link href="/market">Итоги торгов</Link>
              <Link href="/market/quotes">Котировки</Link>
              <Link href="/market/index">Индекс KSE</Link>
              <Link href="/gcb">ГЦБ</Link>
            </div>
            <div>
              <h3>Компаниям</h3>
              <Link href="/listing">Листинг</Link>
              <Link href="/disclosure">Раскрытие информации</Link>
              <Link href="/documents">Документы</Link>
            </div>
            <div>
              <h3>Биржа</h3>
              <Link href="/about">О бирже</Link>
              <Link href="/members">Участники торгов</Link>
              <Link href="/news">Новости</Link>
              <Link href="/contacts">Контакты</Link>
            </div>
          </div>
          <p className={`${css.wrap} ${css.legal}`}>
            {data.contacts.copyright}. {data.contacts.license ? `Лицензия ${data.contacts.license}.` : ""}
          </p>
        </footer>

        <ConceptSwitch current="korporativnyi" />
      </div>
    </ConceptPage>
  );
}
