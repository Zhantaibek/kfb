"use client";

import Link from "next/link";
import { formatChange, formatSom, indexHistory, indexKse, instruments } from "@/data/catalog";
import { useTr } from "@/lib/use-tr";
import styles from "./MarketPulse.module.css";

function lineGeometry(values: number[], width: number, height: number, pad = 10) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const points = values.map((value, index) => ({
    x: pad + (index / Math.max(values.length - 1, 1)) * innerW,
    y: pad + innerH - ((value - min) / span) * innerH,
  }));
  const line = points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const first = points[0];
  const area = `${line} L${last.x.toFixed(1)},${(height - 2).toFixed(1)} L${first.x.toFixed(1)},${(height - 2).toFixed(1)} Z`;
  return { line, area, last };
}

export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const chart = lineGeometry(values, 120, 36, 3);
  return (
    <svg className={className} viewBox="0 0 120 36" aria-hidden="true">
      <path d={chart.area} className={styles.sparkFill} />
      <path d={chart.line} className={styles.sparkLine} />
    </svg>
  );
}

const volumeLeaders = [...instruments].sort((a, b) => b.volume - a.volume).slice(0, 5);
const volumeMax = Math.max(...volumeLeaders.map((item) => item.volume), 1);

export function MarketPulse() {
  const tr = useTr();
  const values = indexHistory.map((item) => item.index);
  const chart = lineGeometry(values, 640, 220, 16);
  const down = indexKse.change < 0;

  return (
    <section className={styles.pulse} aria-label={tr("График рынка")}>
      <article className={styles.chartCard}>
        <div className={styles.chartHead}>
          <div>
            <small>{tr("Индекс KSE")}</small>
            <p>
              <b>{indexKse.value.toLocaleString("ru-KG", { maximumFractionDigits: 2 })}</b>
              <em className={down ? styles.down : styles.up}>{formatChange(indexKse.change)}</em>
            </p>
          </div>
          <Link href="/market">{tr("Открыть торги")}</Link>
        </div>
        <svg className={styles.chart} viewBox="0 0 640 220" role="img" aria-label={tr("Динамика индекса KSE")}>
          <defs>
            <linearGradient id="kse-home-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className={styles.fillTop} />
              <stop offset="100%" className={styles.fillBottom} />
            </linearGradient>
          </defs>
          <path d={chart.area} fill="url(#kse-home-fill)" />
          <path d={chart.line} className={styles.line} />
          <circle cx={chart.last.x} cy={chart.last.y} r="5" className={styles.dot} />
        </svg>
      </article>

      <article className={styles.barsCard}>
        <small>{tr("Объём сессии")}</small>
        <ul>
          {volumeLeaders.map((item) => (
            <li key={item.ticker}>
              <div>
                <b>{item.ticker}</b>
                <span>{formatSom(item.volume)}</span>
              </div>
              <i style={{ width: `${Math.max((item.volume / volumeMax) * 100, 8)}%` }} />
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
