"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { formatChange, formatSom } from "@/data/catalog";
import { useTr } from "@/lib/use-tr";
import styles from "./HomeHero.module.css";

/** Как свечи встроены в фон: по кольцу, внутри стеклянных шариков или полосой вдоль низа. */
export type HeroCandles = "glass" | "ring" | "orbs" | "strip";

type Props = {
  index: { value: number; change: number; capitalization: number };
  volume: { value: number; change: number; trades: number };
  listing: { total: number };
  candles?: HeroCandles;
};

// Абстрактный фон баннера: тонкие концентрические кольца и «стеклянные» сферы.
// Цветовые пятна под ними — отдельные элементы .blob в CSS.
const RINGS = [140, 220, 300, 380, 460, 540];

// Шарики не вращаются по орбитам, а мягко покачиваются на месте — у каждого свой ритм.
const ORBS = [
  { cx: 1070, cy: 120, r: 46, duration: 9, delay: 0 },
  { cx: 891, cy: 470, r: 30, duration: 11, delay: -4 },
  { cx: 1500, cy: 420, r: 16, duration: 8, delay: -2 },
];

// Свечи — второстепенная деталь: стоят «зубцами» по кольцу радиуса 300, как круговой график, и вращаются вместе с кольцами.
const CENTER = { x: 1220, y: 380 };
const CANDLE_RING = 300;
const CANDLE_COUNT = 48;

/** Целочисленный хеш вместо Math.random — одинаково на сервере и в браузере. */
function noise(n: number) {
  let h = Math.imul(n + 7, 2654435761) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0;
  return (h % 10000) / 10000;
}

const r1 = (v: number) => Math.round(v * 10) / 10;

/** Высота над кольцом (px): плавные волны с шумом — замыкается по кругу без скачка. */
const LEVELS = Array.from({ length: CANDLE_COUNT + 1 }, (_, i) => {
  const t = (i / CANDLE_COUNT) * Math.PI * 2;
  return 34 + 16 * Math.sin(t * 2) + 10 * Math.sin(t * 5 + 1) + (noise(i % CANDLE_COUNT) - 0.5) * 44;
});

const RING_CANDLES = Array.from({ length: CANDLE_COUNT }, (_, i) => {
  const open = LEVELS[i];
  const close = LEVELS[i + 1];
  const lo = Math.min(open, close);
  const hi = Math.max(open, close, lo + 10);
  return {
    angle: r1((i / CANDLE_COUNT) * 360),
    up: close >= open,
    lo: r1(lo),
    hi: r1(hi),
    wickLo: r1(Math.max(lo - 3 - noise(i + 300) * 9, 2)),
    wickHi: r1(hi + 3 + noise(i + 600) * 10),
  };
});

/** Мини-график внутри шарика: несколько свечей с ростом, координаты — доли радиуса. */
function orbCandles(seed: number, count: number) {
  let price = 0;
  return Array.from({ length: count }, (_, i) => {
    const open = price;
    const move = (noise(seed + i) - 0.32) * 0.5;
    const close = open + move;
    price = close;
    return { open, close, high: Math.max(open, close) + 0.06 + noise(seed + i + 50) * 0.1, low: Math.min(open, close) - 0.06 - noise(seed + i + 90) * 0.1 };
  });
}

/** Шарики для варианта «свечи внутри»: крупнее, чтобы график читался. */
const LENS_ORBS = [
  { cx: 1070, cy: 150, r: 74, duration: 9, delay: 0, seed: 11 },
  { cx: 880, cy: 405, r: 50, duration: 11, delay: -4, seed: 37 },
  { cx: 1400, cy: 290, r: 34, duration: 8, delay: -2, seed: 73 },
];

function LensOrb({ orb }: { orb: (typeof LENS_ORBS)[number] }) {
  const count = 7;
  const data = orbCandles(orb.seed, count);
  const lo = Math.min(...data.map((c) => c.low));
  const hi = Math.max(...data.map((c) => c.high));
  const w = orb.r * 1.3;
  const h = orb.r * 0.95;
  const step = w / count;
  const x = (i: number) => r1(orb.cx - w / 2 + step * i + step / 2);
  const y = (v: number) => r1(orb.cy + h / 2 - ((v - lo) / (hi - lo)) * h);
  return (
    <g className={styles.lens} style={{ animationDuration: `${orb.duration}s`, animationDelay: `${orb.delay}s` }}>
      <circle className={styles.orb} cx={orb.cx} cy={orb.cy} r={orb.r} fill="url(#hero-orb)" />
      <g clipPath={`url(#hero-lens-${orb.seed})`}>
        {data.map((c, i) => {
          const top = y(Math.max(c.open, c.close));
          const height = Math.max(r1(Math.abs(y(c.open) - y(c.close))), 2);
          return (
            <g key={i} className={c.close >= c.open ? styles.candleUp : styles.candleDown} style={{ animationDelay: `${0.6 + i * 0.08}s` }}>
              <line x1={x(i)} x2={x(i)} y1={y(c.high)} y2={y(c.low)} />
              <rect x={r1(x(i) - step * 0.3)} y={top} width={r1(step * 0.6)} height={height} rx="1" />
            </g>
          );
        })}
      </g>
    </g>
  );
}

