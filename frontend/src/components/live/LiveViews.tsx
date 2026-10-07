"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  fmt,
  fmtDate,
  type AuctionResults,
  type DepositAuctions,
  type IndexData,
  type Quotes,
  type TradeResults,
  type VolumeGs,
} from "@/lib/kse-live";
import { Stat } from "./LiveParts";
import ui from "@/app/ui.module.css";
import css from "./live.module.css";

/* Цвета графиков — из темы сайта, подстраиваются под светлую и тёмную. */
const BRAND = "var(--brand)";
const MUTED = "var(--ink-muted)";
const GRID = "var(--line)";
const tooltipStyle = { borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 12 };
const axis = { tick: { fill: MUTED, fontSize: 11 }, axisLine: false, tickLine: false } as const;
const shortDate = (iso: string) => fmtDate(iso).slice(0, 5);

function SeriesChart({ data, label, unit }: { data: { date: string; value: number }[]; label: string; unit: string }) {
  const id = `fill-${label.replace(/\W/g, "")}`;
  return (
    <div className={css.chart}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND} stopOpacity={0.3} />
              <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} {...axis} />
          <YAxis domain={["auto", "auto"]} width={64} tickFormatter={(v: number) => fmt(v, 0)} {...axis} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(d) => fmtDate(String(d))} formatter={(v) => [`${fmt(Number(v))} ${unit}`, label]} />
          <Area type="monotone" dataKey="value" stroke={BRAND} strokeWidth={2} fill={`url(#${id})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ───── Итоги торгов ───── */

export function TradeResultsView({ data }: { data: TradeResults }) {
  const [periodId, setPeriodId] = useState(data.periods[0]?.id ?? "");
  const period = data.periods.find((item) => item.id === periodId) ?? data.periods[0];
  const label = (title: string) => title.replace(/^Торги за /, "").replace(/\s*\(.*\)$/, "");
  return (
    <div className={css.stack}>
      <div className={css.tabs} role="tablist" aria-label="Период">
        {data.periods.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={item.id === period?.id} onClick={() => setPeriodId(item.id)}>
            {item.id === "last" ? `Последние торги · ${label(item.title)}` : label(item.title)}
          </button>
        ))}
      </div>
      {period ? (
        <>
          <section className={css.section}>
            <h2>{period.title}</h2>
            <div className={css.stats}>
              {period.summary.map((row) => (
                <Stat
                  key={row.label}
                  label={`${row.label}, млн сом`}
                  value={fmt(row.value)}
                  note={row.change === null ? undefined : `${row.change > 0 ? "+" : ""}${fmt(row.change)}%`}
                  tone={row.direction ?? undefined}
                />
              ))}
            </div>
          </section>
          <section className={css.section}>
            <h2>Сделки по ценным бумагам</h2>
            {period.trades.length ? (
              <div className={ui.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Бумага</th>
                      <th>Символ</th>
                      <th>ISIN</th>
                      <th className={css.num}>Max цена, сом</th>
                      <th className={css.num}>Min цена, сом</th>
                      {/* kse.kg: за последний день объём в сомах, за неделю/месяц/год — в тысячах (подписано у них везде «сом»). */}
                      <th className={css.num}>{period.id === "last" ? "Объём, сом" : "Объём, тыс. сом"}</th>
                      <th className={css.num}>Сделок</th>
                      <th className={css.num}>Кол-во ЦБ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {period.trades.map((row) => (
                      <tr key={`${row.symbol}-${row.isin}`}>
                        <td className={css.wrapCell}>{row.name}</td>
                        <td>
                          <b>{row.symbol}</b>
                        </td>
                        <td>{row.isin}</td>
                        <td className={css.num}>{fmt(row.maxPrice)}</td>
                        <td className={css.num}>{fmt(row.minPrice)}</td>
                        <td className={css.num}>{fmt(row.volume)}</td>
                        <td className={css.num}>{fmt(row.deals)}</td>
                        <td className={css.num}>{fmt(row.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={css.empty}>Сделок за этот период нет.</p>
            )}
          </section>
        </>
      ) : null}
      {data.volumeSeries.length ? (
        <section className={css.chartCard}>
          <h3>Объём торгов по дням</h3>
          <p>Млн сом</p>
          <SeriesChart data={data.volumeSeries} label="Объём" unit="млн сом" />
        </section>
      ) : null}
    </div>
  );
}

/* ───── Индекс и капитализация ───── */

export function IndexView({ data }: { data: IndexData }) {
  const first = data.indexSeries[0]?.value;
  const change = first && data.index ? ((data.index - first) / first) * 100 : null;
  return (
    <div className={css.stack}>
      <div className={css.stats}>
        <Stat
          label={`Индекс KSE на ${fmtDate(data.date)}`}
          value={fmt(data.index, 2)}
          note={change === null ? undefined : `${change > 0 ? "+" : ""}${fmt(change, 2)}% за период графика`}
          tone={change === null ? undefined : change >= 0 ? "up" : "down"}
        />
        <Stat label="Капитализация, млн сом" value={fmt(data.capitalization, 2)} />
      </div>
      <div className={css.charts}>
        {data.indexSeries.length ? (
          <section className={css.chartCard}>
            <h3>Индекс KSE</h3>
            <p>Пункты</p>
            <SeriesChart data={data.indexSeries} label="Индекс" unit="п." />
          </section>
        ) : null}
        {data.capSeries.length ? (
          <section className={css.chartCard}>
            <h3>Капитализация рынка</h3>
            <p>Млн сом</p>
            <SeriesChart data={data.capSeries} label="Капитализация" unit="млн сом" />
          </section>
        ) : null}
      </div>
    </div>
  );
}

/* ───── Котировки ───── */

export function QuotesView({ data, initialQuery = "" }: { data: Quotes; initialQuery?: string }) {
  // ?q=ТИКЕР — переход с бегущей строки или блока «Рынки» на главной.
  const [query, setQuery] = useState(initialQuery);
  const q = query.trim().toLowerCase();
  const rows = q ? data.rows.filter((row) => `${row.symbol} ${row.isin} ${row.name}`.toLowerCase().includes(q)) : data.rows;
  return (
    <section className={css.section}>
      <input className={css.filter} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Тикер, ISIN или компания" />
      <div className={ui.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Символ</th>
              <th>Бумага</th>
              <th>ISIN</th>
              <th className={css.num}>Покупка: кол-во</th>
              <th className={css.num}>Покупка: цена, сом</th>
              <th className={css.num}>Продажа: кол-во</th>
              <th className={css.num}>Продажа: цена, сом</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.symbol}-${row.isin}`}>
                <td>
                  <b>{row.symbol}</b>
                </td>
                <td className={css.wrapCell}>{row.name}</td>
                <td>{row.isin}</td>
                <td className={css.num}>{fmt(row.buyAmount)}</td>
                <td className={`${css.num} ${row.buyPrice ? ui.up : ""}`}>{fmt(row.buyPrice, 2)}</td>
                <td className={css.num}>{fmt(row.sellAmount)}</td>
                <td className={`${css.num} ${row.sellPrice ? ui.down : ""}`}>{fmt(row.sellPrice, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? <p className={css.empty}>Ничего не найдено.</p> : null}
    </section>
  );
}

