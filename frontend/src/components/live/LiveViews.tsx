"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  fmt,
  fmtDate,
  fmtVolume,
  type AuctionResults,
  type DepositAuctions,
  type IndexChart,
  type IndexData,
  type Quotes,
  type TradeResults,
  type VolumeGs,
} from "@/lib/kse-live";
import { chartDate, niceScale } from "@/lib/chart-scale";
import { Stat } from "./LiveParts";
import ui from "@/app/ui.module.css";
import css from "./live.module.css";

/* Цвета графиков — из темы сайта, подстраиваются под светлую и тёмную. */
const BRAND = "var(--brand)";
const MUTED = "var(--ink-muted)";
const GRID = "var(--line)";
const tooltipStyle = { borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 12 };
const axis = { tick: { fill: MUTED, fontSize: 10 }, axisLine: { stroke: GRID }, tickLine: { stroke: GRID } } as const;
const shortDate = (iso: string) => fmtDate(iso).slice(0, 5);
/** «2026-05-25» → «25-05-2026» — подписи дат на графиках рынка, как на kse.kg. */
const dashDate = chartDate;

/**
 * markers — как на главной kse.kg: у каждой точки кружок и своя подпись даты (для редких точек, например по одной
 * в месяц). Без него — сплошная линия по дням, подписи дат прореживаются, чтобы не налезали друг на друга.
 */
function SeriesChart({ data, label, unit, markers = false }: { data: { date: string; value: number }[]; label: string; unit: string; markers?: boolean }) {
  const id = `fill-${label.replace(/\W/g, "")}`;
  const scale = useMemo(() => niceScale(data.map((row) => row.value)), [data]);
  // Дробный шаг (0,5; 0,25…) — подписи с нужным числом знаков, целый — без копеек.
  const digits = scale && scale.step < 1 ? Math.min(4, Math.ceil(-Math.log10(scale.step))) : 0;
  return (
    <div className={css.chart}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND} stopOpacity={0.3} />
              <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={dashDate}
            minTickGap={markers ? 0 : 16}
            angle={-35}
            textAnchor="end"
            height={64}
            interval={markers ? 0 : "preserveStartEnd"}
            {...axis}
          />
          <YAxis
            domain={scale?.domain ?? ["auto", "auto"]}
            ticks={scale?.ticks}
            allowDataOverflow={false}
            width={72}
            tickFormatter={(v: number) => fmt(v, digits)}
            {...axis}
          />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(d) => dashDate(String(d))} formatter={(v) => [`${fmt(Number(v))} ${unit}`, label]} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={BRAND}
            strokeWidth={2}
            fill={`url(#${id})`}
            dot={markers ? { r: 4, fill: "var(--surface)", stroke: BRAND, strokeWidth: 2 } : false}
            activeDot={markers ? { r: 6, fill: BRAND, stroke: "var(--surface)", strokeWidth: 2 } : undefined}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ───── Итоги торгов ───── */