/** Полоса свечей вдоль низа: ряд повторён дважды, чтобы бесконечно и бесшовно плыть влево. */
const STRIP_COUNT = 60;
const STRIP = (() => {
  const levels = Array.from({ length: STRIP_COUNT + 1 }, (_, i) => {
    const t = (i / STRIP_COUNT) * Math.PI * 2;
    return 50 + 18 * Math.sin(t * 3) + 8 * Math.sin(t * 7 + 2) + (noise(i % STRIP_COUNT) - 0.5) * 46;
  });
  return Array.from({ length: STRIP_COUNT }, (_, i) => {
    const open = levels[i];
    const close = levels[i + 1];
    return {
      up: close >= open,
      top: r1(100 - Math.max(open, close)),
      height: r1(Math.max(Math.abs(open - close), 7)),
      high: r1(100 - Math.max(open, close) - 3 - noise(i + 200) * 8),
      low: r1(100 - Math.min(open, close) + 3 + noise(i + 400) * 8),
    };
  });
})();

function CandleStrip() {
  const step = 2000 / STRIP_COUNT;
  return (
    <svg className={styles.strip} viewBox="0 0 2000 110" preserveAspectRatio="none" aria-hidden="true">
      <g className={styles.stripTrack}>
        {[0, 2000].map((offset) =>
          STRIP.map((c, i) => {
            const cx = r1(offset + step * i + step / 2);
            return (
              <g key={`${offset}-${i}`} className={c.up ? styles.candleUp : styles.candleDown}>
                <line x1={cx} x2={cx} y1={c.high} y2={c.low} vectorEffect="non-scaling-stroke" />
                <rect x={r1(cx - step * 0.28)} y={c.top} width={r1(step * 0.56)} height={c.height} rx="1.5" />
              </g>
            );
          }),
        )}
      </g>
    </svg>
  );
}

const GLASS_BODY = 24;
const GLASS_STEP = 47;
/** Изменение цены за свечу (минус — вверх): рост с откатами; 20 свечей растянуты на всю правую часть баннера. */
const GLASS_MOVES = [-30, -25, 18, -35, -20, 25, -30, -18, 15, -32, -22, 16, -28, -24, 14, -30, -20, 15, -26, -23].map((m) => m * 1.45);
const GLASS_CANDLES = (() => {
  let price = 420;
  return GLASS_MOVES.map((move, i) => {
    const open = price;
    const close = price + move;
    price = close;
    const top = Math.min(open, close);
    const bottom = Math.max(open, close, top + 22);
    return {
      x: 32 + i * GLASS_STEP,
      top,
      bottom,
      up: move < 0,
      high: top - 10 - Math.round(noise(i + 900) * 14),
      low: bottom + 10 + Math.round(noise(i + 950) * 14),
    };
  });
})();

/** Стеклянные свечи — отдельный слой на всю правую часть баннера (растягивается по ширине и высоте). Стекло слегка тонировано: рост — зелёный, падение — красный. */
function GlassCandles() {
  return (
    <svg className={styles.glassLayer} viewBox="0 0 1000 450" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient id="hero-glass-up" cx="35%" cy="25%" r="90%">
          <stop offset="0" stopColor="var(--glass-hi)" />
          <stop offset="1" stopColor="var(--glass-up)" />
        </radialGradient>
        <radialGradient id="hero-glass-down" cx="35%" cy="25%" r="90%">
          <stop offset="0" stopColor="var(--glass-hi)" />
          <stop offset="1" stopColor="var(--glass-down)" />
        </radialGradient>
      </defs>
      <g className={styles.glassCandles}>
        {GLASS_CANDLES.map((c, i) => (
          <g
            key={c.x}
            className={`${styles.floating} ${c.up ? styles.glassUp : styles.glassDown}`}
            style={{ animationDuration: `${9 + (i % 3) * 1.5}s`, animationDelay: `${-i * 1.1}s` }}
          >
            <line x1={c.x} x2={c.x} y1={c.high} y2={c.top} vectorEffect="non-scaling-stroke" />
            <line x1={c.x} x2={c.x} y1={c.bottom} y2={c.low} vectorEffect="non-scaling-stroke" />
            <rect x={c.x - GLASS_BODY / 2} y={c.top} width={GLASS_BODY} height={c.bottom - c.top} rx="4" vectorEffect="non-scaling-stroke" fill={c.up ? "url(#hero-glass-up)" : "url(#hero-glass-down)"} />
          </g>
        ))}
      </g>
    </svg>
  );
}

