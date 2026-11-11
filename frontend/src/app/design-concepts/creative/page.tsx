import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Dela_Gothic_One, Onest } from "next/font/google";
import { ConceptPage, Words } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { linkProps, nav, num, pct, steps } from "../_shared/data";
import { audiences, indexSeries, keyFacts, market, news, quotes } from "../_shared/mock";
import css from "./creative.module.css";

// Концепция 5 — Creative: ночное небо над Ала-Тоо, где линия гор — это индекс KSE. Строгая палитра: индиго и один акцент — коралл. Демо-данные из _shared/mock.ts.
const display = Dela_Gothic_One({ subsets: ["latin", "cyrillic"], weight: "400", variable: "--c-display" });
const body = Onest({ subsets: ["latin", "cyrillic"], variable: "--c-body" });

export const metadata: Metadata = { title: "5 · Creative" };

const W = 1440;
const H = 420;

/** Хребет из ряда значений: точки ряда — вершины, между ними добавляются «зазубрины», чтобы линия читалась как горы. */
function ridge(values: number[], top: number, jag: number, seed: number, span = 1) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W * span, top + (1 - (v - min) / (max - min || 1)) * (H - top - 40)]);
  let line = `M${pts[0][0]} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const my = (y0 + y1) / 2 + Math.sin(i * seed) * jag;
    line += ` L${((x0 + x1) / 2).toFixed(1)} ${my.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  const area = `${line}${span < 1 ? ` L${W} ${(last[1] + 30).toFixed(1)}` : ""} L${W} ${H} L0 ${H} Z`;
  return { line, area, last };
}

// Широкие массивы с вершинами разной высоты; мелкие колебания дают скальные уступы.
const peaks = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => 0.3 + 0.7 * Math.abs(Math.sin(i * 0.42 + seed)) * (0.65 + 0.35 * Math.cos(i * 1.7 + seed)) + 0.06 * Math.sin(i * 3.1));

const far = ridge(peaks(34, 1.1), 30, 8, 2.3);
const mid = ridge(peaks(26, 3.7), 120, 10, 1.7);
// Ближний хребет — настоящий ряд индекса (каждая третья точка), без случайных зазубрин; справа от вершины — спуск.
const front = ridge(
  indexSeries.filter((_, i) => i % 3 === 0),
  190,
  0,
  1,
  0.9,
);

const stars = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 37.7) % 100,
  y: (i * 23.3) % 62,
  size: 1 + (i % 3),
  delay: (i % 7) * 0.6,
}));

// Расстановка «созвездия»: центры кругов в процентах поля.
const spots = [
  [22, 40],
  [48, 28],
  [72, 44],
  [36, 74],
  [89, 22],
  [60, 76],
  [9, 78],
  [84, 80],
  [7, 20],
  [94, 52],
];
const maxVolume = Math.max(...quotes.map((q) => q.volume));

const words = ["Акции", "Облигации", "ГЦБ", "Золото", "Листинг", "Индекс KSE"];

/** Тюндюк — венец юрты, орнамент первого экрана. */
function Tunduk({ className }: { className: string }) {
  const bows = [38, 50, 62];
  const curves = bows.map((y) => <path key={y} d={`M10 ${y} C 32 ${y - 12}, 68 ${y - 12}, 90 ${y}`} />);
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" />
      <circle cx="50" cy="50" r="40" />
      <g>{curves}</g>
      <g transform="rotate(90 50 50)">{curves}</g>
    </svg>
  );
}

