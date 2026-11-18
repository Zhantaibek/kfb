"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { IndexChart } from "../_shared/IndexChart";
import css from "./kanon.module.css";

/* ——— Слайдер первого экрана: 4 слайда главной, вкладки с номерами и полоской прогресса ——— */

export type Slide = {
  title: string;
  text: string;
  photo: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
};

const SLIDE_MS = 7000;

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
      aria-label="Главный баннер"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div key={slide.title} className={css.slide} data-on={i === active ? "" : undefined} role="group" aria-roledescription="слайд" aria-label={`${i + 1} из ${count}`} inert={i !== active}>
          <span className={css.slidePhoto}>
            <Image src={slide.photo} alt="" fill priority={i === 0} sizes="(max-width: 1100px) 100vw, 55vw" className={css.slideImg} />
          </span>
          <div className={`${css.wrap} ${css.slideText}`}>
            <p className={css.kicker}>Кыргызская фондовая биржа</p>
            {i === 0 ? <h1>{slide.title}</h1> : <h2>{slide.title}</h2>}
            <p className={css.slideLead}>{slide.text}</p>
            <div className={css.slideBtns}>
              <Link href={slide.primary.href} className={css.btn}>
                {slide.primary.label} →
              </Link>
              <Link href={slide.secondary.href} className={css.btnLine} target={slide.secondary.href.startsWith("http") ? "_blank" : undefined}>
                {slide.secondary.label} →
              </Link>
            </div>
          </div>
        </div>
      ))}
      <div className={`${css.wrap} ${css.slideNav}`}>
        <div className={css.slideTabs} role="group" aria-label="Слайды">
          {slides.map((slide, i) => (
            <button key={slide.title} type="button" onClick={() => setActive(i)} aria-current={i === active ? "true" : undefined} aria-label={`Слайд ${i + 1}: ${slide.title}`}>
              <small>{String(i + 1).padStart(2, "0")}</small>
              <span>{slide.title}</span>
              <i aria-hidden="true">{i === active ? <b key={active} data-paused={paused ? "" : undefined} style={{ animationDuration: `${SLIDE_MS}ms` }} /> : null}</i>
            </button>
          ))}
        </div>
        <div className={css.slideArrows}>
          <button type="button" onClick={() => go(-1)} aria-label="Предыдущий слайд">
            ←
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Следующий слайд">
            →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ——— График индекса: вкладки «Индекс / Капитализация» и периоды ——— */

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
        <div>
          <small>{mode === "index" ? "KSE Index" : "Капитализация, млрд сом"}</small>
          <b>{fmt.format(last)}</b>
          {mode === "index" ? <em>{change}</em> : null}
        </div>
        <div className={css.periods} role="group" aria-label="Период">
          {periods.map((p) => (
            <button key={p.id} type="button" aria-pressed={p.id === period} onClick={() => setPeriod(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className={css.modes} role="group" aria-label="Показатель">
        <button type="button" aria-pressed={mode === "index"} onClick={() => setMode("index")}>
          Индекс
        </button>
        <button type="button" aria-pressed={mode === "cap"} onClick={() => setMode("cap")}>
          Капитализация
        </button>
      </div>
      {points.length > 1 ? <IndexChart key={`${mode}-${period}`} points={points} css={css} /> : <p className={css.muted}>Нет данных за период</p>}
    </div>
  );
}

/* ——— Переключатель темы: светлая / тёмная для этой страницы ——— */

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.getElementById("kanon-root")?.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <button type="button" className={css.iconBtn} onClick={() => setDark((v) => !v)} aria-pressed={dark} aria-label="Тёмная тема">
      {dark ? "☾" : "☀"}
    </button>
  );
}

/* ——— Мобильное меню ——— */

export function Burger({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={css.iconBtn} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="kanon-menu" aria-label="Меню">
        {open ? "✕" : "☰"}
      </button>
      <div id="kanon-menu" className={css.drawer} hidden={!open}>
        {children}
      </div>
    </>
  );
}
