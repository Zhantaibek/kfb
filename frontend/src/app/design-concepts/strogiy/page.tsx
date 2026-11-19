import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, nav, num, pct } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import { pickNewsPhotos } from "../_shared/news-photos";
import css from "./strogiy.module.css";

/*
 * Концепция 46 — «Строгий»: по мотивам сайта SIX Group (биржевая группа Швейцарии). Узкая служебная полоса и строка
 * меню, первый экран — тёмное фото во всю ширину с заголовком по центру и полосой из четырёх направлений внизу;
 * серая полоса с названием и показателями рынка; сетка новостей (две крупные карточки и колонка сообщений эмитентов),
 * аукционы ГЦБ, карточки с цветной полосой сверху, блок контактов, фото-баннер, три карточки разделов и тёмный
 * подвал с поиском. Почти прямые углы, лёгкие тени, один акцент — фирменная бирюза. Шрифты — основного сайта.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "46 · Строгий" };

function Chevron() {
  return (
    <svg className={css.chevron} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 3l5 5-5 5" />
    </svg>
  );
}

const lines = [
  { label: "Торги", href: "/market" },
  { label: "Листинг", href: "/listing" },
  { label: "Государственные ценные бумаги", href: "/gcb" },
  { label: "Раскрытие информации", href: "/disclosure" },
];

const sections = [
  { title: "Новости", text: "Объявления биржи, изменения правил и события рынка ценных бумаг.", href: "/news", photo: "/hub/hub-news.jpg" },
  { title: "Раскрытие информации", text: "Отчёты эмитентов и существенные факты — в одном месте для всех участников рынка.", href: "/disclosure", photo: "/hub/hub-disclosure.jpg" },
  { title: "О бирже", text: "История с 1994 года, руководство, акционеры и стратегия Кыргызской фондовой биржи.", href: "/about", photo: "/hero/kse-entrance-garden.jpg" },
];

export default async function StrogiyConcept() {
  const data = await loadHomeData();
  const news = data.news.slice(0, 2);
  const photos = pickNewsPhotos(news);
  const releases = data.companyNews.length
    ? data.companyNews.slice(0, 3).map((item) => ({ slug: item.slug, title: item.title, date: item.date, label: item.company }))
    : data.news.slice(2, 5).map((item) => ({ slug: item.slug, title: item.title, date: item.date, label: item.tag || "Новости" }));
  const auctions = data.auctions.slice(0, 3);
  const volumeK = data.volume.volumeMln < 1;

  return (
    <ConceptPage accent="#57b6c0">
      <div className={css.page}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        {/* Служебная полоса и строка меню. */}
        <header className={css.header}>
          <div className={css.utility}>
            <Link href="/design-concepts/strogiy" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={34} height={32} priority />
              <span>
                <b>КФБ</b>
                <small>Кыргызская фондовая биржа</small>
              </span>
            </Link>
            <div className={css.utilityLinks}>
              <Link href="/investors" className={css.outlineBtn}>
                Частным инвесторам
              </Link>
              <span className={css.lang}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9M12 3c-2.5 2.6-3.8 5.6-3.8 9s1.3 6.4 3.8 9" />
                </svg>
                Русский
              </span>
              <Link href="/login" className={css.login}>
                Вход
              </Link>
              <Link href="/about" className={css.menuBtn}>
                Меню
                <i aria-hidden="true" />
              </Link>
            </div>
          </div>
          <nav className={css.nav} aria-label="Основное меню">
            {nav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/contacts">Контакты</Link>
          </nav>
        </header>

        <main id="main">
          {/* Первый экран: фото, заголовок по центру, полоса направлений. */}
          <section className={css.hero} aria-labelledby="st-hero">
            <Image src="/hero/bishkek-ala-too.jpg" alt="" fill priority sizes="100vw" className={css.heroPhoto} />
            <div className={css.heroText} data-intro="rise">
              <h1 id="st-hero">Рынок капитала Кыргызстана</h1>
              <p>Прозрачные торги ценными бумагами с 1994 года</p>
              <Link href="/about" className={css.btn}>
                Подробнее
              </Link>
            </div>
            <nav className={css.lines} aria-label="Направления">
              {lines.map((line) => (
                <Link key={line.href} href={line.href}>
                  {line.label}
                  <Chevron />
                </Link>
              ))}
            </nav>
          </section>

          {/* Серая полоса: название, вводный текст и показатели рынка. */}
          <section className={css.intro} aria-labelledby="st-intro">
            <div className={css.wrap}>
              <h2 id="st-intro">Кыргызская фондовая биржа</h2>
              <p>
                {data.tagline ||
                  "Инфраструктура рынка ценных бумаг Кыргызстана: торги акциями, облигациями и государственными ценными бумагами, листинг и раскрытие информации эмитентов."}
              </p>
              <dl className={css.figures}>
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
                    {volumeK ? num(data.volume.volumeMln * 1000) : num(data.volume.volumeMln, 1)}
                    <small>{volumeK ? "тыс. сом" : "млн сом"}</small>
                  </dd>
                </div>
                <div>
                  <dt>Капитализация</dt>
                  <dd>
                    {num(data.index.capitalization, 1)}
                    <small>млрд сом</small>
                  </dd>
                </div>
                <div>
                  <dt>Эмитентов</dt>
                  <dd>{num(data.issuers)}</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Новости: две крупные карточки и колонка сообщений эмитентов. */}
          <section className={css.wrap} aria-label="Новости и сообщения">
            <div className={css.newsGrid} data-stagger="">
              {news.map((item, i) => (
                <Link key={item.slug} href={`/news/${item.slug}`} className={css.newsCard}>
                  <span className={css.newsPhoto}>
                    <Image src={photos[i]} alt="" fill sizes="(max-width: 900px) 100vw, 420px" />
                  </span>
                  <span className={css.cardBody}>
                    <em className={css.kicker}>{item.tag || "Новости"}</em>
                    <b>{item.title}</b>
                    <time>{longDate(item.date)}</time>
                    {item.excerpt ? <span className={css.excerpt}>{item.excerpt}</span> : null}
                  </span>
                </Link>
              ))}
              <div className={css.releases}>
                {releases.map((item) => (
                  <Link key={item.slug} href={`/news/${item.slug}`} className={css.release}>
                    <em className={css.kicker}>{item.label}</em>
                    <b>{item.title}</b>
                    <time>{longDate(item.date)}</time>
                  </Link>
                ))}
              </div>
            </div>

            {auctions.length ? (
              <>
                <h2 className={css.rowTitle}>Аукционы ГЦБ</h2>
                <div className={css.auctionRow} data-stagger="">
                  {auctions.map((row) => (
                    <Link key={row.date + row.type} href="/gcb" className={css.release}>
                      <em className={css.kicker}>{row.status || "Аукцион"}</em>
                      <b>{row.type}</b>
                      <span className={css.excerpt}>{row.volume ? `Объём выпуска ${row.volume}` : "Государственные ценные бумаги Минфина КР"}</span>
                      <time>{longDate(row.date)}</time>
                    </Link>
                  ))}
                </div>
              </>
            ) : null}

            {/* Котировки (карточка с полосой сверху) и контакты. */}
            <div className={css.ctaRow}>
              <div className={css.ctaCard} data-reveal="rise">
                <h2>Котировки и итоги торгов</h2>
                <p>Цены по каждой ценной бумаге, объёмы торгов по рынкам и архив сделок за день, неделю, месяц и год.</p>
                <Link href="/market" className={css.btn}>
                  Перейти к итогам торгов
                </Link>
              </div>
              <div className={css.contactBox} data-reveal="rise">
                <h2>Свяжитесь с нами</h2>
                <p>Есть вопросы? Мы поможем.</p>
                {data.contacts.phones[0] ? (
                  <a className={css.phone} href={`tel:${data.contacts.phones[0].replace(/[^\d+]/g, "")}`}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" />
                    </svg>
                    {data.contacts.phones[0]}
                  </a>
                ) : null}
                <Link href="/contacts" className={css.btn}>
                  Контакты биржи
                </Link>
              </div>
            </div>
          </section>

          {/* Серая секция: учебный центр (изображение + карточка). */}
          <section className={css.study} aria-labelledby="st-study">
            <div className={css.wrap}>
              <h2 id="st-study" className={css.studyTitle}>
                Знания для инвесторов и специалистов рынка
              </h2>
              <div className={css.studyGrid}>
                <div className={css.studyPhoto} data-reveal="fade">
                  <Image src="/hub/hub-education.jpg" alt="" fill sizes="(max-width: 900px) 100vw, 560px" />
                </div>
                <div className={css.ctaCard} data-reveal="rise">
                  <h3>Учебный центр биржи</h3>
                  <p>
                    Курсы и семинары по рынку ценных бумаг: основы инвестирования, работа профессиональных участников и
                    требования к эмитентам.
                  </p>
                  <Link href={EDU_URL} className={css.btn} {...linkProps(EDU_URL)}>
                    Выбрать курс
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Листинг: карточка с фото слева. */}
          <section className={css.wrap} aria-labelledby="st-listing">
            <div className={css.feature} data-reveal="rise">
              <div className={css.featurePhoto}>
                <Image src="/hub/hub-listing.jpg" alt="" fill sizes="(max-width: 900px) 100vw, 320px" />
              </div>
              <div>
                <h2 id="st-listing">Листинг на бирже</h2>
                <p>
                  Выпуск акций и облигаций открывает компании доступ к капиталу инвесторов. В официальном списке биржи —{" "}
                  {num(data.listed)} ценных бумаг; биржа сопровождает эмитента на каждом шаге.
                </p>
                <Link href="/listing" className={css.btn}>
                  Условия листинга
                </Link>
              </div>
            </div>
          </section>

          {/* Фото-баннер: участники торгов. */}
          <section className={css.wrap} aria-labelledby="st-members">
            <Link href="/members" className={css.banner} data-reveal="rise">
              <Image src="/hub/hub-members.jpg" alt="" fill sizes="(max-width: 1240px) 100vw, 1200px" />
              <span className={css.bannerText}>
                <b id="st-members">Участники торгов</b>
                <span>Брокеры и банки — лицензированные участники биржи. Через них инвесторы покупают и продают ценные бумаги.</span>
                <em>Список участников</em>
              </span>
            </Link>
          </section>

          {/* Три карточки разделов. */}
          <section className={css.wrap} aria-label="Разделы">
            <div className={css.sections} data-stagger="">
              {sections.map((item) => (
                <Link key={item.href} href={item.href} className={css.sectionCard}>
                  <span className={css.sectionPhoto}>
                    <Image src={item.photo} alt="" fill sizes="(max-width: 900px) 100vw, 400px" />
                  </span>
                  <span className={css.cardBody}>
                    <b>{item.title}</b>
                    <span className={css.excerpt}>{item.text}</span>
                    <em className={css.more}>Подробнее</em>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </main>

        {/* Тёмный подвал с поиском и колонками. */}
        <footer className={css.footer}>
          <div className={css.wrap}>
            <div className={css.footTop}>
              <Image src="/brand/kse-mark.png" alt="Кыргызская фондовая биржа" width={40} height={38} />
              <form action="/search" className={css.search} role="search">
                <input type="search" name="q" placeholder="Поиск по сайту" aria-label="Поиск по сайту" />
                <button type="submit" aria-label="Найти">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-4-4" />
                  </svg>
                </button>
              </form>
            </div>
            <div className={css.footCols}>
              <div>
                <h3>Биржа</h3>
                <Link href="/about">О бирже</Link>
                <Link href="/about/management">Руководство</Link>
                <Link href="/about/shareholders">Акционеры</Link>
                <Link href="/news">Новости</Link>
              </div>
              <div>
                <h3>Рынок</h3>
                <Link href="/market">Итоги торгов</Link>
                <Link href="/market/quotes">Котировки</Link>
                <Link href="/market/index">Индекс KSE</Link>
                <Link href="/gcb">ГЦБ</Link>
                <Link href="/commodity">Товарный сектор</Link>
              </div>
              <div>
                <h3>Эмитентам</h3>
                <Link href="/listing">Листинг</Link>
                <Link href="/disclosure">Раскрытие информации</Link>
                <Link href="/documents">Правила и документы</Link>
                <Link href="/tariffs">Тарифы</Link>
              </div>
              <div>
                <h3>Контакты</h3>
                <p>{data.contacts.address}</p>
                {data.contacts.phones.slice(0, 2).map((phone) => (
                  <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                    {phone}
                  </a>
                ))}
                {data.contacts.email ? <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a> : null}
              </div>
            </div>
            <div className={css.footBottom}>
              <span>{data.contacts.copyright}</span>
              <span>{data.contacts.license ? `Лицензия ${data.contacts.license}` : ""}</span>
            </div>
          </div>
        </footer>

        <ConceptSwitch current="strogiy" />
      </div>
    </ConceptPage>
  );
}
