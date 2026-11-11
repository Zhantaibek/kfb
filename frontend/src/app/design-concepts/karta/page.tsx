import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Nunito_Sans } from "next/font/google";
import { mediaSrc } from "@/lib/cms/media-src";
import { loadIssuerData } from "@/lib/cms/public";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage, Words } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, nav, num, pct, steps } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import { regionShapes, type RegionId } from "./kgz-map";
import { regionOf, short } from "./regions";
import { MapExplorer, type RegionData } from "./MapExplorer";
import css from "./karta.module.css";

/*
 * Концепция 20 — «Карта»: главная начинается с карты Кыргызстана. Области окрашены по числу эмитентов —
 * по адресам из карточек Центра раскрытия информации (реальные данные админки), клик по области показывает её компании.
 * Ниже — рынок по регионам: у каждой торгуемой бумаги указана область эмитента (связь через официальный список).
 * Границы — Natural Earth (общественное достояние). Шрифт Nunito Sans.
 */
const font = Nunito_Sans({ subsets: ["latin", "cyrillic"], weight: ["400", "600", "700", "800"], variable: "--k-font" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "20 · Карта" };

function Change({ value }: { value: number }) {
  const text = value >= 1000 ? `в ${num(value / 100 + 1)} раз` : pct(value);
  return <span className={value > 0 ? css.up : value < 0 ? css.down : css.flat}>{text}</span>;
}

export default async function KartaConcept() {
  const [data, issuerData] = await Promise.all([loadHomeData(), loadIssuerData()]);

  // Эмитенты по областям.
  const regionById = new Map<RegionId, RegionData>(regionShapes.map((s) => [s.id, { id: s.id, name: s.name, issuers: [], activities: [] }]));
  const regionOfSlug = new Map<string, RegionId>();
  let unknown = 0;
  for (const issuer of issuerData.issuers) {
    const region = regionOf(issuer.address ?? "");
    if (!region) {
      unknown += 1;
      continue;
    }
    regionOfSlug.set(issuer.slug, region);
    regionById.get(region)!.issuers.push({ slug: issuer.slug, name: issuer.name, activity: issuer.activity && issuer.activity !== "-" ? issuer.activity : "" });
  }
  for (const region of regionById.values()) {
    region.issuers.sort((a, b) => short(a.name).localeCompare(short(b.name), "ru"));
    const counts = new Map<string, number>();
    for (const i of region.issuers) if (i.activity) counts.set(i.activity, (counts.get(i.activity) ?? 0) + 1);
    region.activities = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }
  const regions = [...regionById.values()];
  const total = issuerData.issuers.length;
  const outside = regions.filter((r) => r.id !== "bishkek").reduce((sum, r) => sum + r.issuers.length, 0);

  // Бумага → эмитент через официальный список (символы выпусков), запасной путь — по названию.
  const slugOfSymbol = new Map<string, string>();
  for (const entry of issuerData.listing) {
    for (const symbol of `${entry.code} ${entry.symbols}`.split(/[\s,;]+/).filter(Boolean)) slugOfSymbol.set(symbol.toUpperCase(), entry.issuerSlug);
  }
  const slugOfName = new Map(issuerData.issuers.map((i) => [short(i.name).toLowerCase(), i.slug]));
  const regionName = new Map(regionShapes.map((s) => [s.id, s.name]));
  const traded = data.instruments
    .filter((item) => item.price > 0)
    .slice(0, 10)
    .map((item) => {
      const slug = slugOfSymbol.get(item.ticker.toUpperCase()) ?? slugOfName.get(short(item.name).toLowerCase());
      const region = slug ? regionOfSlug.get(slug) : undefined;
      return { ...item, region: region ? regionName.get(region) : undefined };
    });

  return (
    <ConceptPage accent="#0e7c6b">
      <div className={`${css.page} ${font.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <Link href="/design-concepts/karta" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={32} height={30} priority />
            <span>
              Кыргызская
              <br />
              фондовая биржа
            </span>
          </Link>
          <nav className={css.nav} aria-label="Основное меню">
            {nav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/members" className={css.cta}>
            Начать инвестировать
          </Link>
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
          <section className={css.hero} aria-labelledby="k-hero">
            <div className={css.heroText}>
              <p className={css.kicker} data-intro="fade">
                <i className={data.session.open ? css.on : css.off} aria-hidden="true" />
                {data.session.label} · индекс KSE {num(data.index.value, 2)} <Change value={data.index.change} />
              </p>
              <h1 id="k-hero" data-intro="words">
                <Words text="Компании всей страны — на одной бирже" />
              </h1>
              <p className={css.lead} data-intro="rise" style={{ "--kc-d": "360ms" } as CSSProperties}>
                {num(total)} эмитентов раскрывают отчётность на сайте биржи. Выберите область на карте — увидите компании, которые там зарегистрированы, и
                чем они занимаются.
              </p>
              <dl className={css.heroStats} data-stagger>
                <div>
                  <dt>Эмитентов</dt>
                  <dd>{num(total)}</dd>
                </div>
                <div>
                  <dt>Вне Бишкека</dt>
                  <dd>{num(outside)}</dd>
                </div>
                <div>
                  <dt>В листинге</dt>
                  <dd>{num(data.listed)}</dd>
                </div>
              </dl>
            </div>
            <MapExplorer regions={regions} total={total} unknown={unknown} />
            <p className={css.source}>
              Область — по адресу регистрации в карточке эмитента. Границы областей: Natural Earth. Город Ош показан в составе Ошской области.
            </p>
          </section>

          {/* Рынок: торгуемые бумаги с областью эмитента. */}
          <section className={css.section} aria-labelledby="k-market">
            <div className={css.sectionHead} data-reveal>
              <h2 id="k-market">Что торговалось и откуда эмитент</h2>
              <Link href="/market/quotes">Все котировки →</Link>
            </div>
            <div className={css.marketGrid}>
              <div className={css.card} data-reveal>
                <table className={css.table}>
                  <thead>
                    <tr>
                      <th scope="col">Бумага</th>
                      <th scope="col" className={css.hideSm}>
                        Эмитент
                      </th>
                      <th scope="col">Область</th>
                      <th scope="col" className={css.num}>
                        Цена, сом
                      </th>
                      <th scope="col" className={`${css.num} ${css.hideSm}`}>
                        Изм.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {traded.map((q) => (
                      <tr key={q.ticker}>
                        <th scope="row">
                          <Link href={q.href}>{q.ticker}</Link>
                        </th>
                        <td className={css.hideSm}>{q.name}</td>
                        <td>{q.region ? <span className={css.regionTag}>{q.region.replace(" область", "")}</span> : <span className={css.flat}>—</span>}</td>
                        <td className={css.num}>{num(q.price, 2)}</td>
                        <td className={`${css.num} ${css.hideSm}`}>
                          <Change value={q.change} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className={css.note}>{data.live ? `Итоги сессии ${longDate(data.session.date)}.` : "Демонстрационные значения."} Прочерк — эмитент не найден в Центре раскрытия.</p>
              </div>
              <aside className={css.card} aria-labelledby="k-session" data-reveal>
                <h3 id="k-session">Сессия</h3>
                <dl className={css.sessionStats}>
                  <div>
                    <dt>Индекс KSE</dt>
                    <dd>
                      {num(data.index.value, 2)} <Change value={data.index.change} />
                    </dd>
                  </div>
                  <div>
                    <dt>Объём</dt>
                    <dd>{num(data.volume.volumeMln, 2)} млн сом</dd>
                  </div>
                  <div>
                    <dt>Сделок</dt>
                    <dd>{num(data.volume.trades)}</dd>
                  </div>
                  <div>
                    <dt>Капитализация</dt>
                    <dd>{num(data.index.capitalization, 1)} млрд сом</dd>
                  </div>
                </dl>
                {data.auctions.length ? (
                  <>
                    <h3>Аукционы ГЦБ</h3>
                    <ul className={css.auctions}>
                      {data.auctions.map((a) => (
                        <li key={`${a.date}-${a.type}`}>
                          <b>{a.date}</b> {a.type} · {a.volume}
                        </li>
                      ))}
                    </ul>
                    <Link href="/gcb" className={css.more}>
                      Календарь ГЦБ →
                    </Link>
                  </>
                ) : null}
              </aside>
            </div>
          </section>

          {/* Как начать. */}
          <section className={css.section} id="start" aria-labelledby="k-start">
            <div className={css.sectionHead} data-reveal>
              <h2 id="k-start">Инвестировать можно из любой области</h2>
              <Link href="/members">Участники торгов →</Link>
            </div>
            <ol className={css.steps} data-stagger>
              {steps.map((step, i) => (
                <li key={step.title}>
                  <Link href={step.href} {...linkProps(step.href)}>
                    <span className={css.stepNo}>{i + 1}</span>
                    <b>{step.title}</b>
                    <span>{step.text}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          {data.news.length ? (
            <section className={css.section} aria-labelledby="k-news">
              <div className={css.sectionHead} data-reveal>
                <h2 id="k-news">Новости биржи</h2>
                <Link href="/news">Все новости →</Link>
              </div>
              <ul className={css.news} data-stagger>
                {data.news.slice(0, 3).map((n) => (
                  <li key={n.slug}>
                    <Link href={`/news/${n.slug}`}>
                      <span className={css.newsPhoto}>
                        <Image src={mediaSrc(n.photo)} alt="" fill sizes="(max-width: 767px) 100vw, 33vw" unoptimized />
                      </span>
                      <small>
                        {n.tag} · {longDate(n.date)}
                      </small>
                      <b>{n.title}</b>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </main>

        <footer className={css.footer}>
          <div className={css.footGrid}>
            <div>
              <b>Кыргызская фондовая биржа</b>
              {data.contacts.address ? <p>{data.contacts.address}</p> : null}
              {data.contacts.phones.map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                  {phone}
                </a>
              ))}
              {data.contacts.email ? <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a> : null}
            </div>
            <nav aria-label="Разделы">
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href={EDU_URL} {...linkProps(EDU_URL)}>
                Учебный центр
              </Link>
              <Link href="/contacts">Контакты</Link>
            </nav>
            <p>
              {data.contacts.copyright}
              {data.contacts.license ? (
                <>
                  <br />
                  {data.contacts.license}
                </>
              ) : null}
            </p>
          </div>
        </footer>
        <ConceptSwitch current="karta" />
      </div>
    </ConceptPage>
  );
}
