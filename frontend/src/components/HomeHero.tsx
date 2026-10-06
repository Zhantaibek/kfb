"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { formatChange, formatSom } from "@/data/catalog";
import { useTr } from "@/lib/use-tr";
import styles from "./HomeHero.module.css";

type Props = {
  index: { value: number; change: number; capitalization: number };
  volume: { value: number; change: number; trades: number };
  listing: { total: number };
};

// Абстрактный фон баннера: тонкие концентрические кольца и «стеклянные» сферы.
// Цветовые пятна под ними — отдельные элементы .blob в CSS.
const RINGS = [140, 220, 300, 380, 460, 540];

// Шарики вращаются по кольцам вокруг общего центра (1220, 380): на каждом своя скорость и направление.
const ORBS = [
  { cx: 1070, cy: 120, r: 78, duration: 75, reverse: false },
  { cx: 891, cy: 570, r: 46, duration: 105, reverse: true },
  { cx: 1410, cy: 270, r: 20, duration: 45, reverse: false },
];

function HeroScene() {
  return (
    <svg className={styles.scene} viewBox="0 0 1600 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="hero-orb" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="var(--orb-hi)" />
          <stop offset="1" stopColor="var(--orb-lo)" />
        </radialGradient>
      </defs>
      <g className={styles.rings}>
        {RINGS.map((r, i) => (
          <circle
            key={r}
            cx="1220"
            cy="380"
            r={r}
            strokeDasharray={i === 2 ? "2 10" : undefined}
            style={{ animationDelay: `${0.15 + i * 0.12}s` }}
          />
        ))}
      </g>
      {ORBS.map((orb) => (
        <g
          key={orb.r}
          className={styles.orbit}
          style={{ animationDuration: `${orb.duration}s`, animationDirection: orb.reverse ? "reverse" : "normal" }}
        >
          {/* Обратный поворот вокруг своего центра, чтобы блик на шарике оставался сверху слева. */}
          <circle
            className={styles.orb}
            cx={orb.cx}
            cy={orb.cy}
            r={orb.r}
            fill="url(#hero-orb)"
            style={{ animationDuration: `${orb.duration}s`, animationDirection: orb.reverse ? "normal" : "reverse" }}
          />
        </g>
      ))}
    </svg>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export function HomeHero({ index, volume, listing }: Props) {
  const tr = useTr();
  const photoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const photo = photoRef.current;
    if (!photo || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      photo.style.setProperty("--hero-shift", `${(Math.min(window.scrollY, 800) * 0.12).toFixed(1)}px`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const tone = (value: number) => (value < 0 ? styles.down : value > 0 ? styles.up : undefined);
  const figure = index.value.toLocaleString("ru-KG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <section className={styles.hero} aria-label={tr("Главный баннер")}>
      <div className={styles.photo} aria-hidden="true" ref={photoRef}>
        <span className={`${styles.blob} ${styles.blobA}`} />
        <span className={`${styles.blob} ${styles.blobB}`} />
        <span className={`${styles.blob} ${styles.blobC}`} />
        <HeroScene />
      </div>

      <div className={styles.main}>
        <div className={styles.copy}>
          <h1>{tr("Инвестиции в стабильное будущее")}</h1>
          <p>
            {tr(
              "Кыргызская фондовая биржа — это прозрачный и надежный механизм для привлечения капитала, развития бизнеса и роста экономики страны.",
            )}
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/market">
              {tr("Торговать")}
              <Arrow />
            </Link>
            <Link className={styles.link} href="/about">
              {tr("Подробнее")}
              <Arrow />
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.stats}>
        <Link className={styles.stat} href="/market/index">
          <span className={styles.label}>{tr("Индекс KSE")}</span>
          <span className={styles.value}>
            <b>{figure}</b>
            <em className={tone(index.change)}>{formatChange(index.change)}</em>
          </span>
        </Link>
        <Link className={styles.stat} href="/market/index">
          <span className={styles.label}>{tr("Капитализация")}</span>
          <span className={styles.value}>
            <b>{formatSom(index.capitalization)}</b>
            <small>{tr("млрд сом")}</small>
          </span>
        </Link>
        <Link className={styles.stat} href="/market">
          <span className={styles.label}>{tr("Объём торгов")}</span>
          <span className={styles.value}>
            <b>{formatSom(volume.value)}</b>
            <small>{tr("млн сом")}</small>
            <em className={tone(volume.change)}>{formatChange(volume.change)}</em>
          </span>
        </Link>
        <Link className={styles.stat} href="/market/quotes">
          <span className={styles.label}>{tr("Инструменты")}</span>
          <span className={styles.value}>
            <b>{listing.total}</b>
            <small>
              {volume.trades} {tr("сделок")}
            </small>
          </span>
        </Link>
      </div>
    </section>
  );
}
