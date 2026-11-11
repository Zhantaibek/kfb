"use client";

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import css from "./minimal.module.css";

/** Вкладки по WAI-ARIA: стрелки ←/→, Home/End переключают вкладку, Tab уходит в содержимое. */
export function Tabs({ tabs }: { tabs: { label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(0);
  const [ink, setInk] = useState<{
    x: number;
    width: number;
    height: number;
  } | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();

  // Плашка под активной вкладкой: меряем кнопку и пересчитываем при изменении размеров (шрифт, ширина окна).
  useLayoutEffect(() => {
    const button = refs.current[active];
    if (!button) return;
    const measure = () =>
      setInk({
        x: button.offsetLeft,
        width: button.offsetWidth,
        height: button.offsetHeight,
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(button);
    return () => observer.disconnect();
  }, [active]);

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const last = tabs.length - 1;
    const next =
      event.key === "ArrowRight"
        ? active === last
          ? 0
          : active + 1
        : event.key === "ArrowLeft"
          ? active === 0
            ? last
            : active - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  }

  return (
    <div className={css.tabs}>
      <div role="tablist" aria-label="Данные рынка" className={css.tabList} onKeyDown={onKey}>
        {ink ? (
          <span
            className={css.tabInk}
            aria-hidden="true"
            style={{
              translate: `${ink.x}px 0`,
              width: ink.width,
              height: ink.height,
            }}
          />
        ) : null}
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            ref={(node) => {
              refs.current[i] = node;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-controls={`${id}-panel-${i}`}
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={tab.label}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={i !== active}
          tabIndex={0}
          className={css.tabPanel}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
