"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import css from "./kapital.module.css";

export type Story = { chip: string; text: string; href: string; photo: string };

/**
 * Карусель больших фото-карточек со скролл-снапом и полосками под ней: активна та карточка,
 * что ближе всего к центру. Полоски — кнопки: прокручивают к своей карточке.
 */
export function Stories({ items }: { items: Story[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const update = () => {
      const center = list.getBoundingClientRect().left + list.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      [...list.children].forEach((child, i) => {
        const box = child.getBoundingClientRect();
        const dist = Math.abs(box.left + box.width / 2 - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
    };
    update();
    list.addEventListener("scroll", update, { passive: true });
    return () => list.removeEventListener("scroll", update);
  }, []);

  const go = (i: number) => {
    const child = listRef.current?.children[i] as HTMLElement | undefined;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    child?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest", inline: "center" });
  };

  return (
    <>
      <ul ref={listRef} className={css.stories}>
        {items.map((a) => (
          <li key={a.chip}>
            <Link href={a.href}>
              <Image src={a.photo} alt="" fill sizes="(max-width: 767px) 90vw, 700px" />
              <span className={css.chip}>{a.chip}</span>
              <span className={css.storyText}>{a.text}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className={css.storyBars}>
        {items.map((a, i) => (
          <button key={a.chip} type="button" aria-label={`Показать: ${a.chip}`} aria-current={i === active || undefined} onClick={() => go(i)}>
            <i />
          </button>
        ))}
      </div>
    </>
  );
}
