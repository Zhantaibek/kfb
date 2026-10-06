"use client";

import { useState } from "react";
import Link from "next/link";
import {
  auctions,
  formatChange,
  formatSom,
  indexHistory,
  indexKse,
  instruments,
  sessionDate,
  sessionHours,
  tradingRows,
  type Instrument,
  type InstrumentType,
} from "@/data/catalog";
import { useTr } from "@/lib/use-tr";
import styles from "./MarketPulse.module.css";

const periods = [
  { id: "1d", label: "1Д", days: 1 },
  { id: "1w", label: "1Н", days: 7 },
  { id: "1m", label: "1М", days: 31 },
  { id: "1y", label: "1Г", days: 366 },
  { id: "all", label: "Всё", days: 0 },
] as const;

const nav = [
  { id: "overview", href: "/market", label: "Обзор", icon: "grid" },
  { id: "stocks", href: "/market/quotes", label: "Акции", icon: "chart" },
  { id: "bonds", href: "/gcb", label: "Облигации", icon: "doc" },
  { id: "metals", href: "/market/metals", label: "Драгметаллы", icon: "coin" },
  { id: "archive", href: "/market/archive", label: "Архив торгов", icon: "clock" },
  { id: "index", href: "/market/index", label: "Индексы", icon: "pulse" },
] as const;

type View = (typeof nav)[number]["id"];

const tabs: { id: string; label: string; types: InstrumentType[] }[] = [
  { id: "all", label: "Все", types: ["stock", "bond", "gcb", "metal"] },
  { id: "stock", label: "Акции", types: ["stock"] },
  { id: "bond", label: "Облигации", types: ["bond", "gcb"] },
  { id: "metal", label: "Драгметаллы", types: ["metal"] },
];

