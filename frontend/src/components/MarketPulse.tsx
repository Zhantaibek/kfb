"use client";

import { useState } from "react";
import Link from "next/link";
import { formatChange, formatSom, formatVolume, type Instrument, type InstrumentType } from "@/data/catalog";
import { useMarketData } from "@/components/MarketDataProvider";
import { instrumentHref, type MarketData, type TradeRow } from "@/lib/market-data";
import { chartDate, niceScale } from "@/lib/chart-scale";
import type { IndexChart } from "@/lib/kse-live";
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

function sliceHistory(indexHistory: MarketData["indexHistory"], days: number) {
  if (!days || indexHistory.length < 2) return indexHistory;
  const end = historyDate(indexHistory[indexHistory.length - 1].date);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const sliced = indexHistory.filter((item) => historyDate(item.date) >= start);
  return sliced.length >= 2 ? sliced : indexHistory.slice(-2);
}

/**
 * Плавная линия через реальные точки — монотонная кубическая кривая (Фриче — Карлсон). В отличие от обычного
 * сплайна она не «перелетает» выше или ниже соседних точек на резких скачках, то есть не рисует значения индекса,
 * которых не было: между двумя точками линия всегда остаётся в их пределах.
 */
function linePath(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 3) return points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const dx = points.slice(1).map((p, i) => p.x - points[i].x);
  const slope = points.slice(1).map((p, i) => (p.y - points[i].y) / (dx[i] || 1));
  // Касательные в точках: 0 на экстремумах и плато, иначе — гармоническое среднее соседних наклонов.
  const tangent = points.map((_, i) => {
    if (i === 0) return slope[0];
    if (i === n - 1) return slope[n - 2];
    const a = slope[i - 1];
    const b = slope[i];
    if (a * b <= 0) return 0;
    const wa = 2 * dx[i] + dx[i - 1];
    const wb = dx[i] + 2 * dx[i - 1];
    return (wa + wb) / (wa / a + wb / b);
  });
  let path = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    const p = points[i];
    const q = points[i + 1];
    path += ` C${(p.x + h).toFixed(1)},${(p.y + tangent[i] * h).toFixed(1)} ${(q.x - h).toFixed(1)},${(q.y - tangent[i + 1] * h).toFixed(1)} ${q.x.toFixed(1)},${q.y.toFixed(1)}`;
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

// Снизу место под подписи дат, повёрнутые наискосок (как на kse.kg).
const box = { width: 720, height: 260, left: 64, right: 58, top: 12, bottom: 56 };

/**
 * Геометрия графика индекса. Шкала — круглые деления (niceScale), даты — «ДД-ММ-ГГГГ».
 * markers — редкие точки (по одной в месяц): у каждой кружок и своя подпись, как на главной kse.kg;
 * иначе подписей не больше шести, чтобы не налезали.
 */
function indexChart(series: { date: string; value: number }[], markers: boolean) {
  const values = series.map((item) => item.value);
  const scale = niceScale(values) ?? { domain: [Math.min(...values), Math.max(...values) || 1] as [number, number], ticks: [] as number[] };
  const [yMin, yMax] = scale.domain;
  const ySpan = yMax - yMin || 1;
  const innerW = box.width - box.left - box.right;
  const innerH = box.height - box.top - box.bottom;
  const toY = (value: number) => box.top + innerH - ((value - yMin) / ySpan) * innerH;
  const points = series.map((item, index) => ({
    ...item,
    x: box.left + (index / Math.max(series.length - 1, 1)) * innerW,
    y: toY(item.value),
  }));
  const line = linePath(points);
  const base = box.top + innerH;
  const last = points[points.length - 1];
  const area = `${line} L${last.x.toFixed(1)},${base} L${points[0].x.toFixed(1)},${base} Z`;
  const yTicks = scale.ticks.map((value) => ({ value, y: toY(value) }));
  const count = markers ? points.length : Math.min(points.length, 6);
  const xTicks = Array.from({ length: count }, (_, i) =>
    points[Math.round((i * (points.length - 1)) / Math.max(count - 1, 1))],
  ).filter((point, i, list) => list.indexOf(point) === i);
  return { line, area, last, base, yTicks, xTicks, points, plotRight: box.width - box.right };
}

/** Что показывает график на главной: индекс KSE или капитализацию рынка (переключатель, как на kse.kg). */
type Metric = "index" | "cap";

