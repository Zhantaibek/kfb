"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import css from "./siniy.module.css";

/* ——— Слайдер первого экрана ——— */

export type Slide = {
  title: string;
  text: string;
  href: string;
  cta: string;
  photo: string;
  alt: string;
  chip?: { label: string; value: string; delta?: string; up?: boolean };
};

const SLIDE_MS = 6500;

function ArrowIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {dir === "left" ? <path d="M19 12H5m6-6-6 6 6 6" /> : <path d="M5 12h14m-6-6 6 6-6 6" />}
    </svg>
  );
}

function Chevron({ open }: { open?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" data-open={open ? "" : undefined}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setActive((i) => (i + 1) % count), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [active, paused, count]);

  const go = (step: number) => setActive((i) => (i + step + count) % count);

  return (
    <section
      className={css.hero}
      aria-roledescription="карусель"
      aria-label="Главное на бирже"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className={css.heroMark} aria-hidden="true">
        <i />
        <i />
      </span>
      {slides.map((slide, i) => (
        <div
          key={slide.title}
          className={css.slide}
          data-on={i === active ? "" : undefined}
          role="group"
          aria-roledescription="слайд"
          aria-label={`${i + 1} из ${count}`}
          inert={i !== active}
        >
          <div className={`${css.wrap} ${css.slideIn}`}>
            <div className={css.slideText}>
              <h2>{slide.title}</h2>
              <p>{slide.text}</p>
              <Link href={slide.href} className={css.btnWhite}>
                {slide.cta}
              </Link>
            </div>
            <div className={css.slideArt}>
              <span className={css.slidePhoto}>
                <Image src={slide.photo} alt={slide.alt} fill sizes="(max-width: 900px) 100vw, 44vw" priority={i === 0} />
              </span>
              {slide.chip ? (
                <span className={css.chip}>
                  <small>{slide.chip.label}</small>
                  <b>{slide.chip.value}</b>
                  {slide.chip.delta ? <em data-up={slide.chip.up ? "" : undefined}>{slide.chip.delta}</em> : null}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ))}
      <button type="button" className={`${css.heroArrow} ${css.heroPrev}`} onClick={() => go(-1)} aria-label="Предыдущий слайд">
        <ArrowIcon dir="left" />
      </button>
      <button type="button" className={`${css.heroArrow} ${css.heroNext}`} onClick={() => go(1)} aria-label="Следующий слайд">
        <ArrowIcon dir="right" />
      </button>
      <div className={css.dashes}>
        {slides.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            aria-label={`Слайд ${i + 1}: ${slide.title}`}
            aria-current={i === active ? "true" : undefined}
            onClick={() => setActive(i)}
            data-paused={paused ? "" : undefined}
          >
            {/* key пересоздаёт полоску, чтобы заполнение начиналось заново на каждом слайде. */}
            {i === active ? <i key={active} style={{ animationDuration: `${SLIDE_MS}ms` }} /> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ——— Витрина: вкладки-«таблетки» и карусель из трёх карточек ——— */

export type ShowCard = {
  title: string;
  text?: string;
  href: string;
  photo?: string;
  ticker?: string;
  price?: string;
  change?: string;
  up?: boolean;
};

export function Showcase({ groups }: { groups: { label: string; cards: ShowCard[] }[] }) {
  const [tab, setTab] = useState(0);
  const [index, setIndex] = useState(0);
  const id = useId();
  const cards = groups[tab]?.cards ?? [];
  const count = cards.length;

  const pick = (next: number) => {
    setTab(next);
    setIndex(0);
  };
  const go = (step: number) => setIndex((i) => (i + step + count) % count);

  /** Положение карточки относительно активной: -1 слева, 0 в центре, 1 справа, остальные спрятаны. */
  const pos = (i: number) => {
    let d = i - index;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return Math.abs(d) <= 1 ? String(d) : d < 0 ? "far-l" : "far-r";
  };

  return (
    <div className={css.show}>
      <div role="tablist" aria-label="Разделы витрины" className={css.pills}>
        {groups.map((group, i) => (
          <button key={group.label} type="button" role="tab" id={`${id}-t${i}`} aria-controls={`${id}-p`} aria-selected={i === tab} onClick={() => pick(i)}>
            {group.label}
          </button>
        ))}
      </div>
      <div className={css.stage} role="tabpanel" id={`${id}-p`} aria-labelledby={`${id}-t${tab}`}>
        <button type="button" className={`${css.squareBtn} ${css.stagePrev}`} onClick={() => go(-1)} aria-label="Предыдущая карточка">
          <ArrowIcon dir="left" />
        </button>
        <div className={css.track}>
          {cards.map((card, i) => {
            const p = pos(i);
            const center = p === "0";
            return (
              <Link
                key={`${tab}-${card.title}`}
                href={card.href}
                className={css.card}
                data-pos={p}
                data-kind={card.photo ? "photo" : "quote"}
                tabIndex={center ? 0 : -1}
                aria-hidden={center ? undefined : true}
                onClick={(event) => {
                  if (center) return;
                  event.preventDefault();
                  setIndex(i);
                }}
              >
                {card.photo ? (
                  <Image src={card.photo} alt="" fill sizes="(max-width: 900px) 90vw, 36vw" />
                ) : (
                  <span className={css.quoteFace}>
                    <span className={css.qTicker}>{card.ticker}</span>
                    <span className={css.qPrice}>{card.price}</span>
                    {card.change ? <em data-up={card.up ? "" : undefined}>{card.change}</em> : null}
                  </span>
                )}
                <span className={css.cardText}>
                  <b>{card.title}</b>
                  {card.text ? <small>{card.text}</small> : null}
                </span>
              </Link>
            );
          })}
        </div>
        <button type="button" className={`${css.squareBtn} ${css.stageNext}`} onClick={() => go(1)} aria-label="Следующая карточка">
          <ArrowIcon dir="right" />
        </button>
      </div>
    </div>
  );
}

/* ——— Котировки и калькулятор ——— */

export type Row = { ticker: string; name: string; price: number; change: number; href: string };

const fmt = (value: number, digits = 2) => new Intl.NumberFormat("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);

export function MarketDesk({ groups, date }: { groups: { label: string; rows: Row[] }[]; date: string }) {
  const all = groups.flatMap((g) => g.rows).filter((row, i, list) => list.findIndex((r) => r.ticker === row.ticker) === i);
  const [group, setGroup] = useState(0);
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState(all[0]?.ticker ?? "");
  const [amount, setAmount] = useState("100000");
  const [byMoney, setByMoney] = useState(true);
  const id = useId();

  const rows = groups[group]?.rows ?? [];
  const shown = open ? rows : rows.slice(0, 5);
  const paper = all.find((row) => row.ticker === ticker);
  const value = Number(amount.replace(/\s/g, "").replace(",", ".")) || 0;
  const pieces = paper ? Math.floor(value / paper.price) : 0;
  const result = !paper ? "—" : byMoney ? `${fmt(pieces, 0)} шт.` : `${fmt(value * paper.price)} сом`;
  const rest = paper && byMoney ? value - pieces * paper.price : 0;

  return (
    <div className={css.desk}>
      <div className={css.rates}>
        <h2>Котировки</h2>
        <label className={css.select}>
          <span className={css.sr}>Группа бумаг</span>
          <select
            value={group}
            onChange={(e) => {
              setGroup(Number(e.target.value));
              setOpen(false);
            }}
          >
            {groups.map((g, i) => (
              <option key={g.label} value={i}>
                {g.label}
              </option>
            ))}
          </select>
          <Chevron />
        </label>
        <table className={css.rateTable}>
          <thead>
            <tr>
              <th scope="col">
                <span className={css.sr}>Бумага</span>
              </th>
              <th scope="col">Цена, сом</th>
              <th scope="col">Изменение</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.ticker}>
                <th scope="row">
                  <Link href={row.href} title={row.name}>
                    <span className={css.badge} aria-hidden="true">
                      {row.ticker.slice(0, 2)}
                    </span>
                    <span>{row.ticker}</span>
                  </Link>
                </th>
                <td>{fmt(row.price)}</td>
                <td data-dir={row.change > 0 ? "up" : row.change < 0 ? "down" : undefined}>
                  <i aria-hidden="true" />
                  {`${row.change > 0 ? "+" : ""}${fmt(row.change)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 5 ? (
          <button type="button" className={css.more} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {open ? "Свернуть" : "Все котировки"}
            <Chevron open={open} />
          </button>
        ) : null}
      </div>

      <div className={css.calc}>
        <h2>Калькулятор</h2>
        <div className={css.fields}>
          <label className={css.field}>
            <span className={css.fieldLabel}>{byMoney ? "вкладываю, сом" : "покупаю, шт."}</span>
            <input id={`${id}-sum`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d\s.,]/g, ""))} />
            <b>{byMoney ? "KGS" : ticker}</b>
          </label>
          <button type="button" className={css.swap} onClick={() => setByMoney((v) => !v)} aria-label="Поменять направление расчёта">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 4v15m0-15L4 8m4-4 4 4M16 20V5m0 15-4-4m4 4 4-4" />
            </svg>
          </button>
          <div className={css.field}>
            <span className={css.fieldLabel}>{byMoney ? "получаю" : "стоимость"}</span>
            <output htmlFor={`${id}-sum`} aria-live="polite">
              {result}
            </output>
            <label className={css.fieldPick}>
              <span className={css.sr}>Бумага</span>
              <select value={ticker} onChange={(e) => setTicker(e.target.value)}>
                {all.map((row) => (
                  <option key={row.ticker} value={row.ticker}>
                    {row.ticker}
                  </option>
                ))}
              </select>
              <Chevron />
            </label>
          </div>
        </div>
        <ul className={css.notes}>
          <li>Цены указаны по итогам торгов {date}</li>
          <li>
            {paper ? `${paper.name}: ${fmt(paper.price)} сом за бумагу` : "Выберите бумагу"}
            {rest > 0.005 ? `, остаток ${fmt(rest)} сом` : ""}
          </li>
          <li>Расчёт без учёта комиссий брокера и биржи. Сделки заключаются через участников торгов</li>
        </ul>
      </div>
    </div>
  );
}
