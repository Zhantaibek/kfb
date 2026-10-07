"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import css from "@/app/admin/admin.module.css";

/** Посещения сайта — по образцу админки cds.kg: сводка, графики и список визитов. */

type Period = "today" | "week" | "month" | "all";
type Summary = {
  total: number;
  today: number;
  week: number;
  month: number;
  uniqueToday: number;
  uniqueWeek: number;
  uniqueMonth: number;
  daily: { date: string; visits: number; unique: number }[];
  byWeekday: { index: number; visits: number }[];
  devices: { device: string; visits: number }[];
  popularPages: { path: string; visits: number }[];
};
type VisitRow = { id: string; path: string; ip: string | null; device: string | null; at: string };
type VisitList = { items: VisitRow[]; total: number; page: number; pageSize: number; pageCount: number };

const PAGE_SIZE = 10;
const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Сегодня" },
  { id: "week", label: "Неделя" },
  { id: "month", label: "Месяц" },
  { id: "all", label: "Всё время" },
];
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const DEVICE_LABEL: Record<string, string> = { pc: "ПК", phone: "Телефон", tablet: "Планшет" };

// Цвета из темы админки — графики сами подстраиваются под светлую и тёмную тему.
const BRAND = "var(--brand)";
const INK = "var(--ink)";
const MUTED = "var(--ink-muted)";
const GRID = "var(--line)";
const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--line)",
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 12,
};

