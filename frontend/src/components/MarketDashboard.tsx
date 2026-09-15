"use client";

import { indexHistory, indexKse, sessionDate, tradingRows } from "@/data/catalog";
import { useTr } from "@/lib/use-tr";
import styles from "./MarketDashboard.module.css";

function formatPct(value: number) {
  if (value > 0) return `▲ ${Number.isInteger(value) ? value : value.toFixed(1)} %`;
  if (value < 0) return `▼ ${Math.abs(value)} %`;
  return "0 %";
}

function formatVol(value: number) {
  return value === 0 ? "0" : String(value);
}

function chartGeometry(values: number[]) {
  const width = 640;
  const height = 340;
  const pad = { top: 18, right: 16, bottom: 52, left: 44 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const lo = min - span * 0.08;
  const hi = max + span * 0.08;
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const points = values.map((value, index) => {
    const x = pad.left + (index / Math.max(values.length - 1, 1)) * innerW;
    const y = pad.top + innerH - ((value - lo) / (hi - lo)) * innerH;
    return { x, y, value };
  });
  const line = points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const first = points[0];
  const area = `${line} L${last.x.toFixed(1)},${(pad.top + innerH).toFixed(1)} L${first.x.toFixed(1)},${(pad.top + innerH).toFixed(1)} Z`;
  const ticks = Array.from({ length: 5 }, (_, index) => hi - ((hi - lo) * index) / 4);
  return { width, height, pad, innerH, lo, hi, points, line, area, ticks };
}

function AreaChart({ values, dates, suffix }: { values: number[]; dates: string[]; suffix?: string }) {
  const chart = chartGeometry(values);
  const labelEvery = Math.ceil(dates.length / 5);

  return (
    <svg className={styles.chart} viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={`fill-${suffix}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5fb4c0" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#5fb4c0" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {chart.ticks.map((tick, index) => {
        const y = chart.pad.top + (chart.innerH * index) / 4;
        return (
          <g key={tick}>
            <line x1={chart.pad.left} x2={chart.width - chart.pad.right} y1={y} y2={y} className={styles.grid} />
            <text x={chart.pad.left - 8} y={y + 4} className={styles.axis}>
              {tick.toLocaleString("ru-RU", { maximumFractionDigits: suffix === "cap" ? 0 : 0 })}
            </text>
          </g>
        );
      })}
      <path d={chart.area} fill={`url(#fill-${suffix})`} />
      <path d={chart.line} className={styles.line} />
      {chart.points.map((point) => (
        <circle key={point.x} cx={point.x} cy={point.y} r="4.5" className={styles.dot} />
      ))}
      {dates.map((date, index) =>
        index % labelEvery === 0 || index === dates.length - 1 ? (
          <text
            key={date}
            x={chart.points[index].x}
            y={chart.height - 8}
            className={styles.axis}
            textAnchor="middle"
            transform={`rotate(-32 ${chart.points[index].x} ${chart.height - 18})`}
          >
            {date}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export function MarketDashboard({ compact = false }: { compact?: boolean }) {
  const tr = useTr();
  const shortDate = sessionDate.replace(".0", ".").replace(/^0/, "");
  const dates = indexHistory.map((item) => item.date);

  return (
    <section className={`${styles.board} ${compact ? styles.compact : ""}`} aria-label={tr("Итоги торгов и индекс")}>
      <div className={styles.stack}>
        <article className={styles.card}>
          <h2>{tr(`Итоги торгов за ${shortDate}`)}</h2>
          <ul>
            {tradingRows.map((row) => (
              <li key={row.label}>
                <span>{tr(row.label)}</span>
                <b>{formatVol(row.value)}</b>
                <em data-dir={row.change > 0 ? "up" : row.change < 0 ? "down" : "flat"}>{formatPct(row.change)}</em>
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.card}>
          <h2>
            {tr("Индексы:")} <small>{tr(`Значения на ${sessionDate}`)}</small>
          </h2>
          <ul>
            <li>
              <span>KSE</span>
              <b>{indexKse.value.toFixed(2)} %</b>
              <em data-dir={indexKse.change > 0 ? "up" : "down"}>
                {indexKse.change < 0 ? `▼ ${indexKse.change}` : formatPct(indexKse.change)}
              </em>
            </li>
          </ul>
        </article>
      </div>

      <article className={styles.card}>
        <div className={styles.chartHead}>
          <h2>{tr("Индекс и Капитализация")}</h2>
          <input className={styles.modeIndex} type="radio" name="kse-chart" id="kse-chart-index" defaultChecked />
          <input className={styles.modeCap} type="radio" name="kse-chart" id="kse-chart-cap" />
          <div className={styles.pills} role="tablist" aria-label={tr("Показатель графика")}>
            <label htmlFor="kse-chart-index">{tr("Индекс")}</label>
            <label className={styles.capLabel} htmlFor="kse-chart-cap">
              {tr("Капитализация")}
            </label>
          </div>
        </div>
        <div className={styles.chartIndex}>
          <AreaChart values={indexHistory.map((item) => item.index)} dates={dates} suffix="idx" />
        </div>
        <div className={styles.chartCap}>
          <AreaChart values={indexHistory.map((item) => item.cap)} dates={dates} suffix="cap" />
        </div>
      </article>
    </section>
  );
}
