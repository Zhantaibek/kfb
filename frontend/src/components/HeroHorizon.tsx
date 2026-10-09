"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMarketData } from "@/components/MarketDataProvider";
import styles from "./HeroHorizon.module.css";

/**
 * «Горизонт рынка»: широкий свечной график под всем баннером, как пейзаж.
 * Дни — настоящая дневная история индекса KSE; внутри дня свечи иллюстративные (kse.kg
 * не публикует внутридневные цены), поэтому подсказка показывает только дату и закрытие дня.
 */

const STEP = 15;
const AXIS = 76;
const MA = 7;

/** Целочисленный хеш вместо Math.random — одинаково на сервере и в браузере. */
function noise(n: number) {
  let h = Math.imul(n + 11, 2654435761) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0;
  return (h % 10000) / 10000;
}

type Candle = { open: number; close: number; high: number; low: number; vol: number; day: number };

function buildCandles(closes: number[], count: number): Candle[] {
  const last = closes[closes.length - 1];
  const span = Math.max(...closes) - Math.min(...closes);
  // Фактура: небольшие колебания вокруг настоящей траектории, к правому краю — спокойнее.
  const amp = Math.max(span * 0.22, last * 0.0016);
  let prev = closes[0];
  return Array.from({ length: count }, (_, k) => {
    const t = count > 1 ? k / (count - 1) : 1;
    const p = t * (closes.length - 1);
    const i = Math.floor(p);
    const base = closes[i] + (closes[Math.min(i + 1, closes.length - 1)] - closes[i]) * (p - i);
    const wave = Math.sin(k * 0.47) * 0.45 + Math.sin(k * 0.13 + 1.3) * 0.35 + (noise(k) - 0.5) * 0.9;
    const close = k === count - 1 ? last : base + amp * wave * (1 - t * 0.35);
    const open = prev;
    prev = close;
    const reach = amp * (0.15 + noise(k + 400) * 0.55);
    return {
      open,
      close,
      high: Math.max(open, close) + reach,
      low: Math.min(open, close) - reach * (0.6 + noise(k + 800) * 0.6),
      vol: 0.25 + noise(k + 1200) * 0.75 * (0.6 + 0.4 * Math.abs(wave)),
      day: Math.round(p),
    };
  });
}

