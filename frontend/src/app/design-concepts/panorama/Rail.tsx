"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Classes = Readonly<Record<string, string>>;

/**
 * Горизонтальная лента панелей для «Панорамы»: на широком экране колесо мыши листает панели вбок
 * (если панель сама не прокручивается по вертикали), внизу — главы и полоса прогресса.
 * На узком экране (< 1100px) лента становится обычной вертикальной страницей — это делает CSS.
 */
export function Rail({ chapters, css, children }: { chapters: string[]; css: Classes; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const wide = window.matchMedia("(min-width: 1100px)");

    function onWheel(event: WheelEvent) {
      if (!wide.matches || !el || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      // Внутренняя вертикальная прокрутка панели имеет приоритет.
      let node = event.target as HTMLElement | null;
      while (node && node !== el) {
        const canScroll = node.scrollHeight > node.clientHeight + 1 && getComputedStyle(node).overflowY !== "visible";
        if (canScroll) {
          const atTop = node.scrollTop <= 0;
          const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
          if ((event.deltaY > 0 && !atBottom) || (event.deltaY < 0 && !atTop)) return;
        }
        node = node.parentElement;
      }
      event.preventDefault();
      el.scrollBy({ left: event.deltaY * 1.2 });
    }

    function onScroll() {
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
      const panels = [...el.children] as HTMLElement[];
      const mid = el.scrollLeft + el.clientWidth / 3;
      let index = 0;
      panels.forEach((panel, i) => {
        if (panel.offsetLeft <= mid) index = i;
      });
      setActive(index);
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

  function go(index: number) {
    const el = ref.current;
    const panel = el?.children[index] as HTMLElement | undefined;
    if (!el || !panel) return;
    if (window.matchMedia("(min-width: 1100px)").matches) el.scrollTo({ left: panel.offsetLeft, behavior: "smooth" });
    else panel.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <div ref={ref} className={css.rail} tabIndex={0} role="region" aria-label="Разделы главной, прокрутка по горизонтали">
        {children}
      </div>
      <nav className={css.chapters} aria-label="Главы">
        <button type="button" className={css.arrow} onClick={() => go(Math.max(0, active - 1))} aria-label="Предыдущая глава">
          ←
        </button>
        <ol>
          {chapters.map((title, i) => (
            <li key={title}>
              <button type="button" onClick={() => go(i)} aria-current={i === active ? "step" : undefined}>
                <small>{String(i + 1).padStart(2, "0")}</small> {title}
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className={css.arrow} onClick={() => go(Math.min(chapters.length - 1, active + 1))} aria-label="Следующая глава">
          →
        </button>
        <span className={css.progress} aria-hidden="true">
          <i style={{ transform: `scaleX(${progress})` }} />
        </span>
      </nav>
    </>
  );
}