/** Ряд для выбранного периода из истории нашей базы: 1Д/1Н/1М — по дням, 1Г — как на kse.kg, «Всё» — по месяцам. */
function chartSeries(chart: IndexChart, periodId: (typeof periods)[number]["id"], days: number, metric: Metric = "index") {
  const year = metric === "cap" ? chart.capitalization : chart.index;
  if (periodId === "1y") return { series: year, markers: true };
  if (periodId === "all") {
    const allMonthly = metric === "cap" ? chart.capAllMonthly : chart.allMonthly;
    const all = allMonthly?.length ? allMonthly : year;
    return { series: all, markers: all.length <= 24 };
  }
  const daily = (metric === "cap" ? chart.capDaily : chart.daily) ?? [];
  if (daily.length < 2) return { series: year, markers: true };
  const end = new Date(`${daily[daily.length - 1].date}T00:00:00Z`);
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const sliced = daily.filter((item) => new Date(`${item.date}T00:00:00Z`) >= start);
  return { series: sliced.length >= 2 ? sliced : daily.slice(-2), markers: false };
}

function Badge({ item }: { item: Pick<Instrument, "ticker" | "type"> }) {
  return (
    <i className={styles.badge} data-type={item.type} aria-hidden="true">
      {item.ticker.slice(0, 1)}
    </i>
  );
}

type Mover = { key: string; href: string; label: string; change: number; type: InstrumentType | "index" };

function moversOf(market: MarketData) {
  const movers: Mover[] = [
    { key: "KSE", href: "/market/index", label: "KSE Index", change: market.index.change, type: "index" },
    ...market.instruments.map((item) => ({
      key: item.ticker,
      href: instrumentHref(market, item.ticker),
      label: item.ticker,
      change: item.change,
      type: item.type,
    })),
  ];
  return {
    gainers: movers.filter((item) => item.change > 0).sort((a, b) => b.change - a.change).slice(0, 8),
    losers: movers.filter((item) => item.change < 0).sort((a, b) => a.change - b.change).slice(0, 8),
  };
}

/**
 * Сделки с kse.kg (последняя сессия или лидеры недели): тикер и цена или объём.
 * Для объёма под строкой — полоса доли от лидера, внизу — итоги недели по всем сделкам.
 */