/* ───── Аукционы ГЦБ ───── */

export function AuctionResultsView({ data }: { data: AuctionResults }) {
  const years = useMemo(() => [...new Set(data.rows.map((row) => row.date.slice(0, 4)))], [data.rows]);
  const [year, setYear] = useState(years[0] ?? "");
  const [query, setQuery] = useState("");
  const rows = data.rows.filter((row) => row.date.startsWith(year) && row.code.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <section className={css.section}>
      <div className={css.tabs} role="tablist" aria-label="Год">
        {years.map((item) => (
          <button key={item} type="button" role="tab" aria-selected={item === year} onClick={() => setYear(item)}>
            {item}
          </button>
        ))}
      </div>
      <input className={css.filter} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Регистрационный номер ГЦБ" />
      <div className={ui.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Номер ГЦБ</th>
              <th className={css.num}>Предложение, тыс. сом</th>
              <th className={css.num}>Спрос, тыс. сом</th>
              <th className={css.num}>Продано, тыс. сом</th>
              <th className={css.num}>Доходность min, %</th>
              <th className={css.num}>max, %</th>
              <th className={css.num}>Средняя, %</th>
              <th className={css.num}>Купон, %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.date}-${row.code}-${i}`}>
                <td>{fmtDate(row.date)}</td>
                <td>
                  <b>{row.code}</b>
                </td>
                <td className={css.num}>{fmt(row.offer)}</td>
                <td className={css.num}>{fmt(row.demand)}</td>
                <td className={css.num}>{fmt(row.sold)}</td>
                <td className={css.num}>{fmt(row.minYield)}</td>
                <td className={css.num}>{fmt(row.maxYield)}</td>
                <td className={css.num}>{fmt(row.avgYield)}</td>
                <td className={css.num}>{fmt(row.coupon)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? <p className={css.empty}>Аукционов не найдено.</p> : null}
    </section>
  );
}

/* ───── Объём ГЦБ в обращении ───── */

export function VolumeView({ data }: { data: VolumeGs }) {
  const [kind, setKind] = useState<"gkv" | "gko">(data.gkv.length ? "gkv" : "gko");
  const rows = data[kind];
  const series = [...rows].reverse().map((row) => ({ date: row.date, value: row.volume }));
  const latest = rows[0];
  return (
    <div className={css.stack}>
      <div className={css.tabs} role="tablist" aria-label="Вид бумаг">
        <button type="button" role="tab" aria-selected={kind === "gkv"} onClick={() => setKind("gkv")}>
          ГКВ — казначейские векселя
        </button>
        <button type="button" role="tab" aria-selected={kind === "gko"} onClick={() => setKind("gko")}>
          ГКО — казначейские облигации
        </button>
      </div>
      {latest ? (
        <div className={css.stats}>
          <Stat label={`В обращении на ${fmtDate(latest.date)}, тыс. сом`} value={fmt(latest.volume)} />
        </div>
      ) : null}
      <section className={css.chartCard}>
        <h3>Объём в обращении по неделям</h3>
        <p>Тыс. сом</p>
        <div className={css.chart}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} {...axis} />
              <YAxis width={72} tickFormatter={(v: number) => fmt(v, 0)} {...axis} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "var(--line)" }}
                labelFormatter={(d) => fmtDate(String(d))}
                formatter={(v) => [`${fmt(Number(v))} тыс. сом`, "Объём"]}
              />
              <Bar dataKey="value" fill={BRAND} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <div className={ui.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th className={css.num}>Общий объём в обращении, тыс. сом</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 52).map((row) => (
              <tr key={row.date}>
                <td>{fmtDate(row.date)}</td>
                <td className={css.num}>{fmt(row.volume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───── Депозитные аукционы ───── */

export function DepositsView({ data }: { data: DepositAuctions }) {
  const terms = [...new Set(data.rows.map((row) => row.termMonths ?? 0))].sort((a, b) => a - b);
  return (
    <div className={css.stack}>
      {terms.map((term) => (
        <section className={css.section} key={term}>
          <h2>Срок {term} мес.</h2>
          <div className={ui.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Аукцион</th>
                  <th>Валюта</th>
                  <th className={css.num}>Заявлено</th>
                  <th className={css.num}>Спрос</th>
                  <th className={css.num}>Размещено</th>
                  <th className={css.num}>Ставка min, %</th>
                  <th className={css.num}>max, %</th>
                  <th className={css.num}>Средневзв., %</th>
                </tr>
              </thead>
              <tbody>
                {data.rows
                  .filter((row) => (row.termMonths ?? 0) === term)
                  .map((row, i) => (
                    <tr key={`${row.date}-${i}`}>
                      <td>{fmtDate(row.date)}</td>
                      <td>{row.asset}</td>
                      <td>{row.currency}</td>
                      <td className={css.num}>{fmt(row.declared)}</td>
                      <td className={css.num}>{fmt(row.demand)}</td>
                      <td className={css.num}>{fmt(row.placed)}</td>
                      <td className={css.num}>{fmt(row.minRate)}</td>
                      <td className={css.num}>{fmt(row.maxRate)}</td>
                      <td className={css.num}>{fmt(row.avgRate)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      {!terms.length ? <p className={css.empty}>Аукционов пока не было.</p> : null}
    </div>
  );
}

/** Ссылки на соседние разделы статистики торгов. */
export function MarketLinks({ current }: { current: string }) {
  const links = [
    ["/market", "Итоги торгов"],
    ["/market/archive", "Архив торгов"],
    ["/market/index", "Индекс и капитализация"],
    ["/market/quotes", "Котировки по ЦБ"],
    ["/market/metals", "Драгметаллы"],
    ["/gcb", "Расписание аукционов ГЦБ"],
    ["/gcb/results", "Результаты аукционов ГЦБ"],
    ["/gcb/volume", "Объём ГЦБ"],
    ["/gcb/deposits", "Аукционы по депозитам"],
  ];
  return (
    <nav className={css.tabs} aria-label="Статистика торгов" style={{ marginTop: 28 }}>
      {links.map(([href, label]) => (
        <Link key={href} href={href} className={ui.ghost} aria-current={href === current ? "page" : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

/* ───── Участники торгов ───── */

export function MembersView({ rows }: { rows: { name: string; details: string; suspended: string }[] }) {
  const [query, setQuery] = useState("");
  const [showSuspended, setShowSuspended] = useState(false);
  const q = query.trim().toLowerCase();
  const matched = rows.filter((row) => !q || `${row.name} ${row.details}`.toLowerCase().includes(q));
  const active = matched.filter((row) => !row.suspended);
  const suspended = matched.filter((row) => row.suspended);
  const list = showSuspended ? suspended : active;
  return (
    <section className={css.section}>
      <div className={css.tabs} role="tablist" aria-label="Статус">
        <button type="button" role="tab" aria-selected={!showSuspended} onClick={() => setShowSuspended(false)}>
          Допущены к торгам · {active.length}
        </button>
        <button type="button" role="tab" aria-selected={showSuspended} onClick={() => setShowSuspended(true)}>
          Доступ приостановлен · {suspended.length}
        </button>
      </div>
      <input className={css.filter} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название, адрес или телефон" />
      <div className={css.members}>
        {list.map((row) => (
          <article className={css.member} key={row.name}>
            <b>{row.name}</b>
            {row.details ? <p>{row.details}</p> : null}
            {row.suspended ? <small>{row.suspended}</small> : null}
          </article>
        ))}
      </div>
      {!list.length ? <p className={css.empty}>Никого не найдено.</p> : null}
    </section>
  );
}