function HeroScene({ candles }: { candles: HeroCandles }) {
  return (
    <svg className={styles.scene} viewBox="0 0 1600 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="hero-orb" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="var(--orb-hi)" />
          <stop offset="1" stopColor="var(--orb-lo)" />
        </radialGradient>
        {candles === "orbs"
          ? LENS_ORBS.map((orb) => (
              <clipPath key={orb.seed} id={`hero-lens-${orb.seed}`}>
                <circle cx={orb.cx} cy={orb.cy} r={orb.r - 2} />
              </clipPath>
            ))
          : null}
      </defs>
      <g className={styles.rings}>
        {RINGS.map((r, i) => (
          <circle
            key={r}
            cx="1220"
            cy="380"
            r={r}
            strokeDasharray={i === 2 ? "2 10" : undefined}
            style={{ animationDelay: `${0.15 + i * 0.12}s` }}
          />
        ))}
      </g>
      {candles === "ring" ? (
      <g className={styles.candleRing}>
        {RING_CANDLES.map((c, i) => (
          <g
            key={c.angle}
            className={c.up ? styles.candleUp : styles.candleDown}
            transform={`rotate(${c.angle} ${CENTER.x} ${CENTER.y})`}
            style={{ animationDelay: `${0.4 + i * 0.025}s` }}
          >
            <line x1={CENTER.x} x2={CENTER.x} y1={CENTER.y - CANDLE_RING - c.wickHi} y2={CENTER.y - CANDLE_RING - c.wickLo} />
            <rect x={CENTER.x - 8} y={CENTER.y - CANDLE_RING - c.hi} width="16" height={r1(c.hi - c.lo)} rx="1.5" />
          </g>
        ))}
      </g>
      ) : null}
      {candles === "orbs"
        ? LENS_ORBS.map((orb) => <LensOrb key={orb.seed} orb={orb} />)
        : ORBS.map((orb) => (
            <circle
              key={orb.r}
              className={`${styles.orb} ${styles.floating}`}
              cx={orb.cx}
              cy={orb.cy}
              r={orb.r}
              fill="url(#hero-orb)"
              style={{ animationDuration: `${orb.duration}s`, animationDelay: `${orb.delay}s` }}
            />
          ))}
    </svg>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export function HomeHero({ index, volume, listing, candles = "glass" }: Props) {
  const tr = useTr();
  const photoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const photo = photoRef.current;
    if (!photo || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      photo.style.setProperty("--hero-shift", `${(Math.min(window.scrollY, 800) * 0.12).toFixed(1)}px`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const tone = (value: number) => (value < 0 ? styles.down : value > 0 ? styles.up : undefined);
  const figure = index.value.toLocaleString("ru-KG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <section className={styles.hero} data-candles={candles} aria-label={tr("Главный баннер")}>
      <div className={styles.photo} aria-hidden="true" ref={photoRef}>
        <span className={`${styles.blob} ${styles.blobA}`} />
        <span className={`${styles.blob} ${styles.blobB}`} />
        <span className={`${styles.blob} ${styles.blobC}`} />
        <HeroScene candles={candles} />
        {candles === "strip" ? <CandleStrip /> : null}
        {candles === "glass" ? <GlassCandles /> : null}
      </div>

      <div className={styles.main}>
        <div className={styles.copy}>
          <h1>{tr("Инвестиции в стабильное будущее")}</h1>
          <p>
            {tr(
              "Кыргызская фондовая биржа — это прозрачный и надежный механизм для привлечения капитала, развития бизнеса и роста экономики страны.",
            )}
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/market">
              {tr("Торговать")}
              <Arrow />
            </Link>
            <Link className={styles.link} href="/about">
              {tr("Подробнее")}
              <Arrow />
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.stats}>
        <Link className={styles.stat} href="/market/index">
          <span className={styles.label}>{tr("Индекс KSE")}</span>
          <span className={styles.value}>
            <b>{figure}</b>
            <em className={tone(index.change)}>{formatChange(index.change)}</em>
          </span>
        </Link>
        <Link className={styles.stat} href="/market/index">
          <span className={styles.label}>{tr("Капитализация")}</span>
          <span className={styles.value}>
            <b>{formatSom(index.capitalization)}</b>
            <small>{tr("млрд сом")}</small>
          </span>
        </Link>
        <Link className={styles.stat} href="/market">
          <span className={styles.label}>{tr("Объём торгов")}</span>
          <span className={styles.value}>
            <b>{formatSom(volume.value)}</b>
            <small>{tr("млн сом")}</small>
            <em className={tone(volume.change)}>{formatChange(volume.change)}</em>
          </span>
        </Link>
        <Link className={styles.stat} href="/market/quotes">
          <span className={styles.label}>{tr("Инструменты")}</span>
          <span className={styles.value}>
            <b>{listing.total}</b>
            <small>
              {volume.trades} {tr("сделок")}
            </small>
          </span>
        </Link>
      </div>
    </section>
  );
}
