"use client";

import Link from "next/link";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import css from "./prosto.module.css";

/** Полоса объявления над шапкой; крестик убирает её до перезагрузки. */
export function Announce({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className={css.announce} role="region" aria-label="Объявление">
      <p>{children}</p>
      <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть объявление">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}

export type Product = { word: string; href: string; title: string; text: string; tone: string };

/**
 * Крупный список разделов антиквой. При наведении остальные слова гаснут,
 * а рядом с курсором появляется карточка раздела с коротким описанием.
 */
export function ProductList({ items }: { items: Product[] }) {
  const [active, setActive] = useState(-1);
  const card = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);

  const move = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || !card.current || !box.current) return;
    const r = box.current.getBoundingClientRect();
    card.current.style.translate = `${event.clientX - r.left + 28}px ${event.clientY - r.top - 60}px`;
  };

  return (
    <div ref={box} className={css.products} data-active={active >= 0 ? "" : undefined} onPointerMove={move} onPointerLeave={() => setActive(-1)}>
      <ul data-stagger>
        {items.map((item, i) => (
          <li key={item.word}>
            <Link
              href={item.href}
              aria-current={active === i ? "true" : undefined}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(-1)}
            >
              <span>{item.word}</span>
              <span className={css.srOnly}>
                {" "}
                — {item.title}. {item.text}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div ref={card} className={css.hoverCard} aria-hidden="true" data-on={active >= 0 ? "" : undefined}>
        {items.map((item, i) => (
          <div key={item.word} data-on={active === i ? "" : undefined} style={{ background: item.tone }}>
            <b>{item.title}</b>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Кнопка паузы в углу: останавливает все анимации страницы (ленту, мазки, монеты). */
export function PauseButton() {
  const [paused, setPaused] = useState(false);
  const toggle = () => {
    const next = !paused;
    setPaused(next);
    document.querySelector<HTMLElement>(`.${css.page}`)?.toggleAttribute("data-paused", next);
  };
  return (
    <button type="button" className={css.pause} onClick={toggle} aria-pressed={paused} aria-label={paused ? "Продолжить анимацию" : "Остановить анимацию"}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {paused ? <path d="M8 5v14l11-7z" fill="currentColor" stroke="none" /> : <path d="M9 6v12M15 6v12" />}
      </svg>
    </button>
  );
}