function NavIcon({ name }: { name: (typeof nav)[number]["icon"] }) {
  const paths: Record<typeof name, string> = {
    grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    doc: "M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6",
    coin: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 12h6M12 9v6",
    clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
    pulse: "M3 12h4l3-7 4 14 3-7h4",
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function historyDate(value: string) {
  const [day, month, year] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function sliceHistory(days: number) {
  if (!days) return indexHistory;
  const end = historyDate(indexHistory[indexHistory.length - 1].date);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const sliced = indexHistory.filter((item) => historyDate(item.date) >= start);
  return sliced.length >= 2 ? sliced : indexHistory.slice(-2);
}

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  let path = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return path;
}

function lineGeometry(values: number[], width: number, height: number, pad = 10) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const yMin = min - span * 0.28;
  const yMax = max + span * 0.16;
  const ySpan = yMax - yMin;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const points = values.map((value, index) => ({
    x: pad + (index / Math.max(values.length - 1, 1)) * innerW,
    y: pad + innerH - ((value - yMin) / ySpan) * innerH,
  }));
  const line = points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const first = points[0];
  const base = (pad + innerH).toFixed(1);
  const area = `${line} L${last.x.toFixed(1)},${base} L${first.x.toFixed(1)},${base} Z`;
  return { line, area };
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

const box = { width: 720, height: 240, left: 6, right: 58, top: 12, bottom: 30 };

function axisDate(value: string) {
  const [day, month, year] = value.split("-");
  return `${day}.${month}.${year.slice(2)}`;
}

function indexChart(series: { date: string; value: number }[]) {
  const values = series.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || max * 0.01 || 1;
  const yMin = min - span * 0.1;
  const yMax = max + span * 0.12;
  const ySpan = yMax - yMin;
  const innerW = box.width - box.left - box.right;
  const innerH = box.height - box.top - box.bottom;
  const points = series.map((item, index) => ({
    ...item,
    x: box.left + (index / Math.max(series.length - 1, 1)) * innerW,
    y: box.top + innerH - ((item.value - yMin) / ySpan) * innerH,
  }));
  const line = smoothPath(points);
  const base = box.top + innerH;
  const last = points[points.length - 1];
  const area = `${line} L${last.x.toFixed(1)},${base} L${points[0].x.toFixed(1)},${base} Z`;
  const yTicks = [0, 1, 2, 3].map((step) => ({
    value: yMin + (ySpan * (step + 0.5)) / 4,
    y: box.top + innerH - (innerH * (step + 0.5)) / 4,
  }));
  const count = Math.min(points.length, 5);
  const xTicks = Array.from({ length: count }, (_, i) =>
    points[Math.round((i * (points.length - 1)) / Math.max(count - 1, 1))],
  ).filter((point, i, list) => list.indexOf(point) === i);
  return { line, area, last, base, yTicks, xTicks, plotRight: box.width - box.right };
}

function Badge({ item }: { item: Pick<Instrument, "ticker" | "type"> }) {
  return (
    <i className={styles.badge} data-type={item.type} aria-hidden="true">
      {item.ticker.slice(0, 1)}
    </i>
  );
}

type Mover = { key: string; href: string; label: string; change: number; type: InstrumentType | "index" };

const indexMover: Mover = {
  key: "KSE",
  href: "/market/index",
  label: "KSE Index",
  change: indexKse.change,
  type: "index",
};

const movers: Mover[] = [
  indexMover,
  ...instruments.map((item) => ({
    key: item.ticker,
    href: `/market/${item.ticker}`,
    label: item.ticker,
    change: item.change,
    type: item.type,
  })),
];

const gainers = movers.filter((item) => item.change > 0).sort((a, b) => b.change - a.change).slice(0, 5);
const losers = movers.filter((item) => item.change < 0).sort((a, b) => a.change - b.change).slice(0, 5);

function MoverList({ title, list, href, fill }: { title: string; list: Mover[]; href: string; fill?: boolean }) {
  const tr = useTr();
  return (
    <article className={fill ? `${styles.card} ${styles.fill}` : styles.card}>
      <header className={styles.cardHead}>
        <h3>{tr(title)}</h3>
        <Link href={href} aria-label={tr(title)}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </Link>
      </header>
      {list.length ? (
        <ul className={styles.movers}>
          {list.map((item) => (
            <li key={item.key}>
              <Link href={item.href}>
                {item.type === "index" ? (
                  <i className={styles.badge} data-type="index" aria-hidden="true">
                    <svg viewBox="0 0 16 16">
                      <path d="M2 11l4-4 3 3 5-6" />
                    </svg>
                  </i>
                ) : (
                  <Badge item={{ ticker: item.key, type: item.type }} />
                )}
                <span>{item.label}</span>
                <em className={item.change < 0 ? styles.down : styles.up}>{formatChange(item.change)}</em>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>{tr("Нет инструментов")}</p>
      )}
    </article>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

/** Итоги последней торговой сессии: объём по сегментам рынка и изменение к прошлой сессии. */
function SessionCard() {
  const tr = useTr();
  return (
    <article className={`${styles.card} ${styles.fill}`}>
      <header className={styles.cardHead}>
        <h3>{tr("Итоги сессии")}</h3>
        <Link href="/market/archive" aria-label={tr("Итоги сессии")}>
          <Arrow />
        </Link>
      </header>
      <p className={styles.sessionMeta}>
        {sessionDate} · {sessionHours}
      </p>
      <dl className={styles.session}>
        {tradingRows.map((item) => (
          <div key={item.label}>
            <dt>{tr(item.label)}</dt>
            <dd>
              <b>{formatSom(item.value)}</b>
              <em className={item.change < 0 ? styles.down : item.change > 0 ? styles.up : undefined}>
                {formatChange(item.change)}
              </em>
            </dd>
          </div>
        ))}
      </dl>
      <p className={styles.sessionMeta}>{tr("Объём, млн сом")}</p>
    </article>
  );
}

function SectionHead({ title, href }: { title: string; href: string }) {
  const tr = useTr();
  return (
    <header className={styles.marketsHead}>
      <h3>{tr(title)}</h3>
      <div className={styles.marketsTools}>
        <Link href={href} aria-label={tr("Смотреть раздел")}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </Link>
      </div>
    </header>
  );
}

function InstrumentTable({ title, href, types }: { title: string; href: string; types: InstrumentType[] }) {
  const tr = useTr();
  const rows = instruments.filter((item) => types.includes(item.type)).sort((a, b) => b.volume - a.volume);
  return (
    <article className={`${styles.card} ${styles.markets}`}>
      <SectionHead title={title} href={href} />
      <div className={styles.table}>
        <div className={styles.row} data-head="true">
          <span>{tr("Инструмент")}</span>
          <span>{tr("Цена")}</span>
          <span>{tr("Изм.")}</span>
          <span>{tr("Объём")}</span>
        </div>
        {rows.map((item) => (
          <Link key={item.ticker} href={`/market/${item.ticker}`} className={styles.row}>
            <span className={styles.instrument}>
              <Badge item={item} />
              <b>{item.ticker}</b>
              <small>{item.name}</small>
            </span>
            <span>{formatSom(item.price)}</span>
            <em className={item.change < 0 ? styles.down : item.change > 0 ? styles.up : undefined}>
              {formatChange(item.change)}
            </em>
            <span>{formatSom(item.volume)}</span>
          </Link>
        ))}
      </div>
    </article>
  );
}

function AuctionsCard() {
  const tr = useTr();
  return (
    <article className={`${styles.card} ${styles.markets}`}>
      <SectionHead title="Аукционы ГЦБ" href="/gcb" />
      <div className={styles.table}>
        <div className={styles.row} data-head="true">
          <span>{tr("Тип")}</span>
          <span>{tr("Дата")}</span>
          <span>{tr("Объём")}</span>
          <span>{tr("Статус")}</span>
        </div>
        {auctions.map((item) => (
          <Link key={`${item.date}-${item.type}`} href="/gcb" className={styles.row}>
            <span className={styles.instrument}>
              <Badge item={{ ticker: item.type, type: "gcb" }} />
              <b>{item.type}</b>
            </span>
            <span>{item.date}</span>
            <span>{tr(item.volume)}</span>
            <span className={item.status === "Состоялся" ? undefined : styles.up}>{tr(item.status)}</span>
          </Link>
        ))}
      </div>
    </article>
  );
}

function ArchiveView({ scale }: { scale: number }) {
  const tr = useTr();
  const history = [...indexHistory].reverse();
  return (
    <>
      <article className={`${styles.card} ${styles.markets}`}>
        <SectionHead title="Итоги последних торгов" href="/market/archive" />
        <p className={styles.note}>{tr(`данные на ${sessionDate}`)}</p>
        <div className={styles.table}>
          <div className={`${styles.row} ${styles.row3}`} data-head="true">
            <span>{tr("Показатель")}</span>
            <span>{tr("млн сом")}</span>
            <span>{tr("Изменение")}</span>
          </div>
          {tradingRows.map((item) => (
            <div key={item.label} className={`${styles.row} ${styles.row3}`}>
              <span className={styles.instrument}>
                <b>{tr(item.label)}</b>
              </span>
              <span>{item.value.toLocaleString("ru-KG", { maximumFractionDigits: 4 })}</span>
              <em className={item.change < 0 ? styles.down : item.change > 0 ? styles.up : undefined}>
                {formatChange(item.change)}
              </em>
            </div>
          ))}
        </div>
      </article>
      <article className={`${styles.card} ${styles.markets}`}>
        <SectionHead title="История индекса" href="/market/index" />
        <div className={styles.table}>
          <div className={`${styles.row} ${styles.row3}`} data-head="true">
            <span>{tr("Дата")}</span>
            <span>{tr("Индекс KSE")}</span>
            <span>{tr("Капитализация")}</span>
          </div>
          {history.map((item) => (
            <div key={item.date} className={`${styles.row} ${styles.row3}`}>
              <span className={styles.instrument}>
                <b>{item.date.replaceAll("-", ".")}</b>
              </span>
              <span>{(item.index * scale).toLocaleString("ru-KG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span>
                {item.cap.toLocaleString("ru-KG")} {tr("млрд сом")}
              </span>
            </div>
          ))}
        </div>
      </article>
    </>
  );
}

function IndexStats() {
  const tr = useTr();
  const first = indexHistory[0];
  const last = indexHistory[indexHistory.length - 1];
  const yearChange = ((last.index - first.index) / first.index) * 100;
  const stats = [
    { label: "Изменение за сессию", value: formatChange(indexKse.change), tone: indexKse.change < 0 ? "down" : "up" },
    { label: "Изменение за период", value: formatChange(yearChange), tone: yearChange < 0 ? "down" : "up" },
    { label: "Капитализация", value: `${indexKse.capitalization.toLocaleString("ru-KG")} ${tr("млрд сом")}` },
    { label: "Дата сессии", value: sessionDate },
  ];
  return (
    <article className={`${styles.card} ${styles.markets}`}>
      <SectionHead title="Индекс KSE" href="/market/index" />
      <dl className={styles.stats}>
        {stats.map((item) => (
          <div key={item.label}>
            <dt>{tr(item.label)}</dt>
            <dd className={item.tone === "down" ? styles.down : item.tone === "up" ? styles.up : undefined}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export function MarketPulse() {
  const tr = useTr();
  const [view, setView] = useState<View>("overview");
  const [period, setPeriod] = useState<(typeof periods)[number]["id"]>("all");
  const [tab, setTab] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = periods.find((item) => item.id === period) ?? periods[4];
  const anchor = indexHistory.at(-1)?.index || 1;
  const series = sliceHistory(selected.days).map((item) => ({
    date: item.date,
    value: (item.index / anchor) * indexKse.value,
  }));
  const chart = indexChart(series);
  const down = indexKse.change < 0;

  const activeTab = tabs.find((item) => item.id === tab) ?? tabs[0];
  const needle = query.trim().toLowerCase();
  const rows = instruments
    .filter((item) => activeTab.types.includes(item.type))
    .filter((item) => !needle || item.ticker.toLowerCase().includes(needle) || item.name.toLowerCase().includes(needle))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  return (
    <section className={styles.board} aria-label={tr("График рынка")}>
      <aside className={styles.side}>
        <nav className={`${styles.card} ${styles.nav}`} aria-label={tr("Рынки")}>
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === view}
              data-active={item.id === view || undefined}
              onClick={() => setView(item.id)}
            >
              <NavIcon name={item.icon} />
              {tr(item.label)}
            </button>
          ))}
        </nav>
        <SessionCard />
      </aside>

      <div className={styles.main}>
        {view === "stocks" ? <InstrumentTable title="Акции" href="/market/quotes" types={["stock"]} /> : null}
        {view === "bonds" ? (
          <>
            <InstrumentTable title="Облигации" href="/gcb" types={["bond", "gcb"]} />
            <AuctionsCard />
          </>
        ) : null}
        {view === "metals" ? <InstrumentTable title="Драгметаллы" href="/market/metals" types={["metal"]} /> : null}
        {view === "archive" ? <ArchiveView scale={indexKse.value / anchor} /> : null}
        {view === "overview" || view === "index" ? (
        <article className={`${styles.card} ${styles.chartCard}`}>
          <header className={styles.chartHead}>
            <div>
              <small>KSE Index</small>
              <p>
                <b>{indexKse.value.toLocaleString("ru-KG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                <em className={down ? styles.down : styles.up}>
                  {formatChange(indexKse.change)}
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d={down ? "M4 4l8 8M12 6v6H6" : "M4 12l8-8M6 4h6v6"} />
                  </svg>
                </em>
              </p>
            </div>
            <div className={styles.periods} role="group" aria-label={tr("Период графика")}>
              {periods.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={item.id === period}
                  onClick={() => setPeriod(item.id)}
                >
                  {tr(item.label)}
                </button>
              ))}
            </div>
          </header>
          <svg className={styles.chart} viewBox={`0 0 ${box.width} ${box.height}`} role="img" aria-label={tr("Динамика индекса KSE")}>
            <defs>
              <linearGradient id="kse-board-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className={styles.fillTop} />
                <stop offset="100%" className={styles.fillBottom} />
              </linearGradient>
            </defs>
            {chart.yTicks.map((tick) => (
              <g key={tick.y}>
                <line x1={box.left} x2={chart.plotRight} y1={tick.y} y2={tick.y} className={styles.grid} />
                <text x={box.width - 4} y={tick.y + 4} className={styles.axis} textAnchor="end">
                  {Math.round(tick.value).toLocaleString("ru-KG")}
                </text>
              </g>
            ))}
            {chart.xTicks.map((tick, i) => (
              <text
                key={tick.date}
                x={tick.x}
                y={box.height - 8}
                className={styles.axis}
                textAnchor={i === 0 ? "start" : i === chart.xTicks.length - 1 ? "end" : "middle"}
              >
                {axisDate(tick.date)}
              </text>
            ))}
            <path d={chart.area} fill="url(#kse-board-fill)" />
            <path d={chart.line} className={styles.line} />
            <circle cx={chart.last.x} cy={chart.last.y} r="4" className={styles.dot} />
          </svg>
        </article>
        ) : null}
        {view === "index" ? <IndexStats /> : null}

        {view === "overview" ? (
        <article className={`${styles.card} ${styles.markets}`}>
          <header className={styles.marketsHead}>
            <h3>{tr("Рынки")}</h3>
            <div className={styles.marketsTools}>
              {searchOpen ? (
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={tr("Найти инструмент")}
                  aria-label={tr("Найти инструмент")}
                  autoFocus
                />
              ) : null}
              <button
                type="button"
                aria-label={tr("Найти инструмент")}
                aria-expanded={searchOpen}
                onClick={() => {
                  setSearchOpen((value) => !value);
                  setQuery("");
                }}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <circle cx="7" cy="7" r="4.5" />
                  <path d="M10.5 10.5 14 14" />
                </svg>
              </button>
              <Link href="/market/quotes" aria-label={tr("Все инструменты")}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Link>
            </div>
          </header>
          <div className={styles.tabs} role="tablist" aria-label={tr("Рынки")}>
            {tabs.map((item) => (
              <button key={item.id} type="button" role="tab" aria-selected={item.id === tab} onClick={() => setTab(item.id)}>
                {tr(item.label)}
              </button>
            ))}
          </div>
          <div className={styles.table}>
            <div className={styles.row} data-head="true">
              <span>{tr("Инструмент")}</span>
              <span>{tr("Цена")}</span>
              <span>{tr("Изм.")}</span>
              <span>{tr("Объём")}</span>
            </div>
            {rows.length ? (
              rows.map((item) => (
                <Link key={item.ticker} href={`/market/${item.ticker}`} className={styles.row}>
                  <span className={styles.instrument}>
                    <Badge item={item} />
                    <b>{item.ticker}</b>
                    <small>{item.name}</small>
                  </span>
                  <span>{formatSom(item.price)}</span>
                  <em className={item.change < 0 ? styles.down : item.change > 0 ? styles.up : undefined}>
                    {formatChange(item.change)}
                  </em>
                  <span>{formatSom(item.volume)}</span>
                </Link>
              ))
            ) : (
              <p className={styles.empty}>{tr("Нет инструментов")}</p>
            )}
          </div>
        </article>
        ) : null}
      </div>

      <aside className={styles.side}>
        <MoverList title="Топ роста" list={gainers} href="/market" />
        <MoverList title="Топ падения" list={losers} href="/market" fill />
      </aside>
    </section>
  );
}
