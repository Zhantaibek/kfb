"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";

type Point = { date: string; value: number };

const W = 1000;
const H = 300;
const PAD = 16;
const nf = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Крупный график индекса KSE: шкала значений, даты, перекрестие с подсказкой под курсором.
 * С клавиатуры: фокус на графике, ←/→ двигают точку, Home/End — к началу и концу ряда.
 * css — CSS-модуль концепции (классы bigChart, bigChartPlot, bigGrid, bigLine, bigTick, bigCursor, bigDot, bigTip, bigDates).
 */
export function IndexChart({ points, css }: { points: Point[]; css: Readonly<Record<string, string>> }) {
  const [active, setActive] = useState<number | null>(null);
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const xy = points.map((p, i) => [(i / (points.length - 1)) * W, PAD + (1 - (p.value - min) / span) * (H - PAD * 2)] as const);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const ticks = [0, 1, 2, 3].map((i) => min + (span * i) / 3);
  const dateTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (points.length - 1)));
  const shown = active ?? points.length - 1;
  const [ax, ay] = xy[shown];

  function onMove(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    setActive(Math.round(f * (points.length - 1)));
  }

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const last = points.length - 1;
    const next = { ArrowLeft: Math.max(0, shown - 1), ArrowRight: Math.min(last, shown + 1), Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
  }

  return (
    <div className={css.bigChart}>
      <div
        className={css.bigChartPlot}
        onPointerMove={onMove}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
        tabIndex={0}
        role="img"
        aria-label={`График индекса KSE: от ${nf.format(values[0])} (${points[0].date}) до ${nf.format(values.at(-1)!)} (${points.at(-1)!.date}), минимум ${nf.format(min)}, максимум ${nf.format(max)}`}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="x-big-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1b7680" stopOpacity="0.24" />
              <stop offset="1" stopColor="#1b7680" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => {
            const y = PAD + (1 - (t - min) / span) * (H - PAD * 2);
            return <path key={t} d={`M0 ${y} H${W}`} className={css.bigGrid} />;
          })}
          <path d={area} fill="url(#x-big-area)" />
          <path d={line} className={css.bigLine} />
        </svg>
        {ticks.map((t) => (
          <span key={t} className={css.bigTick} style={{ top: `${((PAD + (1 - (t - min) / span) * (H - PAD * 2)) / H) * 100}%` }} aria-hidden="true">
            {nf.format(t)}
          </span>
        ))}
        <i className={css.bigCursor} style={{ left: `${(ax / W) * 100}%` }} aria-hidden="true" />
        <i className={css.bigDot} style={{ left: `${(ax / W) * 100}%`, top: `${(ay / H) * 100}%` }} aria-hidden="true" />
        {/* Подсказка — только при наведении или фокусе, чтобы не перекрывать итоги над графиком. */}
        {active !== null ? (
          <span
            className={css.bigTip}
            style={{ left: `${(ax / W) * 100}%`, top: `${(ay / H) * 100}%` }}
            data-edge={ax / W > 0.8 ? "right" : ax / W < 0.2 ? "left" : undefined}
          >
            <small>{points[shown].date}</small>
            <b>{nf.format(points[shown].value)}</b>
          </span>
        ) : null}
      </div>
      <div className={css.bigDates} aria-hidden="true">
        {dateTicks.map((i) => (
          <span key={i}>{points[i].date}</span>
        ))}
      </div>
    </div>
  );
}