function formatDay(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** 1 … 4 5 6 … 20 */
function pageNumbers(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [...new Set([1, total, current - 1, current, current + 1])].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  for (const n of pages) {
    const prev = out[out.length - 1];
    if (typeof prev === "number" && n - prev > 1) out.push("gap");
    out.push(n);
  }
  return out;
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include" });
  if (response.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("unauthorized");
  }
  if (!response.ok) throw new Error(`Не удалось загрузить статистику (${response.status})`);
  return (await response.json()) as T;
}

function ChartEmpty({ text }: { text: string }) {
  return <p className={css.visitsEmpty}>{text}</p>;
}

export function VisitsManager() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [list, setList] = useState<VisitList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("today");
  const [page, setPage] = useState(1);
  const [listFor, setListFor] = useState("");
  const listKey = `${period}:${page}`;
  // Пока грузится новый список, старый остаётся на экране полупрозрачным.
  const listLoading = listFor !== listKey;

  useEffect(() => {
    let cancelled = false;
    getJson<Summary>("/api/admin/analytics/summary")
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getJson<VisitList>(`/api/admin/analytics/visits?period=${period}&page=${page}&pageSize=${PAGE_SIZE}`)
      .then((data) => {
        if (cancelled) return;
        setList(data);
        setListFor(`${period}:${page}`);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [period, page]);

  function selectPeriod(next: Period) {
    setPeriod(next);
    setPage(1);
  }

  const stat = (value: number | undefined) => (summary ? String(value ?? 0) : "…");
  const trend = (summary?.daily ?? []).map((row) => ({ ...row, label: formatDay(row.date) }));
  const hasTrend = trend.some((row) => row.visits > 0);
  const weekdays = WEEKDAYS.map((label, index) => ({
    label,
    visits: summary?.byWeekday.find((row) => row.index === index)?.visits ?? 0,
  }));
  const hasWeekdays = weekdays.some((row) => row.visits > 0);
  const popular = [...(summary?.popularPages ?? [])]
    .slice(0, 8)
    .reverse()
    .map((row) => ({ name: row.path.length > 32 ? `${row.path.slice(0, 31)}…` : row.path, full: row.path, visits: row.visits }));
  const devices = (summary?.devices ?? []).filter((row) => row.visits > 0);
  const deviceTotal = devices.reduce((sum, row) => sum + row.visits, 0);

  return (
    <>
      <p className={css.kicker}>Система</p>
      <h1>Посещения</h1>
      <p className={css.lead}>
        Графики просмотров и список визитов: сегодня, неделя, месяц или всё время. Обновление той же страницы в течение
        30 минут и поисковые боты не считаются.
      </p>
      {error ? <p className={css.error}>{error}</p> : null}

      <div className={css.cards}>
        {[
          { id: "today" as const, label: "Сегодня", value: summary?.today, unique: summary?.uniqueToday },
          { id: "week" as const, label: "За 7 дней", value: summary?.week, unique: summary?.uniqueWeek },
          { id: "month" as const, label: "Этот месяц", value: summary?.month, unique: summary?.uniqueMonth },
          { id: "all" as const, label: "Всего просмотров", value: summary?.total, unique: undefined },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${css.card} ${css.visitStat}`}
            data-on={period === item.id || undefined}
            onClick={() => selectPeriod(item.id)}
          >
            <small>{item.label}</small>
            <b>{stat(item.value)}</b>
            <span>{item.unique === undefined ? "С начала сбора статистики" : summary ? `${item.unique} уникальных посетителей` : ""}</span>
          </button>
        ))}
      </div>

      <div className={css.visitsGrid}>
        <section className={`${css.form} ${css.visitsWide}`}>
          <h2>Посещения за 14 дней</h2>
          <p className={css.note}>Просмотры страниц и уникальные посетители</p>
          {hasTrend ? (
            <div className={css.chart}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="kseVisitsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BRAND} stopOpacity={0.32} />
                      <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, name) => [value ?? 0, name === "visits" ? "Просмотры" : "Уникальные"]}
                  />
                  <Legend formatter={(value) => (value === "visits" ? "Просмотры" : "Уникальные")} wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="visits" stroke={BRAND} strokeWidth={2} fill="url(#kseVisitsFill)" dot={false} />
                  <Area type="monotone" dataKey="unique" stroke={INK} strokeWidth={2} fill="transparent" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty text="Пока нет просмотров за эти дни. Откройте публичный сайт — график начнёт заполняться." />
          )}
        </section>

        <section className={css.form}>
          <h2>По дням недели</h2>
          <p className={css.note}>Когда чаще заходят на сайт (последние 14 дней)</p>
          {hasWeekdays ? (
            <div className={css.chart}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdays} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [value ?? 0, "Просмотры"]} cursor={{ fill: "var(--line)" }} />
                  <Bar dataKey="visits" fill={BRAND} radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty text="Пока нет данных по дням недели." />
          )}
        </section>

        <section className={`${css.form} ${css.visitsWide}`}>
          <h2>Популярные страницы</h2>
          <p className={css.note}>Самые просматриваемые адреса за всё время</p>
          {popular.length ? (
            <div className={css.chart}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popular} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={170} tick={{ fill: INK, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "var(--line)" }}
                    formatter={(value) => [value ?? 0, "Просмотры"]}
                    labelFormatter={(_, payload) => (payload?.[0]?.payload as { full?: string } | undefined)?.full ?? ""}
                  />
                  <Bar dataKey="visits" fill={BRAND} radius={[0, 6, 6, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty text="Популярных страниц пока нет." />
          )}
        </section>

        <section className={css.form}>
          <h2>Устройства</h2>
          <p className={css.note}>С чего заходят в этом месяце</p>
          {devices.length ? (
            <div className={css.deviceBars}>
              {devices
                .sort((a, b) => b.visits - a.visits)
                .map((row) => {
                  const share = Math.round((row.visits / deviceTotal) * 100);
                  return (
                    <div key={row.device}>
                      <span>{DEVICE_LABEL[row.device] ?? "Неизвестно"}</span>
                      <b>
                        {share}% · {row.visits}
                      </b>
                      <i style={{ width: `${share}%` }} />
                    </div>
                  );
                })}
            </div>
          ) : (
            <ChartEmpty text="Нет данных об устройствах за этот месяц." />
          )}
        </section>
      </div>

      <section className={`${css.form} ${css.visitsList}`}>
        <div className={css.toolbar} style={{ marginBottom: 0 }}>
          <div>
            <h2>Список посещений</h2>
            <p className={css.note}>
              {list ? `${list.total} записей · стр. ${list.page} из ${list.pageCount}` : "Загрузка…"}
            </p>
          </div>
          <div className={css.periodTabs} role="tablist" aria-label="Период">
            {PERIODS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={period === item.id}
                data-on={period === item.id || undefined}
                onClick={() => selectPeriod(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {list && list.items.length === 0 ? (
          <p className={css.note}>За этот период посещений нет. Откройте публичный сайт — счётчик начнёт накапливать данные.</p>
        ) : list ? (
          <div className={css.table} style={{ opacity: listLoading ? 0.6 : 1 }}>
            <table>
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Устройство</th>
                  <th>IP</th>
                  <th>Страница</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((visit) => (
                  <tr key={visit.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{formatTime(visit.at)}</td>
                    <td>{visit.device ? (DEVICE_LABEL[visit.device] ?? visit.device) : "—"}</td>
                    <td className={css.mono}>{visit.ip || "—"}</td>
                    <td className={css.wrap} title={visit.path}>
                      <a href={visit.path} target="_blank" rel="noreferrer">
                        {visit.path}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {list && list.pageCount > 1 ? (
          <div className={css.pager}>
            <button className={css.ghost} type="button" disabled={page <= 1 || listLoading} onClick={() => setPage(page - 1)}>
              Назад
            </button>
            {pageNumbers(list.page, list.pageCount).map((item, index) =>
              item === "gap" ? (
                <span key={`gap-${index}`}>…</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={css.ghost}
                  data-on={item === list.page || undefined}
                  disabled={listLoading}
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              ),
            )}
            <button
              className={css.ghost}
              type="button"
              disabled={page >= list.pageCount || listLoading}
              onClick={() => setPage(page + 1)}
            >
              Вперёд
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
}
