"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { IndexChart } from "../_shared/IndexChart";
import css from "./obzor.module.css";

/* ——— Первый экран: «гармошка» из 4 слайдов главной. Все видны сразу, активный раскрыт ——— */

export type Slide = {
  title: string;
  text: string;
  photo: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
};

const SLIDE_MS = 7000;

export function SlideDeck({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setActive((i) => (i + 1) % count), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [active, paused, count]);

  return (
    <section
      className={css.deck}
      aria-roledescription="карусель"
      aria-label="Главный баннер"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((slide, i) => {
        const on = i === active;
        return (
          <article key={slide.title} className={css.panelSlide} data-on={on ? "" : undefined} aria-roledescription="слайд" aria-label={`${i + 1} из ${count}: ${slide.title}`}>
            <Image src={slide.photo} alt="" fill priority={i === 0} sizes="(max-width: 1100px) 100vw, 60vw" className={css.deckImg} />
            <button type="button" className={css.deckTab} onClick={() => setActive(i)} aria-expanded={on} aria-label={`Открыть слайд ${i + 1}: ${slide.title}`}>
              <b>{String(i + 1).padStart(2, "0")}</b>
              <span>{slide.title}</span>
            </button>
            <div className={css.deckBody} inert={!on}>
              <small>
                {String(i + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </small>
              {i === 0 ? <h1>{slide.title}</h1> : <h2>{slide.title}</h2>}
              <p>{slide.text}</p>
              <div className={css.deckBtns}>
                <Link href={slide.primary.href} className={css.btnLight}>
                  {slide.primary.label}
                </Link>
                <Link href={slide.secondary.href} className={css.btnGhost}>
                  {slide.secondary.label} →
                </Link>
              </div>
              <i className={css.deckBar} aria-hidden="true">
                {on ? <b key={active} data-paused={paused ? "" : undefined} style={{ animationDuration: `${SLIDE_MS}ms` }} /> : null}
              </i>
            </div>
          </article>
        );
      })}
    </section>
  );
}

/* ——— График индекса: «Индекс / Капитализация» и периоды ——— */

type Point = { date: string; value: number; cap: number };

const periods = [
  { id: "1w", label: "1Н", take: 6 },
  { id: "1m", label: "1М", take: 23 },
  { id: "all", label: "Всё", take: Infinity },
] as const;

const fmt = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function MarketChart({ series, change }: { series: Point[]; change: string }) {
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

/* ——— Тема страницы ——— */

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.getElementById("obzor-root")?.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <button type="button" className={css.tool} onClick={() => setDark((v) => !v)} aria-pressed={dark} aria-label="Тёмная тема">
      {dark ? "☾" : "☀"}
    </button>
  );
}

/* ——— Боковая панель на телефоне раскрывается кнопкой ——— */

export function SideToggle({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={`${css.tool} ${css.sideBurger}`} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="obzor-side" aria-label="Меню">
        {open ? "✕" : "☰"}
      </button>
      <div id="obzor-side" className={css.sideBody} data-open={open ? "" : undefined}>
        {children}
      </div>
    </>
  );
}
