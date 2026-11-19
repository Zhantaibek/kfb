"use client";

import { useId, useState, type ReactNode } from "react";
import css from "./kapital.module.css";

export type ShowcaseItem = { title: string; text: string; panel?: ReactNode };

/**
 * Список-аккордеон с линейками: открыт один пункт (точка слева, описание под заголовком).
 * Если у пунктов есть panel — рядом показывается панель открытого пункта (тёмное «окно продукта»),
 * иначе — общий visual. Пункты переключаются сами: под открытым идёт полоса прогресса, по её окончании
 * (animationend) открывается следующий. Наведение ставит паузу, выбор пункта вручную выключает автопереключение.
 * При prefers-reduced-motion полоса не анимируется — значит, и автопереключения нет.
 */
export function Showcase({ items, side = "right", visual, intro }: { items: ShowcaseItem[]; side?: "left" | "right"; visual?: ReactNode; intro?: ReactNode }) {
  const [open, setOpen] = useState(0);
  const [auto, setAuto] = useState(true);
  const id = useId();
  const panel = items[open]?.panel ?? visual;

  return (
    <div className={css.showcase} data-side={side}>
      <div className={css.showLeft}>
        {intro}
        <ul className={css.accordion}>
          {items.map((item, i) => (
            <li key={item.title} data-open={i === open || undefined}>
              <button
                type="button"
                aria-expanded={i === open}
                aria-controls={`${id}-${i}`}
                onClick={() => {
                  setOpen(i);
                  setAuto(false);
                }}
              >
                {item.title}
              </button>
              <p id={`${id}-${i}`} hidden={i !== open}>
                {item.text}
              </p>
              {auto && i === open ? <span className={css.progress} aria-hidden="true" onAnimationEnd={() => setOpen((n) => (n + 1) % items.length)} /> : null}
            </li>
          ))}
        </ul>
      </div>
      {panel ? (
        <div className={css.showPanel} aria-live="polite">
          {/* key — чтобы при смене пункта панель появлялась заново с анимацией. */}
          <div key={items[open]?.panel ? open : "visual"} className={css.swap}>
            {panel}
          </div>
        </div>
      ) : null}
    </div>
  );
}
