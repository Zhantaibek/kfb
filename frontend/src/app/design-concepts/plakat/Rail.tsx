"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Горизонтальная лента со стрелками и счётчиком «01–03 из 08». Листать можно и жестом/колесом —
 * стрелки сдвигают ленту на ширину видимой части. На краях стрелка выключается.
 */
export function Rail({ label, count, css, children }: { label: string; count: number; css: Readonly<Record<string, string>>; children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const [range, setRange] = useState({ from: 1, to: Math.min(count, 3), start: true, end: count <= 3 });

  useEffect(() => {
    const list = ref.current;
    if (!list) return;
    const update = () => {
      const items = [...list.children] as HTMLElement[];
      const box = list.getBoundingClientRect();
      const visible = items.map((item, i) => ({ i, r: item.getBoundingClientRect() })).filter(({ r }) => r.left >= box.left - 4 && r.right <= box.right + 4);
      setRange({
        from: (visible[0]?.i ?? 0) + 1,
        to: (visible.at(-1)?.i ?? 0) + 1,
        start: list.scrollLeft <= 4,
        end: list.scrollLeft + list.clientWidth >= list.scrollWidth - 4,
      });
    };
    update();
    list.addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    return () => {
      list.removeEventListener("scroll", update);
      removeEventListener("resize", update);
    };
  }, []);

  const move = (dir: 1 | -1) => {
    const list = ref.current;
    if (!list) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollBy({ left: dir * list.clientWidth * 0.9, behavior: reduce ? "auto" : "smooth" });
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className={css.railWrap}>
      <ul ref={ref} className={css.rail} aria-label={label}>
        {children}
      </ul>
      <div className={css.railBar}>
        <p className={css.railCount} aria-live="polite">
          {pad(range.from)}–{pad(range.to)} <span>из {pad(count)}</span>
        </p>
        <div className={css.railButtons}>
          <button type="button" onClick={() => move(-1)} disabled={range.start} aria-label="Предыдущие новости">
            ←
          </button>
          <button type="button" onClick={() => move(1)} disabled={range.end} aria-label="Следующие новости">
            →
          </button>
        </div>
      </div>
    </div>
  );
}