export default function CreativeConcept() {
  const d = (ms: number) => ({ "--kc-d": `${ms}ms` }) as CSSProperties;

  return (
    <ConceptPage accent="#ff6b4a">
      <div className={`${css.page} ${display.variable} ${body.variable}`}>
        <a className={css.skip} href="#main">
          Перейти к содержимому
        </a>

        <header className={css.header} data-intro="fade" style={d(900)}>
          <Link href="/design-concepts/creative" className={css.brand} aria-label="Кыргызская фондовая биржа — главная">
            <Image src="/brand/kse-mark.png" alt="" width={30} height={28} priority />
            <span>KSE</span>
          </Link>
          <nav className={css.nav} aria-label="Основное меню">
            {nav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/members" className={css.headCta}>
            Брокеры ↗
          </Link>
          <details className={css.menu}>
            <summary>Меню</summary>
            <nav aria-label="Меню (мобильное)">
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href="/members">Брокеры</Link>
            </nav>
          </details>
        </header>

        <main id="main">
          <section className={css.hero} aria-labelledby="c-hero" data-spotlight>
            <div className={css.stars} aria-hidden="true">
              {stars.map((s, i) => (
                <i key={i} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }} />
              ))}
            </div>
            <Tunduk className={css.tunduk} />

            <div className={css.heroText}>
              <p className={css.kicker} data-intro="fade" style={d(100)}>
                Кыргызская фондовая биржа · с 1994 года
              </p>
              <h1 id="c-hero" data-intro="words" style={d(200)}>
                <Words text="Рынок с видом" />
                <br />
                <em>
                  <Words text="на Ала-Тоо" from={3} />
                </em>
              </h1>
              <p className={css.lead} data-intro style={d(700)}>
                Линия гор внизу — это индекс KSE за последние 90 торговых дней. Акции, облигации, ГЦБ и золото — через лицензированных брокеров.
              </p>
              <div className={css.actions} data-intro style={d(850)}>
                <Link href="/members" className={css.btnHot}>
                  Выбрать брокера <span aria-hidden="true">↗</span>
                </Link>
                <Link href="/market/quotes" className={css.btnLine}>
                  Котировки
                </Link>
              </div>
            </div>

            <div className={css.range} aria-hidden="true">
              <svg className={css.far} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" data-parallax="0.04">
                <defs>
                  <linearGradient id="c-snow" x1="0" y1="40" x2="0" y2="170" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#e9ecff" />
                    <stop offset="0.35" stopColor="#7d86c9" />
                    <stop offset="1" stopColor="#2a2f6b" />
                  </linearGradient>
                </defs>
                <path d={far.area} fill="url(#c-snow)" />
              </svg>
              <svg className={css.mid} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" data-parallax="0.1">
                <path d={mid.area} />
              </svg>
              <svg className={css.front} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" data-parallax="0.16">
                <path className={css.frontArea} d={front.area} />
                <path className={css.frontLine} d={front.line} data-intro="draw" style={d(600)} />
              </svg>
              {/* Вершина хребта — последнее значение индекса. */}
              <span className={css.peak} style={{ left: `${(front.last[0] / W) * 100}%`, top: `${(front.last[1] / H) * 100}%` }} data-parallax="0.16">
                <i />
                <span data-intro="zoom" style={d(2400)}>
                  KSE <b>{num(market.index, 2)}</b> {pct(market.indexChange)}
                </span>
              </span>
            </div>
            <p className={css.scrollHint} aria-hidden="true">
              Листайте
            </p>
          </section>

          <div className={css.marquee} aria-hidden="true">
            {[0, 1].map((row) => (
              <div key={row} className={row ? css.rowBack : css.rowFwd}>
                {[0, 1].map((copy) => (
                  <span key={copy}>
                    {words.map((w) => (
                      <span key={w}>
                        {w} <i>✦</i>{" "}
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            ))}
          </div>

          <section className={css.sky} aria-labelledby="c-sky">
            <header className={css.head} data-reveal>
              <h2 id="c-sky">Созвездие рынка</h2>
              <p>Размер круга — объём торгов, цвет — изменение цены за сессию {market.sessionDate}. Нажмите на бумагу, чтобы открыть котировки.</p>
            </header>
            <div className={css.field}>
              <svg className={css.links} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" data-draw>
                <polyline points={spots.map(([x, y]) => `${x},${y}`).join(" ")} />
              </svg>
              <ul data-stagger>
                {quotes.map((q, i) => {
                  const size = Math.round(70 + Math.sqrt(q.volume / maxVolume) * 110);
                  return (
                    <li
                      key={q.ticker}
                      className={q.change > 0 ? css.starUp : q.change < 0 ? css.starDown : css.starFlat}
                      style={{ left: `${spots[i][0]}%`, top: `${spots[i][1]}%`, "--size": `${size}px`, "--float": `${-i * 0.9}s` } as CSSProperties}
                    >
                      <Link href={`/market/quotes?q=${q.ticker}`}>
                        <b>{q.ticker}</b>
                        <span>{pct(q.change)}</span>
                        <small>{q.name}</small>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <section className={css.doorsWrap} aria-labelledby="c-doors">
            <header className={css.head} data-reveal>
              <h2 id="c-doors">Три двери на биржу</h2>
            </header>
            <ul className={css.doors} data-reveal>
              {audiences.map((a, i) => (
                <li key={a.title}>
                  <Link href={a.href}>
                    <Image src={a.photo} alt="" fill sizes="(max-width: 900px) 100vw, 50vw" />
                    <span className={css.doorNo}>0{i + 1}</span>
                    <span className={css.doorBody}>
                      <b>{a.title}</b>
                      <span>{a.text}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className={css.path} aria-labelledby="c-path">
            <header className={css.head} data-reveal>
              <h2 id="c-path">Путь инвестора</h2>
              <p>Четыре шага — карточки складываются в стопку, пока вы листаете.</p>
            </header>
            <ol className={css.stack}>
              {steps.map((s, i) => (
                <li key={s.title} style={{ "--i": i } as CSSProperties}>
                  <Link href={s.href} {...linkProps(s.href)}>
                    <span className={css.stepNo}>{i + 1}</span>
                    <span className={css.stepTitle}>{s.title}</span>
                    <span className={css.stepText}>{s.text}</span>
                    <span className={css.stepGo} aria-hidden="true">
                      ↗
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section className={css.press} aria-labelledby="c-press">
            <header className={css.head} data-reveal>
              <h2 id="c-press">Новости биржи</h2>
              <Link href="/news">Все новости ↗</Link>
            </header>
            <ul data-stagger>
              {news.slice(0, 3).map((n) => (
                <li key={n.slug}>
                  <Link href="/news">
                    <span className={css.clipPhoto}>
                      <Image src={n.photo} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" />
                    </span>
                    <small>
                      {n.tag} · {n.date}
                    </small>
                    <b>{n.title}</b>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className={css.facts} aria-label="Биржа в цифрах" data-stagger>
            {keyFacts.map((f) => (
              <div key={f.label}>
                <b data-count={f.value} data-plain>
                  {f.value}
                </b>
                <span>{f.label}</span>
              </div>
            ))}
          </section>

          <section className={css.cta} aria-labelledby="c-cta">
            <p data-reveal>Готовы к первой сделке?</p>
            <h2 id="c-cta" data-reveal="zoom">
              <Link href="/members" data-spotlight>
                Начните с брокера ↗
              </Link>
            </h2>
          </section>
        </main>

        <footer className={css.footer}>
          <div>
            <b>ЗАО «Кыргызская фондовая биржа»</b>
            <span>720010, г. Бишкек, ул. Московская, 172</span>
          </div>
          <nav aria-label="Разделы">
            {nav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div>
            <a href="tel:+996312311484">+996 312 31 14 84</a>
            <a href="mailto:office@kse.kg">office@kse.kg</a>
          </div>
          <p className={css.demo}>Макет с демонстрационными данными: котировки, новости и события вымышлены.</p>
        </footer>
        <ConceptSwitch current="creative" />
      </div>
    </ConceptPage>
  );
}
