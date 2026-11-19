import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Inter, Literata } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import { pickNewsPhotos } from "../_shared/news-photos";
import { sectorPhoto } from "../_shared/SectorPhoto";
import css from "./otrasli.module.css";

/*
 * Концепция 36 — «Отрасли»: главная рассказывает об экономике Кыргызстана через отрасли, чьи бумаги обращаются на
 * бирже. Полноэкранное фото Бишкека, оглавление отраслей, затем по большому фото на отрасль с реальными бумагами
 * последней сессии (группировка — по фото отрасли из SectorPhoto). Антиква Literata, Inter, фирменная бирюза.
 */
const serif = Literata({ subsets: ["latin", "cyrillic"], weight: ["500", "600"], variable: "--ot-serif" });
const sans = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], variable: "--ot-sans" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "36 · Отрасли" };

/** Подписи отраслей по фото из sectorPhoto(); тексты — общие слова об отрасли, без утверждений о компаниях. */
const sectors: Record<string, { id: string; name: string; text: string }> = {
  "/sectors/airport.jpg": { id: "aviation", name: "Авиация и инфраструктура", text: "Аэропорты и авиационные услуги — ворота страны для туризма и торговли." },
  "/sectors/oil.jpg": { id: "oil", name: "Нефть и газ", text: "Переработка и сбыт нефтепродуктов для экономики и транспорта страны." },
  "/sectors/power.jpg": { id: "power", name: "Энергетика", text: "Выработка электрической энергии для городов и промышленности." },
  "/sectors/hydro.jpg": { id: "hydro", name: "Гидроэнергетика", text: "Энергия горных рек — основа энергосистемы Кыргызстана." },
  "/sectors/grid.jpg": { id: "grid", name: "Электросети", text: "Передача и распределение электроэнергии по всей стране." },
  "/sectors/telecom.jpg": { id: "telecom", name: "Связь", text: "Телекоммуникации, которые соединяют города и сёла." },
  "/sectors/gold-mine.jpg": { id: "mining", name: "Горнодобыча", text: "Добыча золота и полезных ископаемых — одна из опор экспорта." },
  "/sectors/printing.jpg": { id: "printing", name: "Полиграфия", text: "Печатное производство и издательские услуги." },
  "/sectors/sugar.jpg": { id: "food", name: "Пищевая промышленность", text: "Переработка сельскохозяйственного сырья и производство продуктов." },
  "/sectors/bank.jpg": { id: "finance", name: "Финансы", text: "Банки и финансовые компании, привлекающие капитал на бирже." },
  "/carousel/gold.jpg": { id: "metals", name: "Драгоценные металлы", text: "Аффинированные золото и серебро — инструменты сбережения." },
  "/hub/hub-gcb.jpg": { id: "gcb", name: "Государственные бумаги", text: "Бумаги Министерства финансов — размещение на аукционах биржи." },
  "/carousel/city.jpg": { id: "other", name: "Другие компании", text: "Эмитенты разных отраслей, чьи бумаги обращаются на бирже." },
};

