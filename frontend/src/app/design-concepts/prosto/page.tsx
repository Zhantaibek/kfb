import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Jost, Source_Serif_4 } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage, Words } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import { Announce, PauseButton, ProductList, type Product } from "./Interactive";
import css from "./prosto.module.css";

/*
 * Концепция 51 — «Просто»: визуальный язык wealthsimple.com — тёплый светлый фон, геометрический гротеск
 * в интерфейсе и крупная антиква в манифестах, плавающая скруглённая шапка, мазки кистью на первом экране,
 * список разделов огромной антиквой, полноэкранные цветные блоки продуктов, которые наезжают друг на друга,
 * лента котировок, жёлтая карточка «Итоги торгов» и финал с монетами.
 * Фирменные шрифты Wealthsimple (The Future, Tiempos) коммерческие — вместо них ближайшие свободные
 * аналоги с кириллицей: Jost и Source Serif 4. Логотип, тексты, фото и видео Wealthsimple не используются.
 */
const sans = Jost({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "800"], variable: "--ps-sans" });
const serif = Source_Serif_4({ subsets: ["latin", "cyrillic"], weight: ["400"], variable: "--ps-serif" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "51 · Просто" };

const products: Product[] = [
  { word: "Торги", href: "/market", title: "Торги и котировки", text: "Цены, объёмы и сделки каждой сессии", tone: "#e7e1f4" },
  { word: "Инвестиции", href: "/members", title: "Частным инвесторам", text: "Как выбрать брокера и купить первую бумагу", tone: "#dcefe3" },
  { word: "ГЦБ", href: "/gcb", title: "Государственные бумаги", text: "Аукционы Минфина и доходность облигаций", tone: "#f3e7c9" },
  { word: "Листинг", href: "/listing", title: "Компаниям", text: "Привлечение капитала через биржу", tone: "#f5dcd2" },
  { word: "Обучение", href: EDU_URL, title: "Учебный центр", text: "Курсы и экзамены для участников рынка", tone: "#d9e9ee" },
];

/** Мазки радуги на первом экране: концентрические дуги, каждая прорисовывается кистью по очереди. */
const strokes = ["#7a1f6b", "#c9b3ee", "#ff5a1f", "#2f6bff", "#e8c11a", "#8fd16a", "#1f6f3a"];

/** «Логотип» в подписи блока: КФБ антиквой + название продукта гротеском, как «Wealthsimple Chequing». */
function Eyebrow({ children }: { children: string }) {
  return (
    <p className={css.eyebrow}>
      <b>КФБ</b> {children}
    </p>
  );
}

function ArrowButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={css.roundArrow} aria-label={label} {...linkProps(href)}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12h16M14 6l6 6-6 6" />
      </svg>
    </Link>
  );
}

