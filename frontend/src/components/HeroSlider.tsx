"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTr } from "@/lib/use-tr";
import type { CmsI18n } from "@/lib/cms/types";
import styles from "./HeroSlider.module.css";

export type HeroSlide = {
  title: string;
  text: string;
  href: string;
  value: string;
  photo?: string;
  i18n?: CmsI18n;
};

export function HeroSlider({ slides, compact = false }: { slides: HeroSlide[]; compact?: boolean }) {
  const tr = useTr();
  const [index, setIndex] = useState(0);
  const list = slides.length ? slides : [];
  const last = Math.max(list.length - 1, 0);

  useEffect(() => {
    if (list.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current === last ? 0 : current + 1));
    }, 7000);
    return () => window.clearInterval(timer);
  }, [index, last, list.length]);

  function go(next: number) {
    if (!list.length) return;
    setIndex((next + list.length) % list.length);
  }

  const slide = list[index];
  if (!slide) return null;

  return (
    <section className={`${styles.hero} ${compact ? styles.compact : ""}`} aria-roledescription={tr("карусель")} aria-label={tr("Главный баннер")}>
      <div className={styles.visual} aria-hidden="true">
        {list.map((item, i) =>
          item.photo ? (
            <div className={styles.photoCard} data-active={i === index} key={item.photo + i}>
              <div className={styles.photoFrame} style={{ position: "relative" }}>
                <Image
                  src={item.photo}
                  alt=""
                  fill
                  sizes="100vw"
                  priority={i === 0}
                />
              </div>
            </div>
          ) : (
            <article className={styles.fallback} data-active={i === index} key={item.title + i}>
              <small>KSE</small>
              <strong>{item.value}</strong>
            </article>
          ),
        )}
      </div>
      <div className={styles.veil} />

      <button className={styles.arrow} type="button" aria-label={tr("Назад")} onClick={() => go(index - 1)}>
        ‹
      </button>
      <button className={`${styles.arrow} ${styles.right}`} type="button" aria-label={tr("Вперёд")} onClick={() => go(index + 1)}>
        ›
      </button>

      <div className={styles.stage}>
        <div className={styles.lead}>
          <p className={styles.kicker}>{tr("Кыргызская фондовая биржа")}</p>
          <Link className={styles.copy} href={slide.href} key={slide.title}>
            <h1>{tr(slide.title)}</h1>
            <span>{tr(slide.text)}</span>
            <em>{tr("Смотреть раздел")}</em>
          </Link>
        </div>
        {slide.value ? (
          <div className={styles.metric}>
            <small>{tr("Индикатор")}</small>
            <strong>{slide.value}</strong>
          </div>
        ) : null}
      </div>

      <div className={styles.dashes} role="tablist" aria-label={tr("Слайды")}>
        {list.map((item, i) => (
          <button
            key={item.title + i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={tr(item.title)}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </section>
  );
}
