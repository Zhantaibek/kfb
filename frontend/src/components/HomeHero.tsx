"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatChange, formatSom } from "@/data/catalog";
import { useMarketData } from "@/components/MarketDataProvider";
import { instrumentHref } from "@/lib/market-data";
import { useTr } from "@/lib/use-tr";
import { HeroHorizon } from "./HeroHorizon";
import { HeroRibbon } from "./HeroRibbon";
import { HeroCandleWave } from "./HeroCandleWave";
import {
  HeroCandleClock,
  HeroCandleFeed,
  HeroCandleField,
  HeroCandleMirror,
  HeroCandleOrbit,
  HeroCandleRise,
  HeroCandleSkyline,
  HeroCandleStairs,
} from "./HeroCandleScenes";
import styles from "./HomeHero.module.css";

/** Как свечи встроены в фон: по кольцу, внутри стеклянных шариков или полосой вдоль низа. */
export type HeroCandles = "skyline" | "stairs" | "mirror" | "clock" | "field" | "orbit" | "feed" | "rise" | "wave" | "ribbon" | "horizon" | "radial" | "bubbles" | "dial" | "peaks" | "glass" | "lines" | "dots" | "monument" | "ring" | "orbs" | "strip";

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

/** Свечи — отдельный слой на всю правую часть баннера (растягивается по ширине и высоте). Стекло слегка тонировано: рост — зелёный, падение — красный. */
function GlassCandles() {
  return (
    <svg className={styles.glassLayer} viewBox="0 0 1000 450" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        {/* Ровная заливка с лёгким переходом сверху вниз — без бликов, строго. */}
        <linearGradient id="hero-glass-up" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--candle-up)" stopOpacity="0.78" />
          <stop offset="1" stopColor="var(--candle-up)" stopOpacity="0.58" />
        </linearGradient>
        <linearGradient id="hero-glass-down" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--candle-down)" stopOpacity="0.78" />
          <stop offset="1" stopColor="var(--candle-down)" stopOpacity="0.58" />
        </linearGradient>
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
            <rect x={c.x - GLASS_BODY / 2} y={c.top} width={GLASS_BODY} height={c.bottom - c.top} rx="1" vectorEffect="non-scaling-stroke" fill={c.up ? "url(#hero-glass-up)" : "url(#hero-glass-down)"} />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** «Линии»: свечи тонким светящимся контуром — тем же языком, что и кольца. Рост — светлый контур с лёгкой заливкой, падение — пунктир. */