export default async function ProstoConcept() {
  const data = await loadHomeData();
  const priced = data.instruments.filter((item) => item.price > 0);
  const ticker = priced.slice(0, 14);
  const phoneRows = priced.slice(0, 4);
  const auction = data.auctions[0];
  const sessionDate = data.session.date ? longDate(data.session.date) : "последней сессии";
  const up = data.index.change >= 0;

  return (
    <ConceptPage accent="#1c1b1b">
      <div className={`${css.page} ${sans.variable} ${serif.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <div className={css.top}>
          {auction ? (
            <Announce>
              Аукцион ГЦБ {auction.date}: выпуск {auction.type.toUpperCase()}, объём {auction.volume}.{" "}
              <Link href="/gcb">Подробнее</Link>.
            </Announce>
          ) : null}
          <header className={css.header}>
            <Link href="/design-concepts/prosto" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={26} height={24} priority />
              <span>КФБ</span>
            </Link>
            <nav className={css.nav} aria-label="Основное меню">
              {[
                ["Торги", "/market"],
                ["Инвесторам", "/members"],
                ["Эмитентам", "/listing"],
                ["ГЦБ", "/gcb"],
                ["Раскрытие", "/disclosure"],
                ["О бирже", "/about"],
              ].map(([label, href], i) => (
                <Link key={href} href={href}>
                  {label}
                  {i < 3 ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m7 10 5 5 5-5" />
                    </svg>
                  ) : null}
                </Link>
              ))}
            </nav>
            <div className={css.actions}>
              <Link href="/search" className={css.iconBtn} aria-label="Поиск по сайту">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4" />
                </svg>
              </Link>
              <Link href="/login" className={css.ghost}>
                Войти
              </Link>
              <Link href="/members" className={css.solid}>
                Начать
              </Link>
            </div>
          </header>
        </div>

        <main id="main">
          {/* 1. Первый экран: крупный гротеск слева, мазки кистью справа. */}
          <section className={css.hero}>
            <div className={css.heroText}>
              <Eyebrow>представляет</Eyebrow>
              <h1 data-intro="words">
                <Words text="Ваши деньги могут работать на вас" />
              </h1>
              <p data-intro="rise" style={{ "--kc-d": "500ms" } as CSSProperties}>
                Акции, облигации и государственные бумаги Кыргызстана — на одной бирже. Индекс KSE сегодня{" "}
                <b>{num(data.index.value, 2)}</b> ({pct(data.index.change)}), торги {data.session.hours || "с 9:00 до 17:00"}.
              </p>
              <Link href="/members" className={css.bigSolid} data-intro="rise" style={{ "--kc-d": "650ms" } as CSSProperties}>
                Начать инвестировать
              </Link>
            </div>
            <svg className={css.brush} viewBox="0 0 800 800" aria-hidden="true" preserveAspectRatio="xMaxYMax slice">
              <defs>
                <filter id="ps-brush" x="-10%" y="-10%" width="120%" height="120%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.018 0.05" numOctaves="3" seed="7" />
                  <feDisplacementMap in="SourceGraphic" scale="20" />
                </filter>
              </defs>
              <g filter="url(#ps-brush)">
                {strokes.map((color, i) => {
                  const r = 700 - i * 64;
                  return (
                    <path
                      key={color}
                      d={`M${800 - r} 820 A${r} ${r} 0 0 1 820 ${800 - r}`}
                      stroke={color}
                      pathLength={1}
                      style={{ "--i": i } as CSSProperties}
                    />
                  );
                })}
              </g>
            </svg>
          </section>

          {/* 2. Разделы огромной антиквой; при наведении — карточка у курсора. */}
          <section className={css.productsSection} aria-label="Разделы биржи">
            <ProductList items={products} />
          </section>

          {/* 3. Продукты: полноэкранные цветные блоки, каждый следующий наезжает на предыдущий. */}
          <div className={css.stack}>
            <section className={`${css.panel} ${css.panelDusk}`}>
              <div className={css.panelText}>
                <Eyebrow>Торги</Eyebrow>
                <h2>Весь рынок Кыргызстана — в&nbsp;одном окне</h2>
                <ArrowButton href="/market" label="Перейти к торгам" />
              </div>
              <div className={css.phone} data-reveal="up">
                <div className={css.screen}>
                  <div className={css.island} />
                  <div className={css.screenTop}>
                    <span className={css.dot} />
                    <span className={css.pill}>Рынок</span>
                    <span className={css.dot} />
                  </div>
                  <p className={css.big}>{num(data.index.value, 2)}</p>
                  <p className={css.bigNote}>Индекс KSE · {sessionDate}</p>
                  <div className={css.tiles}>
                    <div>
                      <span>Изменение</span>
                      <b>{pct(data.index.change)}</b>
                      <em data-up={up ? "" : undefined}>за сессию</em>
                    </div>
                    <div>
                      <span>Объём</span>
                      <b>{num(data.volume.volumeMln, 1)} млн</b>
                      <em data-up="">{num(data.volume.trades)} сделок</em>
                    </div>
                  </div>
                  <ul className={css.rows}>
                    {phoneRows.map((item) => (
                      <li key={item.ticker}>
                        <span>
                          <b>{item.ticker}</b>
                          <small>{item.name}</small>
                        </span>
                        <span>{num(item.price, 2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className={`${css.panel} ${css.panelEarth}`}>
              <div className={css.panelText}>
                <Eyebrow>ГЦБ</Eyebrow>
                <h2>Государственные облигации — понятная доходность без&nbsp;сюрпризов</h2>
                <ArrowButton href="/gcb" label="Перейти к ГЦБ" />
              </div>
              <div className={css.cardScene} aria-hidden="true">
                <div className={css.bond}>
                  <div className={css.chip} />
                  <span className={css.bondKind}>Государственная ценная бумага</span>
                  <b>{auction ? auction.type : "Казначейские облигации"}</b>
                  <span className={css.bondMeta}>
                    {auction ? `Аукцион ${auction.date} · ${auction.volume}` : "Аукционы Минфина КР"}
                  </span>
                  <span className={css.bondMark}>КФБ</span>
                </div>
              </div>
            </section>
          </div>

          {/* 4. Манифест антиквой. */}
          <section className={css.manifest}>
            <svg className={css.doodle} viewBox="0 0 180 160" aria-hidden="true" data-reveal="fade">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <g key={i}>
                  <path d={`M96 ${128 - i * 18}v12a38 9 0 0 0 76 0v-12`} fill="#8f8f8f" />
                  <ellipse cx="134" cy={128 - i * 18} rx="38" ry="9" fill="#bdbdbd" />
                </g>
              ))}
              <path d="M10 150 L40 118 L58 130 L92 74" fill="none" />
              <path d="M76 72 L94 72 L94 90" fill="none" />
            </svg>
            <h2 data-reveal="up">Добро пожаловать на&nbsp;рынок капитала</h2>
            <p data-reveal="up">
              Зачем нужна биржа? Чтобы сбережения работали, а компании росли. Покупайте акции крупнейших предприятий
              страны, вкладывайте в государственные облигации, следите за каждой сделкой. Открыто, по правилам и
              под надзором регулятора.
            </p>
            <small data-reveal="fade">
              По данным торгов {sessionDate}: {data.issuers} эмитентов, {data.listed} компаний в листинге, капитализация
              индекса {num(data.index.capitalization, 1)} млн сом.
            </small>
          </section>

          <div className={css.stack}>
            <section className={`${css.panel} ${css.panelForest}`}>
              <div className={css.bars} aria-hidden="true">
                {[62, 88, 40, 74, 96, 55, 80, 34, 70].map((h, i) => (
                  <span key={i} style={{ "--h": `${h}%`, "--i": i } as CSSProperties} />
                ))}
              </div>
              <div className={css.panelText}>
                <Eyebrow>Котировки</Eyebrow>
                <h2>Цены, объёмы и&nbsp;сделки — сразу после каждой сессии</h2>
                <ArrowButton href="/market/quotes" label="Открыть котировки" />
              </div>
            </section>

            <section className={`${css.panel} ${css.panelDawn}`}>
              <div className={css.panelText}>
                <Eyebrow>Листинг</Eyebrow>
                <h2>Привлеките капитал для своей компании. Без&nbsp;банковского кредита.</h2>
                <ArrowButton href="/listing" label="Узнать о листинге" />
              </div>
              <div className={css.docs} aria-hidden="true">
                <div>
                  <span>Эмитентов</span>
                  <b>{data.issuers}</b>
                </div>
                <div>
                  <span>В листинге</span>
                  <b>{data.listed}</b>
                </div>
                <div>
                  <span>Бумаг на торгах</span>
                  <b>{data.quotes.total}</b>
                </div>
              </div>
            </section>
          </div>

          {/* 5. Лента котировок. */}
          <div className={css.ticker} aria-label="Котировки последней сессии">
            <div className={css.tickerTrack}>
              {[0, 1].map((copy) => (
                <ul key={copy} aria-hidden={copy === 1 ? "true" : undefined}>
                  {ticker.map((item) => (
                    <li key={item.ticker}>
                      <b>{item.ticker}</b>
                      <span>{num(item.price, 2)}</span>
                      {item.change ? <em data-up={item.change > 0 ? "" : undefined}>{pct(item.change)}</em> : null}
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>

          {/* 6. Жёлтая карточка «Итоги торгов». */}
          <section className={css.digestWrap}>
            <div className={css.digest} data-reveal="zoom">
              <h2>
                ИТОГИ <span className={css.coinFace} aria-hidden="true">с</span>
              </h2>
              <p>
                Итоги торгов за {sessionDate}: {num(data.volume.volumeMln, 1)} млн сом, {num(data.volume.trades)} сделок — коротко,
                по делу и без лишних слов
              </p>
              <Link href="/market" className={css.outline}>
                Смотреть итоги торгов
              </Link>
            </div>
          </section>

          {/* 7. Финал: доверие в цифре, монеты и бегущие слова. */}
          <section className={css.final}>
            <h2 data-reveal="up">
              Нам доверяют <span data-count={data.issuers}>{data.issuers}</span> эмитентов
            </h2>
            <p className={css.tick}>
              На бирже торгуются{" "}
              <span className={css.tickWindow}>
                <span className={css.tickTrack}>
                  {["акции", "облигации", "ГЦБ", "металлы", "акции"].map((word, i) => (
                    <span key={i}>{word}</span>
                  ))}
                </span>
              </span>
            </p>
            <Link href="/members" className={css.outline}>
              Начать
            </Link>
            <div className={css.coins} aria-hidden="true">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <span key={i} style={{ "--i": i } as CSSProperties}>
                  <i>КФБ</i>
                </span>
              ))}
            </div>
          </section>
        </main>

        <footer className={css.footer}>
          <div className={css.footCols}>
            <div>
              <h3>О бирже</h3>
              <Link href="/about">О компании</Link>
              <Link href="/news">Новости</Link>
              <Link href="/contacts">Контакты</Link>
            </div>
            <div>
              <h3>Рынок</h3>
              <Link href="/market">Торги</Link>
              <Link href="/market/index">Индекс KSE</Link>
              <Link href="/gcb">ГЦБ</Link>
            </div>
            <div>
              <h3>Участникам</h3>
              <Link href="/members">Инвесторам</Link>
              <Link href="/listing">Эмитентам</Link>
              <Link href="/disclosure">Раскрытие информации</Link>
            </div>
            <div>
              <h3>Документы</h3>
              <Link href="/documents">Правила и положения</Link>
              <Link href="/tariffs">Тарифы</Link>
              <Link href={EDU_URL} {...linkProps(EDU_URL)}>
                Учебный центр
              </Link>
            </div>
          </div>
          <div className={css.legal}>
            <p>{data.contacts.address}</p>
            <p>
              {data.contacts.phones.join(", ")}
              {data.contacts.email ? ` · ${data.contacts.email}` : ""}
            </p>
            {data.contacts.license ? <p>{data.contacts.license}</p> : null}
            <p>{data.contacts.copyright}</p>
          </div>
        </footer>

        <PauseButton />
        <ConceptSwitch current="prosto" />
      </div>
    </ConceptPage>
  );
}
