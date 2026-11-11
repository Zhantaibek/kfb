"use client";

import { useRef, type ReactNode } from "react";
import css from "./set.module.css";

/** Горизонтальная лента карточек со стрелками «назад/вперёд» (сдвиг на ширину видимой части). */
export function Carousel({ label, children, head }: { label: string; children: ReactNode; head: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const move = (dir: 1 | -1) => {
    const list = ref.current;
    if (!list) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollBy({ left: dir * list.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  };
  return (
    <>
      <div className={css.carouselHead}>
        {head}
        <div className={css.arrows}>
          <button type="button" onClick={() => move(-1)} aria-label="Назад">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M10 3 5 8l5 5" />
            </svg>
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Вперёд">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="m6 3 5 5-5 5" />
            </svg>
          </button>
        </div>
      </div>
      <ul ref={ref} className={css.carousel} aria-label={label}>
        {children}
      </ul>
    </>
  );
}
