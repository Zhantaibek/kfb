import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Inter_Tight } from "next/font/google";
import { mediaSrc } from "@/lib/cms/media-src";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage, Words } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, nav, num, steps } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import css from "./plakat.module.css";
import { Rail } from "./Rail";

/*
 * Концепция 18 — «Плакат»: швейцарская типографика. Белый лист, чёрный текст, один сигнальный красный.
 * Главное — размер: индекс набран во всю ширину экрана, котировки — крупными строками, как афиша.
 * Сетка 12 колонок с тонкими линейками; история индекса — чёрные столбики, оборот — одна полоса на всю ширину,
 * новости — горизонтальная лента со стрелками. Шрифт Inter Tight. Только реальные данные.
 */
const font = Inter_Tight({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "700", "800", "900"], variable: "--pl-font" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "18 · Плакат" };

function changeText(value: number) {
  if (value >= 1000) return `в ${num(value / 100 + 1)} раз`;
  return `${value > 0 ? "+" : value < 0 ? "−" : "±"}${num(Math.abs(value), 2)}%`;
}

function Change({ value }: { value: number }) {
  return (
    <span className={value > 0 ? css.up : value < 0 ? css.down : css.flat}>
      <span aria-hidden="true">{value > 0 ? "▲ " : value < 0 ? "▼ " : ""}</span>
      <span className={css.srOnly}>{value > 0 ? "рост " : value < 0 ? "снижение " : "без изменений "}</span>
      {changeText(value)}
    </span>
  );
}