function TradeList({
  title,
  rows,
  href,
  metric,
  fill,
  total,
}: {
  title: string;
  rows: TradeRow[];
  href: string;
  metric: "price" | "volume";
  fill?: boolean;
  total?: MarketData["weekTotal"];
}) {
  const tr = useTr();
  const market = useMarketData();
  const top = Math.max(...rows.map((item) => item.volume), 1);
  return (
    <article className={fill ? `${styles.card} ${styles.fill}` : styles.card}>
      <header className={styles.cardHead}>
        <h3>{tr(title)}</h3>
        <Link href={href} aria-label={tr(title)}>
          <Arrow />
        </Link>
      </header>
      {rows.length ? (
        <ul className={styles.movers}>
          {rows.map((item) => (
            <li key={item.ticker}>
              <Link href={instrumentHref(market, item.ticker)} title={item.name}>
                <Badge item={{ ticker: item.ticker, type: "stock" }} />
                <span>{item.ticker}</span>
                {/* Объём недели у kse.kg — в тысячах сомов. */}
                <em>{metric === "price" ? `${formatSom(item.price)} ${tr("сом")}` : formatSom(item.volume)}</em>
                {metric === "volume" ? (
                  <i className={styles.share} aria-hidden="true">
                    {/* Доля от лидера; совсем малые объёмы всё равно видны тонкой чертой. */}
                    <i style={{ width: `${Math.max((item.volume / top) * 100, 1.5)}%` }} />
                  </i>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>{tr("Сделок не было")}</p>
      )}
      {total && total.deals ? (
        <dl className={`${styles.totals} ${styles.facts}`}>
          <div>
            <dt>{tr("Итого за неделю, тыс. сом")}</dt>
            <dd>{formatSom(total.volume)}</dd>
          </div>
          <div>
            <dt>{tr("Сделок")}</dt>
            <dd>{total.deals.toLocaleString("ru-KG")}</dd>
          </div>
          <div>
            <dt>{tr("Бумаг с объёмом")}</dt>
            <dd>{total.papers}</dd>
          </div>
        </dl>
      ) : null}
    </article>
  );
}

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

/**
 * Итоги последней торговой сессии: объём по сегментам рынка и изменение к прошлой сессии;
 * внизу — индекс KSE с графиком за период, капитализация и число сделок.
 */
function SessionCard() {
  const tr = useTr();
  const { sessionDate, sessionHours, tradingRows, index: indexKse, indexHistory, stats } = useMarketData();
  return (
    <article className={`${styles.card} ${styles.fill}`}>
      <header className={styles.cardHead}>
        <h3>{tr("Итоги торгов")}</h3>
        <Link href="/market/archive" aria-label={tr("Итоги торгов")}>
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
              <b>{formatVolume(item.value)}</b>
              <em className={item.change < 0 ? styles.down : item.change > 0 ? styles.up : undefined}>
                {formatChange(item.change)}
              </em>
            </dd>
          </div>
        ))}
      </dl>
      <p className={styles.sessionMeta}>{tr("Объём, млн сом")}</p>

      <div className={styles.totals}>
        <Link href="/market/index" className={styles.sessionIndex}>
          <span>{tr("Индекс KSE")}</span>
          <b>{indexKse.value.toLocaleString("ru-KG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
          <em className={indexKse.change < 0 ? styles.down : indexKse.change > 0 ? styles.up : undefined}>
            {formatChange(indexKse.change)}
          </em>
        </Link>
        {indexHistory.length > 1 ? (
          <Sparkline values={indexHistory.map((item) => item.index)} className={styles.sessionSpark} />
        ) : null}
        <dl className={styles.facts}>
          <div>
            <dt>{tr("Капитализация")}</dt>
            <dd>
              {indexKse.capitalization.toLocaleString("ru-KG")} <small>{tr("млрд сом")}</small>
            </dd>
          </div>
          <div>
            <dt>{tr("Сделок за сессию")}</dt>
            <dd>{stats.trades.toLocaleString("ru-KG")}</dd>
          </div>
        </dl>
      </div>
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
  const market = useMarketData();
  const rows = market.instruments.filter((item) => types.includes(item.type)).sort((a, b) => b.volume - a.volume);
  return (
    <article className={`${styles.card} ${styles.markets}`}>
      <SectionHead title={title} href={href} />
      <div className={styles.table}>
        <div className={styles.row} data-head="true">
          <span>{tr("Инструмент")}</span>
          <span>{tr("Цена")}</span>
          <span>{market.live ? tr("Вид") : tr("Изм.")}</span>
          <span>{market.live ? tr("Объём, тыс.") : tr("Объём")}</span>
        </div>
        {rows.map((item) => (
          <InstrumentRow key={item.ticker} item={item} market={market} />
        ))}
      </div>
    </article>
  );
}

function AuctionsCard() {
  const tr = useTr();
  const { auctions } = useMarketData();
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
  const { indexHistory, sessionDate, tradingRows } = useMarketData();
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
  const { indexHistory, index: indexKse, sessionDate } = useMarketData();
  const first = indexHistory[0];
  const last = indexHistory[indexHistory.length - 1];
  // Данных нет — прочерки, а не нули.
  const yearChange = first && last && first.index ? ((last.index - first.index) / first.index) * 100 : null;
  const stats = [
    { label: "Изменение за сессию", value: indexKse.value ? formatChange(indexKse.change) : "—", tone: indexKse.change < 0 ? "down" : "up" },
    { label: "Изменение за период", value: yearChange === null ? "—" : formatChange(yearChange), tone: (yearChange ?? 0) < 0 ? "down" : "up" },
    { label: "Капитализация", value: indexKse.capitalization ? `${indexKse.capitalization.toLocaleString("ru-KG")} ${tr("млрд сом")}` : "—" },
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

/** Строка таблицы «Рынки»: в живых данных вместо изменения цены (его нет на kse.kg) — вид бумаги. */
function InstrumentRow({ item, market }: { item: Instrument; market: MarketData }) {
  const tr = useTr();
  return (
    <Link href={instrumentHref(market, item.ticker)} className={styles.row}>
      <span className={styles.instrument}>
        <Badge item={item} />
        <b>{item.ticker}</b>
        <small>{item.name}</small>
      </span>
      <span>{item.price ? formatSom(item.price) : "—"}</span>
      {market.live ? (
        <span>{tr(item.description)}</span>
      ) : (
        <em className={item.change < 0 ? styles.down : item.change > 0 ? styles.up : undefined}>{formatChange(item.change)}</em>
      )}
      <span>{item.volume ? formatSom(item.volume) : "—"}</span>
    </Link>
  );
}

export function MarketPulse() {
  const tr = useTr();
  const market = useMarketData();
  const { indexHistory, index: indexKse, instruments } = market;
  const { gainers, losers } = moversOf(market);
  const [view, setView] = useState<View>("overview");
  // Есть история из нашей базы — по умолчанию год, как на главной kse.kg; иначе — всё, что есть в снимке.
  const [period, setPeriod] = useState<(typeof periods)[number]["id"]>(market.indexChart ? "1y" : "all");
  const [metric, setMetric] = useState<Metric>("index");
  const [tab, setTab] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = periods.find((item) => item.id === period) ?? periods[4];
  const anchor = indexHistory.at(-1)?.index || 1;
  // Капитализация — только по истории из нашей базы; без неё переключатель не показываем.
  const showCap = metric === "cap" && Boolean(market.indexChart?.capitalization.length);
  const fromBase = market.indexChart ? chartSeries(market.indexChart, selected.id, selected.days, showCap ? "cap" : "index") : null;
  const series =
    fromBase?.series ??
    sliceHistory(indexHistory, selected.days).map((item) => ({
      date: item.date,
      value: (item.index / anchor) * indexKse.value,
    }));
  const markers = fromBase?.markers ?? false;
  // Меньше двух точек — графика нет (данные ещё не загружены), вместо него подпись «Нет данных».
  const chart = series.length > 1 ? indexChart(series, markers) : null;
  // Изменение капитализации — к предыдущей точке ряда (по дням — к прошлому дню).
  const capDaily = market.indexChart?.capDaily ?? [];
  const capChange = capDaily.length > 1 ? ((capDaily[capDaily.length - 1].value - capDaily[capDaily.length - 2].value) / capDaily[capDaily.length - 2].value) * 100 : 0;
  const headChange = showCap ? capChange : indexKse.change;
  // Капитализация в заголовке — из того же ряда, что и график (млн → млрд сом); нет ряда — из снимка kse.kg.
  const capNow = capDaily.length ? capDaily[capDaily.length - 1].value / 1000 : indexKse.capitalization;
  const down = headChange < 0;

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
              <small>{showCap ? tr("Капитализация, млрд сом") : "KSE Index"}</small>
              <p>
                <b>
                  {showCap
                    ? capNow.toLocaleString("ru-KG", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                    : indexKse.value.toLocaleString("ru-KG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </b>
                <em className={down ? styles.down : styles.up}>
                  {formatChange(headChange)}
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
          {market.indexChart?.capitalization.length ? (
            // Переключатель «Индекс | Капитализация», как на главной kse.kg.
            <div className={styles.metrics} role="tablist" aria-label={tr("Показатель графика")}>
              {(
                [
                  ["index", "Индекс"],
                  ["cap", "Капитализация"],
                ] as const
              ).map(([id, label]) => (
                <button key={id} type="button" role="tab" aria-selected={metric === id} onClick={() => setMetric(id)}>
                  {tr(label)}
                </button>
              ))}
            </div>
          ) : null}
          {!chart ? (
            <p className={styles.note}>{tr("Нет данных")}</p>
          ) : (
          <svg
            className={styles.chart}
            viewBox={`0 0 ${box.width} ${box.height}`}
            role="img"
            aria-label={tr(showCap ? "Динамика капитализации рынка" : "Динамика индекса KSE")}
          >
            <defs>
              <linearGradient id="kse-board-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className={styles.fillTop} />
                <stop offset="100%" className={styles.fillBottom} />
              </linearGradient>
            </defs>
            {chart.yTicks.map((tick) => (
              <g key={tick.value}>
                <line x1={box.left} x2={chart.plotRight} y1={tick.y} y2={tick.y} className={styles.grid} />
                <text x={box.width - 4} y={tick.y + 4} className={styles.axis} textAnchor="end">
                  {tick.value.toLocaleString("ru-KG", { maximumFractionDigits: 2 })}
                </text>
              </g>
            ))}
            {chart.xTicks.map((tick) => (
              <g key={tick.date}>
                {/* Даты «ДД-ММ-ГГГГ» наискосок — как на kse.kg, помещаются и при точке на каждый месяц. */}
                <text
                  x={tick.x}
                  y={chart.base + 14}
                  className={styles.axis}
                  textAnchor="end"
                  transform={`rotate(-35 ${tick.x} ${chart.base + 14})`}
                >
                  {chartDate(tick.date)}
                </text>
              </g>
            ))}
            <path d={chart.area} fill="url(#kse-board-fill)" />
            <path d={chart.line} className={styles.line} />
            {markers ? (
              chart.points.map((point) => <circle key={point.date} cx={point.x} cy={point.y} r="2.5" className={styles.marker} />)
            ) : (
              <circle cx={chart.last.x} cy={chart.last.y} r="4" className={styles.dot} />
            )}
          </svg>
          )}
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
              <span>{market.live ? tr("Вид") : tr("Изм.")}</span>
              <span>{market.live ? tr("Объём, тыс.") : tr("Объём")}</span>
            </div>
            {rows.length ? (
              rows.map((item) => <InstrumentRow key={item.ticker} item={item} market={market} />)
            ) : (
              <p className={styles.empty}>{tr("Нет инструментов")}</p>
            )}
          </div>
        </article>
        ) : null}
      </div>

      <aside className={styles.side}>
        {market.live ? (
          <>
            <TradeList title={`Сделки ${market.sessionDate}`} rows={market.lastTrades} href="/market" metric="price" />
            <TradeList title="Лидеры недели по объёму, тыс. сом" rows={market.weekLeaders} href="/market" metric="volume" fill total={market.weekTotal} />
          </>
        ) : (
          <>
            <MoverList title="Топ роста" list={gainers} href="/market" fill />
            <MoverList title="Топ падения" list={losers} href="/market" fill />
          </>
        )}
      </aside>
    </section>
  );
}
