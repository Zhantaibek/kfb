"use client";

import { useEffect, useState } from "react";
import { IndexChart } from "./IndexChart";

type Point = { date: string; value: number; cap: number };

const periods = [
  { id: "1w", label: "1Н", take: 6 },
  { id: "1m", label: "1М", take: 23 },
  { id: "all", label: "Всё", take: Infinity },
] as const;

const fmt = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * График индекса для «полных» макетов: вкладки «Индекс / Капитализация» и периоды 1Н / 1М / Всё.
 * css — CSS-модуль макета: chartCard, chartTop, switcher, chartValue, muted и классы IndexChart (bigChart…).
 */
export function FullChart({ series, change, css }: { series: Point[]; change: string; css: Readonly<Record<string, string>> }) {
  const [mode, setMode] = useState<"index" | "cap">("index");
  const [period, setPeriod] = useState<(typeof periods)[number]["id"]>("all");
  const take = periods.find((p) => p.id === period)?.take ?? Infinity;
  const rows = series.slice(-Math.min(take, series.length));
  const points = rows.map((row) => ({ date: row.date, value: mode === "index" ? row.value : row.cap }));
  const last = points.at(-1)?.value ?? 0;

  return (
    <div className={css.chartCard}>
      <div className={css.chartTop}>
        <div className={css.switcher} role="group" aria-label="Показатель">
          <button type="button" aria-pressed={mode === "index"} onClick={() => setMode("index")}>
            Индекс KSE
          </button>
          <button type="button" aria-pressed={mode === "cap"} onClick={() => setMode("cap")}>
            Капитализация
          </button>
        </div>
        <div className={css.switcher} role="group" aria-label="Период">
          {periods.map((p) => (
            <button key={p.id} type="button" aria-pressed={p.id === period} onClick={() => setPeriod(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className={css.chartValue}>
        <b>{fmt.format(last)}</b>
        <span>{mode === "index" ? change : "млрд сом"}</span>
      </div>
      {points.length > 1 ? <IndexChart key={`${mode}-${period}`} points={points} css={css} /> : <p className={css.muted}>Нет данных за период</p>}
    </div>
  );
}

/** Переключатель светлой и тёмной темы макета: ставит data-theme на корневой элемент с id rootId. */
export function ThemeButton({ rootId, className, initialDark = false }: { rootId: string; className?: string; initialDark?: boolean }) {
  const [dark, setDark] = useState(initialDark);
  useEffect(() => {
    document.getElementById(rootId)?.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark, rootId]);
  return (
    <button type="button" className={className} onClick={() => setDark((v) => !v)} aria-pressed={dark} aria-label="Тёмная тема">
      {dark ? "☾" : "☀"}
    </button>
  );
}