const fmt = (v: number) => v.toLocaleString("ru-KG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function HeroHorizon() {
  const { indexHistory, index } = useMarketData();
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const measure = () => {
      const box = svg.getBoundingClientRect();
      setSize({ w: Math.round(box.width), h: Math.round(box.height) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  const closes = useMemo(() => {
    const series = indexHistory.map((row) => row.index).filter((v) => v > 0);
    return series.length >= 2 ? series : [index.value, index.value];
  }, [indexHistory, index.value]);

  const narrow = size.w < 900;
  // Начало графика — за текстовым блоком баннера (сетка контента до 1640px).
  const edge = Math.max(24, (size.w - 1640) / 2);
  const left = Math.round(narrow ? size.w * 0.02 : Math.max(size.w * 0.3, edge + 560));
  const right = size.w - (narrow ? 12 : AXIS);
  const top = Math.round(size.h * 0.1);
  const volH = Math.round(size.h * 0.14);
  const bottom = size.h - 6;
  const priceBottom = bottom - volH - 10;
  const count = Math.max(8, Math.floor((right - left) / STEP));

  const candles = useMemo(() => buildCandles(closes, count), [closes, count]);
  const lo = Math.min(...candles.map((c) => c.low));
  const hi = Math.max(...candles.map((c) => c.high));
  const pad = (hi - lo) * 0.08 || 1;
  const y = (v: number) => top + ((hi + pad - v) / (hi - lo + pad * 2)) * (priceBottom - top);
  const valueAt = (py: number) => hi + pad - ((py - top) / (priceBottom - top)) * (hi - lo + pad * 2);
  const x = (k: number) => right - (count - 1 - k) * STEP - STEP / 2;

  const ma = candles
    .map((_, k) => {
      const from = Math.max(0, k - MA + 1);
      const slice = candles.slice(from, k + 1);
      const avg = slice.reduce((s, c) => s + c.close, 0) / slice.length;
      return `${k ? "L" : "M"}${x(k).toFixed(1)} ${y(avg).toFixed(1)}`;
    })
    .join(" ");

  const lastY = y(candles[candles.length - 1].close);
  const ticks = Array.from({ length: 4 }, (_, i) => hi + pad - ((i + 0.5) / 4) * (hi - lo + pad * 2));

  const hoverK = hover ? Math.min(count - 1, Math.max(0, Math.round((hover.x - x(0)) / STEP))) : null;
  const hoverDay = hoverK !== null ? candles[hoverK].day : null;
  const dayRow = hoverDay !== null ? indexHistory[hoverDay] : null;

  const onMove = (event: React.PointerEvent<SVGRectElement>) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return;
    setHover({ x: event.clientX - box.left, y: Math.min(priceBottom, Math.max(top, event.clientY - box.top)) });
  };

  return (
    <svg
      ref={svgRef}
      className={styles.horizon}
      viewBox={`0 0 ${size.w || 1} ${size.h || 1}`}
      data-hover={hover ? "true" : undefined}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hz-up" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--hz-up-hi)" />
          <stop offset="1" stopColor="var(--hz-up)" />
        </linearGradient>
        <linearGradient id="hz-down" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--hz-down-hi)" />
          <stop offset="1" stopColor="var(--hz-down)" />
        </linearGradient>
        <linearGradient id="hz-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset={narrow ? 0.1 : 0.42} stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id="hz-mask">
          <rect width={size.w} height={size.h} fill="url(#hz-fade)" />
        </mask>
      </defs>

      {size.w > 0 ? (
        <>
          <g mask="url(#hz-mask)">
            {ticks.map((v) => (
              <line key={v} className={styles.grid} x1={left} x2={right} y1={y(v)} y2={y(v)} />
            ))}

            <g className={styles.vols}>
              {candles.map((c, k) => (
                <rect
                  key={k}
                  x={x(k) - 4}
                  y={bottom - c.vol * volH}
                  width="8"
                  height={c.vol * volH}
                  rx="1"
                  data-up={c.close >= c.open || undefined}
                  style={{ animationDelay: `${0.2 + (k / count) * 1.1}s` }}
                />
              ))}
            </g>

            <g className={styles.candles}>
              {candles.map((c, k) => {
                const up = c.close >= c.open;
                const bodyTop = y(Math.max(c.open, c.close));
                const bodyH = Math.max(y(Math.min(c.open, c.close)) - bodyTop, 1.5);
                return (
                  <g
                    key={k}
                    className={styles.candle}
                    data-up={up || undefined}
                    data-pick={hoverDay !== null && c.day === hoverDay ? "true" : undefined}
                    style={{ animationDelay: `${0.2 + (k / count) * 1.1}s` }}
                  >
                    <line x1={x(k)} x2={x(k)} y1={y(c.high)} y2={y(c.low)} />
                    <rect x={x(k) - 4.5} y={bodyTop} width="9" height={bodyH} rx="1.5" fill={up ? "url(#hz-up)" : "url(#hz-down)"} />
                  </g>
                );
              })}
            </g>

            <path className={styles.ma} d={ma} pathLength={1} />
          </g>

          {/* Текущее значение индекса: пунктир до шкалы и ярлык. */}
          <line className={styles.last} x1={x(count - 1)} x2={right + (narrow ? 0 : 6)} y1={lastY} y2={lastY} />
          <circle className={styles.pulse} cx={x(count - 1)} cy={lastY} r="10" />
          <circle className={styles.dot} cx={x(count - 1)} cy={lastY} r="3.5" />
          {!narrow ? (
            <>
              {ticks.map((v) => (
                <text key={v} className={styles.tick} x={right + 12} y={y(v) + 4}>
                  {Math.round(v).toLocaleString("ru-KG")}
                </text>
              ))}
              <g className={styles.tag} transform={`translate(${right + 6} ${lastY - 12})`}>
                <rect width={AXIS - 10} height="24" rx="12" />
                <text x={(AXIS - 10) / 2} y="16">
                  {Math.round(index.value).toLocaleString("ru-KG")}
                </text>
              </g>
            </>
          ) : null}

          {hover && !narrow ? (
            <g className={styles.cross}>
              <line x1={left} x2={right} y1={hover.y} y2={hover.y} />
              <line x1={x(hoverK ?? 0)} x2={x(hoverK ?? 0)} y1={top - 10} y2={bottom} />
              <g transform={`translate(${right + 6} ${hover.y - 11})`}>
                <rect width={AXIS - 10} height="22" rx="6" />
                <text x={(AXIS - 10) / 2} y="15">
                  {Math.round(valueAt(hover.y)).toLocaleString("ru-KG")}
                </text>
              </g>
              {dayRow ? (
                <g
                  className={styles.label}
                  transform={`translate(${Math.min(x(hoverK ?? 0) + 12, right - 172)} ${Math.max(top - 6, 8)})`}
                >
                  <rect width="160" height="44" rx="10" />
                  <text x="12" y="18" className={styles.labelDate}>
                    {dayRow.date.replace(/-/g, ".")}
                  </text>
                  <text x="12" y="35" className={styles.labelValue}>
                    KSE {fmt(dayRow.index)}
                  </text>
                </g>
              ) : null}
            </g>
          ) : null}

          <rect
            className={styles.hit}
            x={left}
            y={0}
            width={Math.max(right - left, 0)}
            height={size.h}
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </>
      ) : null}
    </svg>
  );
}