export default async function OtrasliConcept() {
  const data = await loadHomeData();
  const news = data.news.slice(0, 3);
  const photos = pickNewsPhotos(news);

  // Группируем бумаги по отрасли; «прочие» (общий кадр города) — в конец.
  const groups = new Map<string, { photo: string; papers: typeof data.instruments; volume: number }>();
  for (const item of data.instruments) {
    const photo = sectorPhoto(item.name, item.type, item.ticker);
    const key = photo === "/carousel/city.jpg" && item.type === "gcb" ? "/hub/hub-gcb.jpg" : photo;
    const group = groups.get(key) ?? { photo: key, papers: [], volume: 0 };
    group.papers.push(item);
    group.volume += item.volume;
    groups.set(key, group);
  }
  const list = [...groups.values()]
    .filter((group) => sectors[group.photo])
    .sort((a, b) => Number(a.photo === "/carousel/city.jpg") - Number(b.photo === "/carousel/city.jpg") || b.volume - a.volume || b.papers.length - a.papers.length)
    .slice(0, 7);

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${serif.variable} ${sans.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <Link href="/design-concepts/otrasli" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={30} height={28} priority />
            <span>Кыргызская фондовая биржа</span>
          </Link>
          <nav className={css.nav} aria-label="Основное меню">
            <Link href="/market">Торги</Link>
            <Link href="/listing">Эмитентам</Link>
            <Link href="/members">Инвесторам</Link>
            <Link href="/disclosure">Раскрытие</Link>
            <Link href="/about">О бирже</Link>
          </nav>
          <Link href="/members" className={css.headCta}>
            Начать инвестировать
          </Link>
        </header>

        <main id="main">
          {/* 1. Полноэкранное фото. */}
          <section className={css.hero} aria-labelledby="ot-hero">
            <Image src="/hero/bishkek-ala-too.jpg" alt="Бишкек на фоне хребта Ала-Тоо" fill priority sizes="100vw" />
            <div className={css.heroText}>
              <p className={css.kicker} data-intro="fade">
                Кыргызская фондовая биржа · с 1994 года
              </p>
              <h1 id="ot-hero" data-intro="rise" style={{ "--kc-d": "80ms" } as CSSProperties}>
                Экономика Кыргызстана — на одной бирже
              </h1>
              <p data-intro="rise" style={{ "--kc-d": "160ms" } as CSSProperties}>
                Энергетика и связь, авиация и финансы, горнодобыча и промышленность: {num(data.issuers)} компаний раскрывают отчётность, {num(data.quotes.total)} бумаг торгуются на
                бирже.
              </p>
              <div className={css.heroActions} data-intro="rise" style={{ "--kc-d": "240ms" } as CSSProperties}>
                <a href="#sectors" className={css.btnLight}>
                  Смотреть отрасли ↓
                </a>
                <Link href="/market/quotes" className={css.btnGhost}>
                  Все котировки
                </Link>
              </div>
            </div>
          </section>

          {/* 2. Оглавление отраслей. */}
          <nav id="sectors" className={css.toc} aria-label="Отрасли">
            <p>Отрасли</p>
            <ul>
              {list.map((group) => (
                <li key={group.photo}>
                  <a href={`#${sectors[group.photo].id}`}>
                    {sectors[group.photo].name}
                    <small>{group.papers.length}</small>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* 3. Отрасли: большое фото и реальные бумаги. */}
          {list.map((group, i) => {
            const info = sectors[group.photo];
            return (
              <section key={group.photo} id={info.id} className={css.sector} data-flip={i % 2 === 1 || undefined} aria-labelledby={`ot-${info.id}`}>
                <div className={css.sectorPhoto} data-reveal>
                  <Image src={group.photo} alt="" fill sizes="(max-width: 900px) 100vw, 55vw" />
                  <span className={css.sectorNum}>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className={css.sectorText} data-reveal>
                  <p className={css.kickerDark}>
                    Отрасль · {group.papers.length} {group.papers.length === 1 ? "бумага" : group.papers.length < 5 ? "бумаги" : "бумаг"}
                  </p>
                  <h2 id={`ot-${info.id}`}>{info.name}</h2>
                  <p>{info.text}</p>
                  <ul className={css.papers}>
                    {group.papers.slice(0, 4).map((paper) => (
                      <li key={paper.ticker}>
                        <Link href={paper.href}>
                          <b>{paper.ticker}</b>
                          <span>{paper.name}</span>
                          <em>{paper.price > 0 ? `${num(paper.price, 2)} сом` : "—"}</em>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {group.papers.length > 4 ? <p className={css.more}>и ещё {group.papers.length - 4}</p> : null}
                </div>
              </section>
            );
          })}

          {/* 4. Рынок в цифрах. */}
          <section className={css.numbers} aria-label="Рынок в цифрах">
            <dl data-stagger>
              <div>
                <dt>Индекс KSE</dt>
                <dd>{num(data.index.value, 2)}</dd>
              </div>
              <div>
                <dt>Капитализация, млрд сом</dt>
                <dd>{num(data.index.capitalization, 1)}</dd>
              </div>
              <div>
                <dt>Объём сессии, млн сом</dt>
                <dd>{num(data.volume.volumeMln, 1)}</dd>
              </div>
              <div>
                <dt>Эмитентов</dt>
                <dd>{num(data.issuers)}</dd>
              </div>
            </dl>
            <p>Итоги торговой сессии {longDate(data.session.date)}</p>
          </section>

          {/* 5. Новости. */}
          <section className={css.news} aria-labelledby="ot-news">
            <div className={css.newsHead}>
              <h2 id="ot-news">Новости биржи</h2>
              <Link href="/news">Все новости →</Link>
            </div>
            <ul data-stagger>
              {news.map((item, i) => (
                <li key={item.slug}>
                  <Link href={`/news/${item.slug}`}>
                    <span className={css.newsPhoto}>
                      <Image src={photos[i]} alt="" fill sizes="(max-width: 720px) 100vw, 380px" />
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
            <Link href="/disclosure">Раскрытие информации</Link>
            <Link href={EDU_URL} {...linkProps(EDU_URL)}>
              Учебный центр
            </Link>
            <Link href="/contacts">Контакты</Link>
          </nav>
          <p className={css.legal}>
            {data.contacts.copyright}. {data.contacts.license ? `Лицензия ${data.contacts.license}. ` : ""}Информация на сайте не является инвестиционной рекомендацией.
          </p>
        </footer>
        <ConceptSwitch current="otrasli" />
      </div>
    </ConceptPage>
  );
}