function LineCandles() {
  return (
    <svg className={`${styles.glassLayer} ${styles.lineLayer}`} viewBox="0 0 1000 450" preserveAspectRatio="none" aria-hidden="true">
      <g className={styles.glassCandles}>
        {GLASS_CANDLES.map((c, i) => (
          <g
            key={c.x}
            className={`${styles.floating} ${c.up ? styles.lineUp : styles.lineDown}`}
            style={{ animationDuration: `${9 + (i % 3) * 1.5}s`, animationDelay: `${-i * 1.1}s` }}
          >
            <line x1={c.x} x2={c.x} y1={c.high} y2={c.top} vectorEffect="non-scaling-stroke" />
            <line x1={c.x} x2={c.x} y1={c.bottom} y2={c.low} vectorEffect="non-scaling-stroke" />
            <rect x={c.x - GLASS_BODY / 2} y={c.top} width={GLASS_BODY} height={c.bottom - c.top} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** «Точки»: свечи собраны из мелких точек, как цифровой график из частиц. */
const DOT_STEP = 7;
function DotCandles() {
  return (
    <svg className={`${styles.glassLayer} ${styles.dotLayer}`} viewBox="0 0 1000 450" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <g className={styles.glassCandles}>
        {GLASS_CANDLES.map((c, i) => {
          const rows = Math.max(Math.round((c.bottom - c.top) / DOT_STEP), 2);
          const wickUp = Math.round((c.top - c.high) / DOT_STEP);
          const wickDown = Math.round((c.low - c.bottom) / DOT_STEP);
          const dots: [number, number, number][] = [];
          for (let r = 0; r <= rows; r++) for (const dx of [-DOT_STEP, 0, DOT_STEP]) dots.push([c.x + dx, c.top + r * DOT_STEP, 2.3]);
          for (let r = 1; r <= wickUp; r++) dots.push([c.x, c.top - r * DOT_STEP, 1.5]);
          for (let r = 1; r <= wickDown; r++) dots.push([c.x, c.top + rows * DOT_STEP + r * DOT_STEP, 1.5]);
          return (
            <g
              key={c.x}
              className={`${styles.floating} ${c.up ? styles.dotUp : styles.dotDown}`}
              style={{ animationDuration: `${9 + (i % 3) * 1.5}s`, animationDelay: `${-i * 1.1}s` }}
            >
              {dots.map(([x, y, r]) => (
                <circle key={`${x}-${y}`} cx={x} cy={r1(y)} r={r} />
              ))}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/** «Монумент»: пять крупных строгих свечей в центре колец — как главный символ, а не ряд графика. */
const MONUMENT = [
  { x: 120, top: 250, bottom: 380, high: 220, low: 410, up: true },
  { x: 220, top: 200, bottom: 300, high: 165, low: 330, up: true },
  { x: 320, top: 215, bottom: 275, high: 185, low: 305, up: false },
  { x: 420, top: 120, bottom: 255, high: 85, low: 285, up: true },
  { x: 520, top: 50, bottom: 160, high: 15, low: 190, up: true },
];

function MonumentCandles() {
  return (
    <svg className={`${styles.glassLayer} ${styles.monumentLayer}`} viewBox="40 0 560 470" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <g className={styles.glassCandles}>
        {MONUMENT.map((c, i) => (
          <g
            key={c.x}
            className={`${styles.floating} ${c.up ? styles.monumentUp : styles.monumentDown}`}
            style={{ animationDuration: `${10 + i}s`, animationDelay: `${-i * 1.7}s` }}
          >
            <line x1={c.x} x2={c.x} y1={c.high} y2={c.top} />
            <line x1={c.x} x2={c.x} y1={c.bottom} y2={c.low} />
            <rect x={c.x - 23} y={c.top} width="46" height={c.bottom - c.top} />
          </g>
        ))}
      </g>
    </svg>
  );
}

// «Тянь-Шань»: три слоя гор, передний гребень — график индекса, растущий вправо.
const PEAK_W = 900;
const PEAK_H = 420;

// Хребты начинаются левее viewBox — уходят под маску-затухание, без резкого края.
function ridge(seed: number, n: number, shape: (t: number) => number, amp: number, x0 = -420, x1 = PEAK_W) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const k = noise(seed + i);
    const zig = i % 2 ? amp * (0.3 + 0.7 * k) : -amp * (0.2 + 1.3 * k * k);
    return { x: r1(x0 + t * (x1 - x0)), y: r1(shape(t) + (i === 0 || i === n ? 0 : zig)) };
  });
}

const line = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
const area = (pts: { x: number; y: number }[]) =>
  `${line(pts)} L${PEAK_W} ${pts[pts.length - 1].y} L${PEAK_W} ${PEAK_H} L${pts[0].x} ${PEAK_H} Z`;

const PEAK_FAR = ridge(301, 17, (t) => 250 - 175 * Math.sin(Math.PI * (0.1 + t * 0.85)), 50);
const PEAK_MID = ridge(517, 21, (t) => 305 - 115 * Math.sin(Math.PI * (t * 1.05 - 0.02)), 32);
const PEAK_CHART = ridge(733, 30, (t) => 380 - 305 * Math.pow(t, 1.4), 22, -200, PEAK_W - 48);
const PEAK_END = PEAK_CHART[PEAK_CHART.length - 1];

function PeakScene() {
  return (
    <svg
      className={`${styles.glassLayer} ${styles.peakLayer}`}
      viewBox={`0 0 ${PEAK_W} ${PEAK_H}`}
      preserveAspectRatio="xMaxYMax meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="peak-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--peak-far)" />
          <stop offset="0.7" stopColor="var(--peak-far)" stopOpacity="0.5" />
          <stop offset="1" stopColor="var(--peak-far)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="peak-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--peak-mid)" />
          <stop offset="0.75" stopColor="var(--peak-mid)" stopOpacity="0.6" />
          <stop offset="1" stopColor="var(--peak-mid)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="peak-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--peak-front)" />
          <stop offset="1" stopColor="var(--peak-front)" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <g className={styles.peakFar}>
        <path d={area(PEAK_FAR)} fill="url(#peak-far)" />
        <path d={line(PEAK_FAR)} className={styles.peakEdge} />
      </g>
      <g className={styles.peakMid}>
        <path d={area(PEAK_MID)} fill="url(#peak-mid)" />
        <path d={line(PEAK_MID)} className={styles.peakEdge} />
      </g>
      <g className={styles.peakFront}>
        <path d={area(PEAK_CHART)} fill="url(#peak-front)" className={styles.peakFill} />
        <path d={line(PEAK_CHART)} className={styles.peakLine} pathLength={1} />
        {PEAK_CHART.filter((_, i) => i % 2 === 0 && i > 0 && i < PEAK_CHART.length - 1).map((p) => (
          <line key={p.x} x1={p.x} x2={p.x} y1={p.y + 6} y2={PEAK_H} className={styles.peakTick} />
        ))}
        <circle cx={PEAK_END.x} cy={PEAK_END.y} r="14" className={styles.peakPulse} />
        <circle cx={PEAK_END.x} cy={PEAK_END.y} r="5" className={styles.peakDot} />
      </g>
    </svg>
  );
}

// «Линза»: стеклянный круг в центре колец, внутри — свечи индекса KSE по дням.
// Наведение (или касание) выбирает свечу: в линзе её дата и значение, по кольцу едет указатель.
const DIAL_R = 168;
const DIAL_COUNT = 22;
const DIAL_HALF_W = 128;
const DIAL_TOP = CENTER.y - 58;
const DIAL_BOTTOM = CENTER.y + 92;
const DIAL_ORBIT = 220;

type DialCandle = { x: number; date: string; value: number; change: number; up: boolean; top: number; h: number; wickTop: number; wickBottom: number };

/** Свечи из дневной истории индекса: открытие — значение прошлого дня, закрытие — текущего. */
function dialCandles(history: { date: string; index: number }[]): DialCandle[] {
  const points = history.slice(-(DIAL_COUNT + 1));
  if (points.length < 3) return [];
  const pairs = points.slice(1).map((p, i) => ({ date: p.date, open: points[i].index, close: p.index }));
  // Масштаб — по закрытиям: один резкий скачок в начале периода уходит за край линзы,
  // а не сжимает остальные дни в чёрточки.
  const values = pairs.map((p) => p.close);
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const pad = span * 0.18;
  const y = (v: number) => r1(DIAL_BOTTOM - ((v - min + pad) / (span + pad * 2)) * (DIAL_BOTTOM - DIAL_TOP));
  const step = (DIAL_HALF_W * 2) / Math.max(pairs.length - 1, 1);
  return pairs.map((p, i) => {
    const top = y(Math.max(p.open, p.close));
    const bottom = y(Math.min(p.open, p.close));
    // Тени условные: в дневной истории kse.kg нет максимума и минимума дня.
    const wick = 4 + noise(1200 + i) * 8;
    return {
      x: r1(CENTER.x - DIAL_HALF_W + i * step),
      date: p.date.replace(/-/g, "."),
      value: p.close,
      change: p.open ? ((p.close - p.open) / p.open) * 100 : 0,
      up: p.close >= p.open,
      top,
      h: Math.max(bottom - top, 2),
      wickTop: r1(top - wick),
      wickBottom: r1(bottom + wick * 0.8),
    };
  });
}

function DialChart() {
  const { indexHistory } = useMarketData();
  const candles = useMemo(() => dialCandles(indexHistory), [indexHistory]);
  const [active, setActive] = useState<number | null>(null);
  const hitRef = useRef<SVGCircleElement>(null);
  if (!candles.length) return null;

  const index = active ?? candles.length - 1;
  const pick = candles[index];
  const t = candles.length > 1 ? index / (candles.length - 1) : 1;
  const value = pick.value.toLocaleString("ru-KG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const onMove = (event: React.PointerEvent<SVGCircleElement>) => {
    const svg = hitRef.current?.ownerSVGElement;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    let best = 0;
    candles.forEach((c, i) => {
      if (Math.abs(c.x - point.x) < Math.abs(candles[best].x - point.x)) best = i;
    });
    setActive(best);
  };

  return (
    <g className={styles.dial} data-active={active !== null || undefined}>
      {/* Указатель на кольце: дуга от начала периода до выбранного дня. */}
      <path
        className={styles.dialArc}
        d={`M${CENTER.x - DIAL_ORBIT} ${CENTER.y} A${DIAL_ORBIT} ${DIAL_ORBIT} 0 0 1 ${CENTER.x + DIAL_ORBIT} ${CENTER.y}`}
        pathLength={1}
        strokeDasharray={`${t} 1`}
      />
      <g className={styles.dialMarker} style={{ rotate: `${180 + t * 180}deg` }}>
        <circle cx={CENTER.x + DIAL_ORBIT} cy={CENTER.y} r="12" className={styles.dialMarkerHalo} />
        <circle cx={CENTER.x + DIAL_ORBIT} cy={CENTER.y} r="5.5" className={styles.dialMarkerDot} />
      </g>

      <circle className={styles.dialDisc} cx={CENTER.x} cy={CENTER.y} r={DIAL_R} />
      <g clipPath="url(#hero-dial-clip)">
        {[-40, 0, 40, 80].map((dy) => (
          <line key={dy} className={styles.dialGrid} x1={CENTER.x - DIAL_R} x2={CENTER.x + DIAL_R} y1={CENTER.y + dy} y2={CENTER.y + dy} />
        ))}
        <line className={styles.dialCross} x1={pick.x} x2={pick.x} y1={CENTER.y - DIAL_R} y2={CENTER.y + DIAL_R} />
        <line
          className={styles.dialPrice}
          x1={CENTER.x - DIAL_R}
          x2={CENTER.x + DIAL_R}
          y1={pick.up ? pick.top : pick.top + pick.h}
          y2={pick.up ? pick.top : pick.top + pick.h}
        />
        {candles.map((c, i) => (
          <g
            key={c.date}
            className={`${c.up ? styles.candleUp : styles.candleDown} ${i === index ? styles.dialPick : ""}`}
            style={{ animationDelay: `${0.4 + i * 0.04}s` }}
          >
            <line x1={c.x} x2={c.x} y1={c.wickTop} y2={c.wickBottom} />
            <rect x={c.x - 4.5} y={c.top} width="9" height={c.h} rx="1" />
          </g>
        ))}
      </g>

      <g className={styles.dialReadout}>
        <text x={CENTER.x} y={CENTER.y - 118} className={styles.dialLabel}>
          KSE Index · {pick.date}
        </text>
        <text x={CENTER.x} y={CENTER.y - 86} className={styles.dialValue}>
          {value}
          <tspan dx="8" className={pick.change < 0 ? styles.dialDown : styles.dialUp}>
            {formatChange(pick.change)}
          </tspan>
        </text>
      </g>

      <circle className={styles.dialRim} cx={CENTER.x} cy={CENTER.y} r={DIAL_R} />
      {/* Прозрачная мишень поверх линзы: ловит указатель и касание. */}
      <circle
        ref={hitRef}
        className={styles.dialHit}
        cx={CENTER.x}
        cy={CENTER.y}
        r={DIAL_R}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setActive(null)}
      />
    </g>
  );
}

// «Рынок в сферах»: стеклянные шарики фона — это бумаги биржи. Размер — объём торгов,
// внутри тикер, цена и значок из трёх свечей; при наведении вокруг шарика рисуется кольцо — доля в объёме.
const BUBBLE_SLOTS = [
  { cx: 1220, cy: 372, max: 84 },
  { cx: 1036, cy: 236, max: 60 },
  { cx: 1402, cy: 228, max: 60 },
  { cx: 1030, cy: 512, max: 58 },
  { cx: 1408, cy: 512, max: 58 },
  { cx: 862, cy: 372, max: 46 },
  { cx: 1545, cy: 372, max: 44 },
  { cx: 1222, cy: 160, max: 38 },
];
const BUBBLE_MIN = 30;

function BubbleCandles({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  // Значок: три свечи — малая, средняя, большая, как растущий рынок.
  const w = size * 0.16;
  const bars = [
    { dx: -size * 0.3, h: size * 0.34, y: size * 0.12 },
    { dx: 0, h: size * 0.5, y: -size * 0.02 },
    { dx: size * 0.3, h: size * 0.7, y: -size * 0.16 },
  ];
  return (
    <g className={styles.bubbleCandles}>
      {bars.map((b, i) => (
        <g key={i}>
          <line x1={r1(cx + b.dx)} x2={r1(cx + b.dx)} y1={r1(cy + b.y - size * 0.12)} y2={r1(cy + b.y + b.h + size * 0.1)} />
          <rect x={r1(cx + b.dx - w / 2)} y={r1(cy + b.y)} width={r1(w)} height={r1(b.h)} rx={r1(w * 0.2)} />
        </g>
      ))}
    </g>
  );
}

function BubbleMarket() {
  const market = useMarketData();
  const tr = useTr();
  const items = useMemo(() => {
    const stocks = market.instruments
      .filter((item) => item.type === "stock" && item.price > 0)
      .sort((a, b) => b.volume - a.volume || b.price - a.price)
      .slice(0, BUBBLE_SLOTS.length);
    const top = Math.max(...stocks.map((item) => item.volume), 1);
    const total = stocks.reduce((sum, item) => sum + item.volume, 0) || 1;
    return stocks.map((item, i) => {
      const slot = BUBBLE_SLOTS[i];
      // Место по рангу задаёт базовый размер, объём добавляет сверху — даже при одном лидере видна иерархия.
      const r = r1(Math.max(BUBBLE_MIN, slot.max * (0.7 + 0.3 * Math.sqrt(item.volume / top))));
      return { item, ...slot, r, share: item.volume / total };
    });
  }, [market.instruments]);

  return (
    <g className={styles.bubbles}>
      {items.map(({ item, cx, cy, r, share }, i) => (
        <a
          key={item.ticker}
          href={instrumentHref(market, item.ticker)}
          tabIndex={-1}
          className={styles.bubble}
          style={{ animationDelay: `${-i * 1.3}s`, transformOrigin: `${cx}px ${cy}px` }}
        >
          <title>{`${item.ticker} · ${formatSom(item.price)} ${tr("сом")}`}</title>
          <circle className={styles.bubbleShare} cx={cx} cy={cy} r={r + 9} pathLength={1} strokeDasharray={`${Math.max(share, 0.04)} 1`} />
          <circle className={styles.bubbleBody} cx={cx} cy={cy} r={r} fill="url(#hero-orb)" />
          <BubbleCandles cx={cx} cy={cy - r * 0.42} size={r * 0.42} />
          <text className={styles.bubbleTicker} x={cx} y={r1(cy + r * 0.18)} style={{ fontSize: r1(Math.max(r * 0.3, 11)) }}>
            {item.ticker}
          </text>
          <text className={styles.bubblePrice} x={cx} y={r1(cy + r * 0.48)} style={{ fontSize: r1(Math.max(r * 0.2, 9)) }}>
            {formatSom(item.price)}
          </text>
        </a>
      ))}
    </g>
  );
}

// «Круговой график»: дни индекса KSE стоят свечами по окружности вокруг колец, как на циферблате.
// Удаление свечи от центра — значение индекса: заливка между ними показывает форму движения.
// Наведение выбирает день: в центре его значение и дата, по внешнему кольцу едет указатель.
const RC = { x: 320, y: 320 };
const RAD_DISC = 96;
const RAD_IN = 124;
const RAD_OUT = 196;
const RAD_TRACK = 226;
const RAD_EXTENT = 240;

const RADIAL_ORBS = [
  { cx: 96, cy: 110, r: 28, duration: 9, delay: 0 },
  { cx: 560, cy: 540, r: 18, duration: 11, delay: -4 },
  { cx: 566, cy: 112, r: 11, duration: 8, delay: -2 },
];

type RadialCandle = {
  angle: number;
  date: string;
  value: number;
  change: number;
  up: boolean;
  flat: boolean;
  rTop: number;
  rBottom: number;
  wickTop: number;
  wickBottom: number;
  rClose: number;
};

const polar = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: r1(RC.x + r * Math.cos(a)), y: r1(RC.y + r * Math.sin(a)) };
};

function radialCandles(history: { date: string; index: number }[]): RadialCandle[] {
  const points = history.slice(-25);
  if (points.length < 3) return [];
  const pairs = points.slice(1).map((p, i) => ({ date: p.date, open: points[i].index, close: p.index }));
  // Масштаб по закрытиям: резкий скачок в начале не сплющивает остальные дни.
  const closes = pairs.map((p) => p.close);
  const min = Math.min(...closes);
  const span = Math.max(...closes) - min || 1;
  const pad = span * 0.15;
  const radius = (v: number) =>
    Math.min(RAD_OUT + 16, Math.max(RAD_IN - 16, RAD_IN + ((v - min + pad) / (span + pad * 2)) * (RAD_OUT - RAD_IN)));
  // Пустой слот сверху — начало и конец периода.
  const slot = 360 / (pairs.length + 1);
  return pairs.map((p, i) => {
    const rTop = radius(Math.max(p.open, p.close));
    const rBottom = Math.min(radius(Math.min(p.open, p.close)), rTop - 7);
    // Тени условные: в дневной истории kse.kg нет максимума и минимума дня.
    const wick = 5 + noise(1500 + i) * 9;
    return {
      angle: r1(-90 + (i + 1) * slot),
      date: p.date.replace(/-/g, "."),
      value: p.close,
      change: p.open ? ((p.close - p.open) / p.open) * 100 : 0,
      up: p.close >= p.open,
      flat: Math.abs(p.close - p.open) < 0.005 * Math.max(span, 1),
      rTop: r1(rTop),
      rBottom: r1(rBottom),
      wickTop: r1(rTop + wick),
      wickBottom: r1(Math.max(rBottom - wick * 0.8, RAD_DISC + 8)),
      rClose: r1(radius(p.close)),
    };
  });
}

function RadialChart() {
  const { indexHistory } = useMarketData();
  const candles = useMemo(() => radialCandles(indexHistory), [indexHistory]);
  const [active, setActive] = useState<number | null>(null);
  if (!candles.length) return null;

  const index = active ?? candles.length - 1;
  const pick = candles[index];
  const value = pick.value.toLocaleString("ru-KG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const slot = 360 / (candles.length + 1);
  const bodyW = Math.min(18, r1(((Math.PI * 2 * RAD_IN) / (candles.length + 1)) * 0.5));

  // Заливка: по закрытиям дней и обратно по внутреннему кругу.
  const first = polar(RAD_IN, candles[0].angle);
  const last = polar(RAD_IN, candles[candles.length - 1].angle);
  const sweep = candles[candles.length - 1].angle - candles[0].angle;
  const area =
    candles.map((c, i) => `${i ? "L" : "M"}${polar(c.rClose, c.angle).x} ${polar(c.rClose, c.angle).y}`).join(" ") +
    ` L${last.x} ${last.y} A${RAD_IN} ${RAD_IN} 0 ${sweep > 180 ? 1 : 0} 0 ${first.x} ${first.y} Z`;

  const track = (to: number) => {
    const start = polar(RAD_TRACK, -90);
    const end = polar(RAD_TRACK, to);
    return `M${start.x} ${start.y} A${RAD_TRACK} ${RAD_TRACK} 0 ${to + 90 > 180 ? 1 : 0} 1 ${end.x} ${end.y}`;
  };

  const onMove = (event: React.PointerEvent<SVGCircleElement>) => {
    const matrix = event.currentTarget.ownerSVGElement?.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    // Угол от верха по часовой стрелке → ближайший день.
    const deg = (((Math.atan2(point.y - RC.y, point.x - RC.x) * 180) / Math.PI + 90) % 360 + 360) % 360;
    const i = Math.round(deg / slot) - 1;
    setActive(Math.min(candles.length - 1, Math.max(0, i)));
  };

  return (
    <svg className={styles.radialLayer} viewBox="72 72 496 496" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    {/* Кольца фона — в этом же слое, ровно вокруг графика. */}
    <g className={styles.rings}>
      {[300, 380, 460, 540, 620].map((r, i) => (
        <circle key={r} cx={RC.x} cy={RC.y} r={r} strokeDasharray={i === 0 ? "2 10" : undefined} style={{ animationDelay: `${0.15 + i * 0.12}s` }} />
      ))}
    </g>
    {RADIAL_ORBS.map((orb) => (
      <circle
        key={orb.r}
        className={`${styles.orb} ${styles.floating}`}
        cx={orb.cx}
        cy={orb.cy}
        r={orb.r}
        fill="url(#hero-radial-orb)"
        style={{ animationDuration: `${orb.duration}s`, animationDelay: `${orb.delay}s` }}
      />
    ))}
    <defs>
      <radialGradient id="hero-radial-orb" cx="35%" cy="30%" r="75%">
        <stop offset="0" stopColor="var(--orb-hi)" />
        <stop offset="1" stopColor="var(--orb-lo)" />
      </radialGradient>
    </defs>
    <g className={styles.radial} data-active={active !== null || undefined}>
      {/* Сетка-круги по уровням индекса — в одной системе с кольцами фона. */}
      {[RAD_IN, (RAD_IN + RAD_OUT) / 2, RAD_OUT].map((r) => (
        <circle key={r} className={styles.radialGuide} cx={RC.x} cy={RC.y} r={r} />
      ))}
      <path className={styles.radialArea} d={area} />

      <path className={styles.radialTrack} d={track(pick.angle)} />
      <g className={styles.radialMarker} style={{ rotate: `${pick.angle + 90}deg` }}>
        <circle cx={RC.x} cy={RC.y - RAD_TRACK} r="12" className={styles.dialMarkerHalo} />
        <circle cx={RC.x} cy={RC.y - RAD_TRACK} r="5.5" className={styles.dialMarkerDot} />
      </g>

      {candles.map((c, i) => (
        <g
          key={c.date}
          className={`${c.up ? styles.candleUp : styles.candleDown} ${c.flat ? styles.radialFlat : ""} ${i === index ? styles.radialPick : ""}`}
          transform={`rotate(${r1(c.angle + 90)} ${RC.x} ${RC.y})`}
          style={{ animationDelay: `${0.3 + i * 0.05}s` }}
        >
          <line x1={RC.x} x2={RC.x} y1={RC.y - c.wickTop} y2={RC.y - c.wickBottom} />
          <rect x={r1(RC.x - bodyW / 2)} y={RC.y - c.rTop} width={bodyW} height={r1(c.rTop - c.rBottom)} rx="1.5" />
        </g>
      ))}

      <line
        className={styles.radialPointer}
        x1={polar(RAD_DISC, pick.angle).x}
        y1={polar(RAD_DISC, pick.angle).y}
        x2={polar(pick.wickBottom - 2, pick.angle).x}
        y2={polar(pick.wickBottom - 2, pick.angle).y}
      />

      <circle className={styles.dialDisc} cx={RC.x} cy={RC.y} r={RAD_DISC} />
      <circle className={styles.dialRim} cx={RC.x} cy={RC.y} r={RAD_DISC} />
      <g className={styles.dialReadout}>
        <text x={RC.x} y={RC.y - 30} className={styles.dialLabel}>
          KSE Index
        </text>
        <text x={RC.x} y={RC.y + 6} className={styles.dialValue}>
          {value}
        </text>
        <text x={RC.x} y={RC.y + 28} className={`${styles.radialChange} ${pick.change < 0 ? styles.dialDown : styles.dialUp}`}>
          {formatChange(pick.change)}
        </text>
        <text x={RC.x} y={RC.y + 48} className={styles.dialLabel}>
          {pick.date}
        </text>
      </g>

      {/* Прозрачная мишень: ловит указатель и касание по всему кругу. */}
      <circle
        className={styles.dialHit}
        cx={RC.x}
        cy={RC.y}
        r={RAD_EXTENT}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setActive(null)}
      />
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
        <clipPath id="hero-dial-clip">
          <circle cx={CENTER.x} cy={CENTER.y} r={DIAL_R - 1} />
        </clipPath>
        {candles === "orbs"
          ? LENS_ORBS.map((orb) => (
              <clipPath key={orb.seed} id={`hero-lens-${orb.seed}`}>
                <circle cx={orb.cx} cy={orb.cy} r={orb.r - 2} />
              </clipPath>
            ))
          : null}
      </defs>
      <g className={styles.rings} style={candles === "radial" || candles === "horizon" || candles === "ribbon" || candles === "wave" || candles === "orbit" || candles === "feed" || candles === "rise" || candles === "field" || candles === "skyline" || candles === "stairs" || candles === "mirror" || candles === "clock" ? { display: "none" } : undefined}>
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
      {candles === "dial" ? <DialChart /> : null}
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
      {candles === "bubbles" ? <BubbleMarket /> : null}
      {candles === "bubbles" || candles === "radial" || candles === "horizon" || candles === "ribbon" || candles === "wave" || candles === "orbit" || candles === "feed" || candles === "rise" || candles === "field" || candles === "skyline" || candles === "stairs" || candles === "mirror" || candles === "clock"
        ? null
        : candles === "orbs"
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

export function HomeHero({ index, volume, listing, candles = "rise" }: Props) {
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
        {candles === "lines" ? <LineCandles /> : null}
        {candles === "dots" ? <DotCandles /> : null}
        {candles === "monument" ? <MonumentCandles /> : null}
        {candles === "peaks" ? <PeakScene /> : null}
        {candles === "radial" ? <RadialChart /> : null}
        {candles === "horizon" ? <HeroHorizon /> : null}
        {candles === "ribbon" ? <HeroRibbon /> : null}
        {candles === "wave" ? <HeroCandleWave /> : null}
        {candles === "orbit" ? <HeroCandleOrbit /> : null}
        {candles === "feed" ? <HeroCandleFeed /> : null}
        {candles === "rise" ? <HeroCandleRise /> : null}
        {candles === "field" ? <HeroCandleField /> : null}
        {candles === "skyline" ? <HeroCandleSkyline /> : null}
        {candles === "stairs" ? <HeroCandleStairs /> : null}
        {candles === "mirror" ? <HeroCandleMirror /> : null}
        {candles === "clock" ? <HeroCandleClock /> : null}
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