export function TradeResultsView({ data, only }: { data: TradeResults; /** Показать один период без вкладок (например, "last" — последний торговый день). */ only?: string }) {
  const periods = only ? data.periods.filter((item) => item.id === only) : data.periods;
  const [periodId, setPeriodId] = useState(periods[0]?.id ?? "");
  const period = periods.find((item) => item.id === periodId) ?? periods[0];
  // «За Сентябрь месяц» с kse.kg → «За сентябрь».
  const label = (title: string) =>
    title
      .replace(/^Торги за /, "")
      .replace(/\s*\(.*\)$/, "")
      .replace(/^За ([А-ЯЁ][а-яё]+) месяц$/, (_, month: string) => `За ${month.toLowerCase()}`);
  return (
    <div className={css.stack}>
      {periods.length > 1 ? (
      <div className={css.tabs} role="tablist" aria-label="Период">
        {periods.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={item.id === period?.id} onClick={() => setPeriodId(item.id)}>
            {item.id === "last" ? `Последние торги · ${label(item.title)}` : label(item.title)}
          </button>
        ))}
      </div>
      ) : null}
      {period ? (
        <>
          <section className={css.section}>
            <h2>{period.title}</h2>
            <div className={css.stats}>
              {period.summary.map((row) => (
                <Stat
                  key={row.label}
                  label={`${row.label}, млн сом`}
                  value={fmtVolume(row.value)}
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

export function IndexView({ data, monthly = null }: { data: IndexData; monthly?: IndexChart | null }) {
  // Есть история из нашей базы — графики как на главной kse.kg: 12 месяцев, максимум за месяц, точка на месяц.
  const indexSeries = monthly?.index.length ? monthly.index : data.indexSeries;
  const capSeries = monthly?.capitalization.length ? monthly.capitalization : data.capSeries;
  const period = monthly ? "за 12 месяцев" : "за период графика";
  const first = indexSeries[0]?.value;
  const change = first && data.index ? ((data.index - first) / first) * 100 : null;
  return (
    <div className={css.stack}>
      <div className={css.stats}>
        <Stat
          label={`Индекс KSE на ${fmtDate(data.date)}`}
          value={fmt(data.index, 2)}
          note={change === null ? undefined : `${change > 0 ? "+" : ""}${fmt(change, 2)}% ${period}`}
          tone={change === null ? undefined : change >= 0 ? "up" : "down"}
        />
        <Stat label="Капитализация, млн сом" value={fmt(data.capitalization, 2)} />
      </div>
      <div className={css.charts}>
        {indexSeries.length ? (
          <section className={css.chartCard}>
            <h3>Индекс KSE</h3>
            <p>{monthly ? "Пункты · максимум за месяц, 12 месяцев" : "Пункты"}</p>
            <SeriesChart data={indexSeries} label="Индекс" unit="п." markers={Boolean(monthly)} />
          </section>
        ) : null}
        {capSeries.length ? (
          <section className={css.chartCard}>
            <h3>Капитализация рынка</h3>
            <p>{monthly ? "Млн сом · максимум за месяц, 12 месяцев" : "Млн сом"}</p>
            <SeriesChart data={capSeries} label="Капитализация" unit="млн сом" markers={Boolean(monthly)} />
          </section>
        ) : null}
      </div>
    </div>
  );
}

/* ───── Котировки ───── */

const quoteTabs = [
  { id: "all", label: "Все" },
  { id: "stock", label: "Акции" },
  { id: "bond", label: "Облигации" },
  { id: "gcb", label: "ГЦБ" },
] as const;

export function QuotesView({ data, initialQuery = "" }: { data: Quotes; initialQuery?: string }) {
  // ?q=ТИКЕР — переход с бегущей строки или блока «Рынки» на главной.
  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState<(typeof quoteTabs)[number]["id"]>("all");
  const kindOf = (row: Quotes["rows"][number]) => row.kind ?? "stock";
  const count = (id: (typeof quoteTabs)[number]["id"]) => (id === "all" ? data.rows.length : data.rows.filter((row) => kindOf(row) === id).length);
  const q = query.trim().toLowerCase();
  const rows = data.rows
    .filter((row) => tab === "all" || kindOf(row) === tab)
    .filter((row) => !q || `${row.symbol} ${row.isin} ${row.name}`.toLowerCase().includes(q));
  return (
    <section className={css.section}>
      {/* Разделы по виду бумаги, число — сколько бумаг с заявками в разделе. */}
      <div className={css.segments} role="tablist" aria-label="Вид бумаги">
        {quoteTabs.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={item.id === tab} onClick={() => setTab(item.id)}>
            {item.label}
            <sup>{count(item.id)}</sup>
          </button>
        ))}
      </div>
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

/**
 * Тип аукциона — по коду выпуска, как на старом сайте: GD… — векселя ГКВ-12, GBA… — облигации ГКО-2.
 * ГКЮ — заготовка: какие выпуски к ней относятся, пока не определено, раздел пустой.
 */
const auctionTypes = [
  { id: "gkv", label: "ГКВ-12", match: (code: string) => /^GD/i.test(code) },
  { id: "gko", label: "ГКО-2", match: (code: string) => /^GBA/i.test(code) },
  { id: "gku", label: "ГКЮ", match: () => false },
] as const;

export function AuctionResultsView({ data }: { data: AuctionResults }) {
  const [type, setType] = useState<(typeof auctionTypes)[number]["id"]>("gkv");
  const typeRows = useMemo(() => {
    const current = auctionTypes.find((item) => item.id === type) ?? auctionTypes[0];
    return data.rows.filter((row) => current.match(row.code));
  }, [data.rows, type]);
  const years = useMemo(() => [...new Set(typeRows.map((row) => row.date.slice(0, 4)))], [typeRows]);
  const [pickedYear, setYear] = useState("");
  // Год из списка выбранного типа; при смене типа без такого года — самый свежий.
  const year = years.includes(pickedYear) ? pickedYear : (years[0] ?? "");
  const [query, setQuery] = useState("");
  const rows = typeRows.filter((row) => row.date.startsWith(year) && row.code.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <section className={css.section}>
      <p className={css.segmentsLabel}>Тип аукциона:</p>
      <div className={css.segments} role="tablist" aria-label="Тип аукциона">
        {auctionTypes.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={item.id === type} onClick={() => setType(item.id)}>
            {item.label}
            <sup>{data.rows.filter((row) => item.match(row.code)).length}</sup>
          </button>
        ))}
      </div>
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
