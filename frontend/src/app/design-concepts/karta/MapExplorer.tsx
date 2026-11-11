"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { cityPoints, mapHeight, mapWidth, regionShapes, type RegionId } from "./kgz-map";
import css from "./karta.module.css";

export type RegionIssuer = { slug: string; name: string; activity: string };
export type RegionData = { id: RegionId; name: string; issuers: RegionIssuer[]; activities: [string, number][] };

const nf = new Intl.NumberFormat("ru-RU");

/** Склонение: 1 эмитент, 2 эмитента, 5 эмитентов. */
function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

// Бишкек рисуем последним — он лежит внутри Чуйской области.
const drawOrder = [...regionShapes].sort((a, b) => (a.id === "bishkek" ? 1 : b.id === "bishkek" ? -1 : 0));

/**
 * Карта эмитентов по областям: цвет области — число эмитентов (по адресу регистрации из Центра раскрытия),
 * клик или Enter выбирает область, справа — её компании с фильтром. Тот же выбор доступен списком областей
 * под картой; фигуры на карте тоже фокусируются и подписаны для экранных дикторов.
 */
export function MapExplorer({ regions, total, unknown }: { regions: RegionData[]; total: number; unknown: number }) {
  const byId = useMemo(() => new Map(regions.map((r) => [r.id, r])), [regions]);
  const max = Math.max(1, ...regions.map((r) => r.issuers.length));
  const [selected, setSelected] = useState<RegionId>("chuy");
  const [hover, setHover] = useState<RegionId | null>(null);
  const [query, setQuery] = useState("");
  const [all, setAll] = useState(false);

  const current = byId.get(selected);
  const list = (current?.issuers ?? []).filter((i) => !query.trim() || `${i.name} ${i.activity}`.toLowerCase().includes(query.trim().toLowerCase()));
  const shown = all ? list : list.slice(0, 12);
  const tip = hover ? byId.get(hover) : null;
  const tipShape = hover ? regionShapes.find((s) => s.id === hover) : null;

  // Насыщенность по корню из доли: Бишкек не «выжигает» шкалу, а области с 1–2 компаниями всё равно видны.
  const level = (count: number) => (count ? 0.18 + 0.82 * Math.sqrt(count / max) : 0);

  function choose(id: RegionId) {
    setSelected(id);
    setQuery("");
    setAll(false);
  }

  return (
    <div className={css.explorer}>
      <div className={css.mapBox}>
        <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} className={css.map} role="group" aria-label="Карта областей Кыргызстана">
          {drawOrder.map((shape) => {
            const count = byId.get(shape.id)?.issuers.length ?? 0;
            return (
              <path
                key={shape.id}
                d={shape.d}
                className={css.region}
                data-selected={shape.id === selected || undefined}
                style={{ "--level": level(count) } as CSSProperties}
                role="button"
                tabIndex={0}
                aria-pressed={shape.id === selected}
                aria-label={`${shape.name}: ${count} ${plural(count, "эмитент", "эмитента", "эмитентов")}`}
                onClick={() => choose(shape.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    choose(shape.id);
                  }
                }}
                onPointerEnter={() => setHover(shape.id)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(shape.id)}
                onBlur={() => setHover(null)}
              />
            );
          })}
          {regionShapes
            .filter((s) => s.id !== "bishkek")
            .map((s) => (
              <text key={s.id} x={s.cx} y={s.cy} className={css.regionLabel} aria-hidden="true">
                {s.name.replace(" область", "")}
              </text>
            ))}
          {cityPoints.map((c) => (
            <g key={c.name} aria-hidden="true">
              <circle cx={c.x} cy={c.y} r={5} className={css.city} />
              <text x={c.x + 9} y={c.y - 8} className={css.cityLabel}>
                {c.name}
              </text>
            </g>
          ))}
        </svg>
        {tip && tipShape ? (
          <p className={css.tip} style={{ left: `${(tipShape.cx / mapWidth) * 100}%`, top: `${(tipShape.cy / mapHeight) * 100}%` }} aria-hidden="true">
            <b>{tip.name}</b>
            {nf.format(tip.issuers.length)} {plural(tip.issuers.length, "эмитент", "эмитента", "эмитентов")}
          </p>
        ) : null}
        <div className={css.legend} aria-hidden="true">
          <span>меньше</span>
          <i />
          <span>больше эмитентов</span>
        </div>
      </div>

      <ul className={css.regionList} aria-label="Области">
        {[...regions]
          .sort((a, b) => b.issuers.length - a.issuers.length)
          .map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => choose(r.id)} aria-pressed={r.id === selected}>
                <span>{r.name}</span>
                <span className={css.bar}>
                  <i style={{ width: `${(r.issuers.length / max) * 100}%` }} />
                </span>
                <b>{nf.format(r.issuers.length)}</b>
              </button>
            </li>
          ))}
        {unknown ? <li className={css.unknown}>Адрес не указан или не распознан: {nf.format(unknown)}</li> : null}
      </ul>

      <section className={css.panel} aria-live="polite" aria-labelledby="k-region">
        <p className={css.panelKicker}>Выбранная область</p>
        <h2 id="k-region">{current?.name}</h2>
        <p className={css.panelStat}>
          <b>{nf.format(current?.issuers.length ?? 0)}</b> {plural(current?.issuers.length ?? 0, "эмитент", "эмитента", "эмитентов")} ·{" "}
          {total ? Math.round(((current?.issuers.length ?? 0) / total) * 100) : 0}% от всех
        </p>
        {current?.activities.length ? (
          <ul className={css.activities} aria-label="Чем занимаются">
            {current.activities.map(([name, count]) => (
              <li key={name}>
                {name} <span>{count}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {current && current.issuers.length > 6 ? (
          <>
            <label htmlFor="k-filter" className={css.srOnly}>
              Найти компанию в области
            </label>
            <input id="k-filter" className={css.filter} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Найти компанию или вид деятельности" />
          </>
        ) : null}
        {shown.length ? (
          <ul className={css.issuers}>
            {shown.map((i) => (
              <li key={i.slug}>
                <Link href={`/disclosure/${i.slug}`}>
                  <b>{i.name}</b>
                  {i.activity ? <small>{i.activity}</small> : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={css.empty}>{query ? "Ничего не нашлось" : "В этой области эмитентов с распознанным адресом нет"}</p>
        )}
        {list.length > 12 ? (
          <button type="button" className={css.showAll} onClick={() => setAll((v) => !v)}>
            {all ? "Свернуть" : `Показать все ${nf.format(list.length)}`}
          </button>
        ) : null}
      </section>
    </div>
  );
}
