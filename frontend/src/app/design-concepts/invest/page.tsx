import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Manrope } from "next/font/google";
import { EDU_URL } from "@/lib/edu";
import { ConceptPage } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, longDate, num, pct, steps } from "../_shared/data";
import { loadHomeData, smoothPath } from "../_shared/home-data";
import { Icon } from "../_shared/Icon";
import css from "./invest.module.css";

/*
 * Концепция 44 — «Инвест»: по мотивам сайта брокера Freedom24, но для биржи. Светлый первый экран с крупным
 * заголовком и иллюстрацией (фото биржи в круге и объёмные свечи), затем зигзаг из блоков «текст + иллюстрация
 * на сером круге», карточка «Начните инвестировать» и светлый подвал. Иллюстрации нарисованы SVG и CSS,
 * цифры в них настоящие. Бирюза КФБ вместо зелёного, Manrope.
 */
const manrope = Manrope({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"], variable: "--iv-font" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "44 · Инвест" };

/** Объёмная свеча: передняя грань, боковая и верхняя, тень на полу. Тон — бирюзовый или графитовый. */
function Candle({ x, y, h, w = 34, tone, wick = 22 }: { x: number; y: number; h: number; w?: number; tone: "up" | "down"; wick?: number }) {
  const d = w * 0.42;
  const id = tone === "up" ? "iv-up" : "iv-down";
  const cx = x + w / 2 + d / 2;
  const stroke = tone === "up" ? "#2c7e87" : "#3b4a50";
  return (
    <g>
      <ellipse cx={cx} cy={y + h + 6} rx={w * 0.95} ry={7} fill="#0d2a2e" opacity="0.1" />
      <line x1={cx} y1={y - d / 2 - wick} x2={cx} y2={y - d / 2} stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-front)`} />
      <polygon points={`${x + w},${y} ${x + w + d},${y - d / 2} ${x + w + d},${y + h - d / 2} ${x + w},${y + h}`} fill={`url(#${id}-side)`} />
      <polygon points={`${x},${y} ${x + d},${y - d / 2} ${x + w + d},${y - d / 2} ${x + w},${y}`} fill={tone === "up" ? "#9fdce2" : "#8a979c"} />
    </g>
  );
}

function CandleDefs() {
  return (
    <defs>
      <linearGradient id="iv-up-front" x1="0" x2="1">
        <stop offset="0" stopColor="#57b6c0" />
        <stop offset="1" stopColor="#2c7e87" />
      </linearGradient>
      <linearGradient id="iv-up-side" x1="0" x2="1">
        <stop offset="0" stopColor="#1f5f66" />
        <stop offset="1" stopColor="#174a50" />
      </linearGradient>
      <linearGradient id="iv-down-front" x1="0" x2="1">
        <stop offset="0" stopColor="#5d6b71" />
        <stop offset="1" stopColor="#3b4a50" />
      </linearGradient>
      <linearGradient id="iv-down-side" x1="0" x2="1">
        <stop offset="0" stopColor="#27343a" />
        <stop offset="1" stopColor="#1c272c" />
      </linearGradient>
    </defs>
  );
}

/** Блок зигзага: текст с одной стороны, иллюстрация на сером круге — с другой. */
function Feature({ id, title, children, art, flip }: { id: string; title: ReactNode; children: ReactNode; art: ReactNode; flip?: boolean }) {
  return (
    <section className={css.feature} data-flip={flip || undefined} aria-labelledby={id}>
      <div className={css.art} data-reveal="fade">
        <span className={css.disc} aria-hidden="true" />
        {art}
      </div>
      <div className={css.copy} data-reveal="rise">
        <h2 id={id}>{title}</h2>
        {children}
      </div>
    </section>
  );
}

export default async function InvestConcept() {
  const data = await loadHomeData();
  const rows = data.instruments.filter((item) => item.price > 0).slice(0, 6);
  const chart = smoothPath(data.history, 220, 90, 6);
  const auction = data.auctions[0];
  const up = data.index.change >= 0;
  const leaders = data.leaders.slice(0, 4);
  const topVolume = Math.max(1, ...leaders.map((row) => row.volume));
  const typeCount = (...types: string[]) => data.instruments.filter((item) => types.includes(item.type)).length;
  // Пустые группы (например, металлы вне торгов) не показываем — «0» в фактах смотрится как ошибка.
  const facts = (
    [
      ["Акции", typeCount("stock")],
      ["Облигации и ГЦБ", typeCount("bond", "gcb")],
      ["Металлы", typeCount("metal")],
      ["Эмитентов", data.issuers],
    ] as const
  )
    .filter(([, value]) => value > 0)
    .slice(0, 3);
  const traded = data.volume.volumeMln > 0;

  return (
    <ConceptPage accent="#2c7e87">
      <div className={`${css.page} ${manrope.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        {/* Шапка: логотип, короткое меню, ссылка на брокеров и главная кнопка. */}
        <header className={css.header}>
          <div className={css.headInner}>
            <Link href="/design-concepts/invest" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
              <Image src="/brand/kse-mark.png" alt="" width={30} height={28} priority />
              <b>КФБ</b>
            </Link>
            <nav className={css.nav} aria-label="Основное меню">
              <Link href="/market">Торги</Link>
              <Link href="/market/quotes">Котировки</Link>
              <Link href="/listing">Листинг</Link>
              <Link href="/gcb">ГЦБ</Link>
              <Link href="/about">О бирже</Link>
            </nav>
            <div className={css.headActions}>
              <Link href="/members" className={css.headLink}>
                Брокеры
              </Link>
              <Link href="/members" className={css.btnSmall}>
                Начать
              </Link>
              <span className={css.lang}>Рус</span>
            </div>
          </div>
        </header>

        <main id="main">
          {/* 1. Первый экран. */}
          <section className={css.hero} aria-labelledby="iv-hero">
            <div className={css.heroInner}>
              <div className={css.heroText}>
                <h1 id="iv-hero" data-intro="rise">
                  Инвестиции
                  <br />
                  для каждого
                </h1>
                <ul className={css.heroLines} data-intro="fade" style={{ "--kc-d": "120ms" } as CSSProperties}>
                  <li>Акции, облигации и государственные бумаги Кыргызстана.</li>
                  <li>Торги на фондовой бирже страны — с 1994 года.</li>
                  <li>Сделки через лицензированных брокеров, под надзором регулятора.</li>
                </ul>
                <div className={css.heroCta} data-intro="fade" style={{ "--kc-d": "220ms" } as CSSProperties}>
                  <Link href="/members" className={css.btn}>
                    Начать инвестировать
                  </Link>
                  <span className={css.session}>
                    <i data-open={data.session.open || undefined} aria-hidden="true" />
                    {data.session.label}
                  </span>
                </div>
              </div>

              <div className={css.heroArt} data-intro="fade" style={{ "--kc-d": "160ms" } as CSSProperties}>
                <div className={css.heroPhoto}>
                  <Image src="/hero/kse-entrance-garden.jpg" alt="Здание Кыргызской фондовой биржи" fill priority sizes="(max-width: 900px) 80vw, 460px" />
                </div>
                <svg className={css.heroCandles} viewBox="0 0 560 420" aria-hidden="true">
                  <CandleDefs />
                  <Candle x={30} y={260} h={110} tone="down" />
                  <Candle x={88} y={200} h={160} tone="up" />
                  <Candle x={430} y={150} h={180} tone="up" w={38} />
                  <Candle x={494} y={250} h={100} tone="down" w={30} />
                </svg>
                <Link href="/market/index" className={css.heroCard}>
                  <span>Индекс KSE</span>
                  <b>{num(data.index.value, 2)}</b>
                  <em data-up={up || undefined}>{pct(data.index.change)}</em>
                </Link>
              </div>
            </div>
          </section>

          <div className={css.features}>
            {/* 2. Быстро и понятно — путь инвестора. */}
            <Feature
              id="iv-fast"
              title="Быстро и понятно"
              art={
                <div className={css.stackArt} aria-hidden="true">
                  {steps.slice(0, 3).map((step, i) => (
                    <div key={step.title} className={css.stackCard} style={{ "--i": i } as CSSProperties}>
                      <span>{i + 1}</span>
                      <b>{step.title}</b>
                      <i />
                    </div>
                  ))}
                  <div className={css.check}>
                    <Icon name="arrowRight" />
                  </div>
                </div>
              }
            >
              <p>
                Чтобы купить первую бумагу, нужно выбрать брокера — участника торгов биржи, открыть у него счёт и подать
                заявку. Сделка пройдёт на ближайшей торговой сессии.
              </p>
              <ol className={css.miniSteps}>
                {steps.map((step) => (
                  <li key={step.title}>
                    <Link href={step.href} {...linkProps(step.href)}>
                      {step.title}
                    </Link>
                  </li>
                ))}
              </ol>
            </Feature>

            {/* 3. Инструменты — ноутбук с котировками. */}
            <Feature
              id="iv-tools"
              flip
              title={`${num(data.quotes.total)} инструментов в торгах`}
              art={
                <div className={css.laptop} aria-hidden="true">
                  <div className={css.screen}>
                    <div className={css.screenBar}>
                      <i />
                      <i />
                      <i />
                      <span>Котировки</span>
                    </div>
                    <table>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.ticker}>
                            <td>{row.ticker}</td>
                            <td>{row.name}</td>
                            <td>{num(row.price, 2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className={css.base} />
                  {rows[0] ? (
                    <span className={css.chip} style={{ "--cx": "-4%", "--cy": "6%" } as CSSProperties}>
                      {rows[0].ticker} <b>{num(rows[0].price, 2)}</b>
                    </span>
                  ) : null}
                  {rows[1] ? (
                    <span className={css.chip} style={{ "--cx": "70%", "--cy": "-8%" } as CSSProperties}>
                      {rows[1].ticker} <b>{num(rows[1].price, 2)}</b>
                    </span>
                  ) : null}
                </div>
              }
            >
              <p>
                Акции и облигации кыргызских компаний, государственные ценные бумаги и драгоценные металлы — с котировками
                по каждой бумаге.
              </p>
              <dl className={css.facts}>
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{num(value)}</dd>
                  </div>
                ))}
              </dl>
              <Link href="/market/quotes" className={css.btn}>
                Смотреть котировки
              </Link>
            </Feature>

            {/* 4. Рынок сегодня — два телефона: индекс и итоги сессии. */}
            <Feature
              id="iv-index"
              title="Весь рынок — на одном экране"
              art={
                <div className={css.phones} aria-hidden="true">
                  <div className={css.phone} data-back="">
                    <div className={css.phoneScreen}>
                      {traded ? (
                        <>
                          <small>Итоги сессии</small>
                          <b>{data.volume.volumeMln >= 1 ? `${num(data.volume.volumeMln, 1)} млн сом` : `${num(data.volume.volumeMln * 1000)} тыс. сом`}</b>
                          <span>{num(data.volume.trades)} сделок</span>
                        </>
                      ) : (
                        <>
                          <small>Сессия</small>
                          <b>{data.session.label}</b>
                          <span>{data.session.hours}</span>
                        </>
                      )}
                      <small className={css.phoneLabel}>Лидеры недели</small>
                      <ul>
                        {leaders.map((leader) => (
                          <li key={leader.ticker}>
                            <span>{leader.ticker}</span>
                            <i style={{ "--w": `${Math.max(14, (leader.volume / topVolume) * 100)}%` } as CSSProperties} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className={css.phone}>
                    <div className={css.phoneScreen}>
                      <small>Индекс KSE</small>
                      <b>{num(data.index.value, 2)}</b>
                      <span data-up={up || undefined}>{pct(data.index.change)}</span>
                      {chart ? (
                        <svg viewBox="0 0 220 90" preserveAspectRatio="none">
                          <path d={chart.area} fill="rgba(87,182,192,.18)" />
                          <path d={chart.line} fill="none" stroke="#2c7e87" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                        </svg>
                      ) : null}
                      <p>
                        Капитализация
                        <b>{num(data.index.capitalization, 1)} млрд сом</b>
                      </p>
                    </div>
                  </div>
                </div>
              }
            >
              <p>Индекс биржи, итоги торговой сессии, лидеры недели и сделки — открыто на сайте, без регистрации.</p>
              <p>
                Следите за динамикой рынка, капитализацией и объёмом торгов. Сообщения эмитентов появляются в разделе
                раскрытия информации в день публикации.
              </p>
              <Link href="/market" className={css.btn}>
                Открыть торги
              </Link>
            </Feature>

            {/* 5. Аукционы ГЦБ — стопка документов. */}
            <Feature
              id="iv-gcb"
              flip
              title="Государственные ценные бумаги"
              art={
                <div className={css.docs} aria-hidden="true">
                  <div className={css.doc} data-n="1" />
                  <div className={css.doc} data-n="2" />
                  <div className={css.doc}>
                    <span>Минфин КР</span>
                    <i />
                    <i />
                    <i />
                    <i />
                    <em>ГЦБ</em>
                  </div>
                  {auction ? (
                    <div className={css.ticket}>
                      <small>Ближайший аукцион</small>
                      <b>{longDate(auction.date)}</b>
                      <span>{auction.type}</span>
                    </div>
                  ) : null}
                </div>
              }
            >
              <p>
                Биржа проводит аукционы по размещению государственных ценных бумаг Министерства финансов. Это надёжный
                инструмент для сбережений и диверсификации портфеля.
              </p>
              {auction ? (
                <p className={css.note}>
                  Ближайший аукцион — <b>{longDate(auction.date)}</b>, {auction.type}
                  {auction.volume ? `, объём ${auction.volume}` : ""}.
                </p>
              ) : null}
              <Link href="/gcb" className={css.btn}>
                Календарь аукционов
              </Link>
            </Feature>

            {/* 6. Для компаний — листинг. */}
            <Feature
              id="iv-listing"
              title="Привлекайте капитал через биржу"
              art={
                <div className={css.growth} aria-hidden="true">
                  <svg viewBox="0 0 420 340">
                    <CandleDefs />
                    <Candle x={60} y={230} h={70} tone="up" w={40} wick={10} />
                    <Candle x={140} y={170} h={130} tone="up" w={40} wick={10} />
                    <Candle x={220} y={110} h={190} tone="up" w={40} wick={10} />
                    <Candle x={300} y={50} h={250} tone="up" w={40} wick={10} />
                  </svg>
                  <div className={css.tag} style={{ "--tx": "0%", "--ty": "12%" } as CSSProperties}>
                    <Icon name="building" />
                    <span>
                      <b>{num(data.issuers)}</b> эмитентов
                    </span>
                  </div>
                  <div className={css.tag} style={{ "--tx": "50%", "--ty": "80%" } as CSSProperties}>
                    <Icon name="file" />
                    <span>
                      <b>{num(data.listed)}</b> в листинге
                    </span>
                  </div>
                </div>
              }
            >
              <p>
                Выпуск акций или облигаций на бирже открывает компании доступ к деньгам инвесторов, повышает доверие и
                прозрачность. Биржа сопровождает эмитента на каждом шаге.
              </p>
              <Link href="/listing" className={css.btn}>
                Условия листинга
              </Link>
            </Feature>
          </div>

          {/* 7. Карточка «Начните инвестировать». */}
          <section className={css.start} aria-labelledby="iv-start" data-reveal="rise">
            <div className={css.startPhoto}>
              <Image src="/hub/hub-members.jpg" alt="" fill sizes="(max-width: 900px) 90vw, 360px" />
            </div>
            <div className={css.startBody}>
              <h2 id="iv-start">Начните инвестировать</h2>
              <p>
                Доступ к акциям, облигациям и государственным бумагам Кыргызстана. Выберите брокера, разберитесь в
                основах в учебном центре биржи и подайте первую заявку.
              </p>
              <div className={css.choices}>
                <Link href="/members">
                  <Icon name="users" />
                  Выбрать брокера
                </Link>
                <Link href={EDU_URL} {...linkProps(EDU_URL)}>
                  <Icon name="book" />
                  Пройти курс в учебном центре
                </Link>
                <span className={css.or}>или</span>
                <Link href="/contacts">
                  <Icon name="phone" />
                  Задать вопрос бирже
                </Link>
              </div>
              <p className={css.small}>Биржа не открывает счета частным лицам — сделки заключаются через брокеров, участников торгов.</p>
            </div>
          </section>
        </main>

        {/* Светлый подвал: колонки ссылок, партнёры, юридический текст. */}
        <footer className={css.footer}>
          <div className={css.footCols}>
            <div>
              <h3>Рынок</h3>
              <Link href="/market">Торги</Link>
              <Link href="/market/quotes">Котировки</Link>
              <Link href="/market/index">Индекс KSE</Link>
              <Link href="/gcb">ГЦБ</Link>
              <Link href="/commodity">Товарный сектор</Link>
            </div>
            <div>
              <h3>Биржа</h3>
              <Link href="/about">О бирже</Link>
              <Link href="/members">Участники торгов</Link>
              <Link href="/listing">Листинг</Link>
              <Link href="/news">Новости</Link>
              <Link href={EDU_URL} {...linkProps(EDU_URL)}>
                Учебный центр
              </Link>
            </div>
            <div>
              <h3>Документы</h3>
              <Link href="/disclosure">Раскрытие информации</Link>
              <Link href="/documents">Правила и нормативы</Link>
              <Link href="/listing">Требования листинга</Link>
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

          {data.partners.length ? (
            <div className={css.footPartners}>
              <h3>Партнёры</h3>
              <ul>
                {data.partners.slice(0, 8).map((p) => (
                  <li key={p.slug}>
                    <Link href={`/about/partners/${p.slug}`} title={p.name}>
                      {p.logo ? <Image src={p.logo} alt={p.mark} width={110} height={36} unoptimized /> : <b>{p.mark}</b>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className={css.legal}>
            <p>
              {data.contacts.copyright}. {data.contacts.license ? `Лицензия ${data.contacts.license}. ` : ""}Информация на
              сайте не является инвестиционной рекомендацией. Инвестиции в ценные бумаги связаны с риском потери капитала;
              доходность в прошлом не гарантирует доходности в будущем.
            </p>
          </div>
        </footer>

        <ConceptSwitch current="invest" />
      </div>
    </ConceptPage>
  );
}