export default async function PlakatConcept() {
  const data = await loadHomeData();
  const rows = data.instruments.filter((item) => item.price > 0).slice(0, 6);
  const rail = [...data.news, ...data.companyNews].slice(0, 8);
  const traded = data.instruments.filter((item) => item.volume > 0);
  const total = traded.reduce((sum, item) => sum + item.volume, 0);
  const maxVolume = Math.max(1, ...rows.map((item) => item.volume));
  // Полоса оборота: пять крупнейших бумаг отдельно, остальные — одним сегментом «прочие».
  const shares = traded.slice(0, 5).map((item) => ({ key: item.ticker, label: item.ticker, name: item.name, href: item.href, share: total ? item.volume / total : 0 }));
  const rest = total ? traded.slice(5).reduce((sum, item) => sum + item.volume, 0) / total : 0;
  if (rest > 0) shares.push({ key: "rest", label: "Прочие", name: `${traded.length - 5} бумаг`, href: "/market/quotes", share: rest });
  // История индекса столбиками: высота — значение относительно минимума ряда, чтобы движение было видно.
  const history = data.history.slice(-40);
  const lo = Math.min(...history);
  const hi = Math.max(...history);
  const bars = history.map((v) => 0.18 + 0.82 * ((v - lo) / (hi - lo || 1)));

  return (
    <ConceptPage accent="#e30613">
      <div className={`${css.page} ${font.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header}>
          <Link href="/design-concepts/plakat" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
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
            Начать
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
          {/* Афиша: индекс во всю ширину. */}
          <section className={css.poster} aria-labelledby="pl-hero">
            <div className={css.posterTop}>
              <p data-intro="fade">
                Индекс KSE
                <br />
                {data.live ? `сессия ${longDate(data.session.date)}` : "демонстрационные значения"}
              </p>
              <p data-intro="fade" style={{ "--kc-d": "120ms" } as CSSProperties}>
                <i className={data.session.open ? css.live : css.idle} aria-hidden="true" />
                {data.session.label}
                <br />
                {data.session.hours}
              </p>
              <h1 id="pl-hero" data-intro="words" style={{ "--kc-d": "200ms" } as CSSProperties}>
                <Words text="Рынок капитала Кыргызстана" />
              </h1>
            </div>
            <p className={css.giant} data-intro="rise" style={{ "--kc-d": "300ms" } as CSSProperties}>
              <span data-count={data.index.value} data-digits="2">
                {num(data.index.value, 2)}
              </span>
            </p>
            {bars.length > 1 ? (
              <div className={css.bars} aria-hidden="true" data-reveal="fade">
                {bars.map((h, i) => (
                  <i key={i} style={{ "--h": h } as CSSProperties} data-last={i === bars.length - 1 || undefined} />
                ))}
              </div>
            ) : null}
            {bars.length > 1 ? (
              <p className={css.barsCaption}>
                Индекс за {history.length} сессий: от {num(lo, 2)} до {num(hi, 2)}
              </p>
            ) : null}
            <dl className={css.ruler} data-stagger>
              <div>
                <dt>Изменение</dt>
                <dd>
                  <Change value={data.index.change} />
                </dd>
              </div>
              <div>
                <dt>Объём сессии</dt>
                <dd>
                  {num(data.volume.volumeMln, 2)} <small>млн сом</small>
                </dd>
              </div>
              <div>
                <dt>Сделок</dt>
                <dd>{num(data.volume.trades)}</dd>
              </div>
              <div>
                <dt>Капитализация</dt>
                <dd>
                  {num(data.index.capitalization, 1)} <small>млрд сом</small>
                </dd>
              </div>
            </dl>
          </section>

          {/* Котировки крупными строками. */}
          <section className={css.section} aria-labelledby="pl-quotes">
            <header className={css.sectionHead}>
              <span className={css.sectionNo}>01</span>
              <h2 id="pl-quotes">Котировки</h2>
              <Link href="/market/quotes" className={css.arrowLink}>
                Все бумаги →
              </Link>
            </header>
            {rows.length ? (
              <ul className={css.quotes} data-stagger>
                {rows.map((q) => (
                  <li key={q.ticker}>
                    <Link href={q.href} style={{ "--share": q.volume / maxVolume } as CSSProperties}>
                      <b>{q.ticker}</b>
                      <span className={css.qName}>{q.name}</span>
                      <span className={css.qPrice}>{num(q.price, 2)}</span>
                      <span className={css.qChange}>
                        <Change value={q.change} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={css.empty}>Сделок пока не было</p>
            )}
            <p className={css.caption}>Цена в сомах по итогам последней сессии. Красная линия под строкой — объём торгов относительно лидера.</p>
          </section>

          {/* Оборот — одна полоса на всю ширину, как инфографика на плакате. */}
          {shares.length ? (
            <section className={css.section} aria-labelledby="pl-turnover">
              <header className={css.sectionHead}>
                <span className={css.sectionNo}>02</span>
                <h2 id="pl-turnover">Оборот сессии</h2>
                <span className={css.arrowLink}>
                  {num(data.volume.volumeMln, 2)} млн сом
                </span>
              </header>
              <div className={css.stack} role="img" aria-label={`Доли в обороте: ${shares.map((s) => `${s.label} ${num(s.share * 100, 1)}%`).join(", ")}`} data-reveal="fade">
                {shares.map((s, i) => (
                  <i key={s.key} style={{ "--w": s.share } as CSSProperties} data-tone={i === 0 ? "red" : i % 2 ? "black" : "grey"} />
                ))}
              </div>
              <ol className={css.shares} style={{ "--n": shares.length } as CSSProperties} data-stagger>
                {shares.map((s, i) => (
                  <li key={s.key}>
                    <Link href={s.href}>
                      <i data-tone={i === 0 ? "red" : i % 2 ? "black" : "grey"} aria-hidden="true" />
                      <b>{num(s.share * 100, 1)}%</b>
                      <span>
                        {s.label}
                        <small>{s.name}</small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* Новости — горизонтальная лента. */}
          <section className={css.section} aria-labelledby="pl-news">
            <header className={css.sectionHead}>
              <span className={css.sectionNo}>03</span>
              <h2 id="pl-news">Новости</h2>
              <Link href="/news" className={css.arrowLink}>
                Все новости →
              </Link>
            </header>
            {rail.length ? (
              <Rail css={css} label="Лента новостей, листается по горизонтали" count={rail.length}>
                {rail.map((item, i) => (
                  <li key={item.slug}>
                    <Link href={`/news/${item.slug}`}>
                      <span className={css.railPhoto}>
                        <Image src={mediaSrc(item.photo)} alt="" fill sizes="(max-width: 639px) 80vw, 360px" unoptimized />
                      </span>
                      <span className={css.railNo}>{String(i + 1).padStart(2, "0")}</span>
                      <time>{longDate(item.date)}</time>
                      <b>{item.title}</b>
                    </Link>
                  </li>
                ))}
              </Rail>
            ) : (
              <p className={css.empty}>Новостей пока нет</p>
            )}
          </section>

          {data.urgent.length ? (
            <section className={css.urgent} aria-labelledby="pl-urgent">
              <h2 id="pl-urgent">Срочно</h2>
              <ul>
                {data.urgent.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/news/${item.slug}`}>
                      <time>{item.date}</time>
                      <b>{item.title}</b>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Аукционы ГЦБ: даты крупно. */}
          <section className={css.section} aria-labelledby="pl-gcb">
            <header className={css.sectionHead}>
              <span className={css.sectionNo}>04</span>
              <h2 id="pl-gcb">Аукционы ГЦБ</h2>
              <Link href="/gcb" className={css.arrowLink}>
                Календарь →
              </Link>
            </header>
            {data.auctions.length ? (
              <ul className={css.auctions} data-stagger>
                {data.auctions.map((a) => (
                  <li key={`${a.date}-${a.type}`}>
                    <time>{a.date.slice(0, 5)}</time>
                    <b>{a.type}</b>
                    <span>{a.volume}</span>
                    <span className={css.tag}>{a.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={css.empty}>Ближайших аукционов нет</p>
            )}
          </section>

          {/* Красный лист — как начать. */}
          <section className={css.red} id="start" aria-labelledby="pl-start">
            <header className={css.sectionHead}>
              <span className={css.sectionNo}>05</span>
              <h2 id="pl-start">Как купить первые ценные бумаги</h2>
            </header>
            <ol className={css.steps} data-stagger>
              {steps.map((step, i) => (
                <li key={step.title}>
                  <span className={css.stepNo}>{i + 1}</span>
                  <b>{step.title}</b>
                  <span>{step.text}</span>
                </li>
              ))}
            </ol>
            <div className={css.redActions}>
              <Link href="/members" className={css.invert}>
                Выбрать брокера
              </Link>
              <Link href={EDU_URL} className={css.outline} {...linkProps(EDU_URL)}>
                Учебный центр
              </Link>
            </div>
          </section>

          {/* Фото здания — один кадр, чёрно-белый, как в плакате. */}
          <section className={css.photoBand} aria-labelledby="pl-about">
            <span className={css.bandPhoto} data-reveal="mask">
              <Image src="/hero/kse-entrance-garden.jpg" alt="Вход в здание Кыргызской фондовой биржи" fill sizes="100vw" />
            </span>
            <div className={css.bandText} data-reveal>
              <h2 id="pl-about">С 1994 года</h2>
              <p>Акции, облигации, ГЦБ и драгоценные металлы. {num(data.issuers)} эмитентов, {num(data.listed)} в листинге.</p>
              <Link href="/about" className={css.arrowLink}>
                О бирже →
              </Link>
            </div>
          </section>
        </main>

        <footer className={css.footer}>
          <p className={css.footBig}>КФБ</p>
          <div className={css.footGrid}>
            <address>
              {data.contacts.address}
              {data.contacts.phones.map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                  {phone}
                </a>
              ))}
              {data.contacts.email ? <a href={`mailto:${data.contacts.email}`}>{data.contacts.email}</a> : null}
            </address>
            <nav aria-label="Разделы">
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
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
        <ConceptSwitch current="plakat" />
      </div>
    </ConceptPage>
  );
}
