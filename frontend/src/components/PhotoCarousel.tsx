"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./PhotoCarousel.module.css";

const slides = [
  {
    src: "/carousel/trading.jpg",
    title: "Торги КФБ",
    text: "Котировки и индекс KSE — в ходе сессии.",
    href: "/market",
    alt: "Графики торгов на мониторах",
  },
  {
    src: "/carousel/city.jpg",
    title: "Рынок капитала",
    text: "Инфраструктура доверия для экономики Кыргызстана.",
    href: "/about",
    alt: "Деловой городской пейзаж",
  },
  {
    src: "/carousel/mountains.jpg",
    title: "Инвестируйте в ГЦБ",
    text: "Казначейские векселя и облигации Минфина КР.",
    href: "/gcb",
    alt: "Горный пейзаж Кыргызстана",
  },
];

export function PhotoCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const last = slides.length - 1;

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current === last ? 0 : current + 1));
    }, 7000);
    return () => window.clearInterval(timer);
  }, [paused, last]);

  const slide = slides[index];

  return (
    <section
      className={styles.wrap}
      aria-label="Промо КФБ"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={styles.stage}>
        {slides.map((item, i) => (
          <div key={item.src} className={styles.slide} data-active={i === index}>
            <Image src={item.src} alt={item.alt} fill sizes="(max-width: 1200px) 100vw, 1200px" priority={i === 0} />
          </div>
        ))}
        <div className={styles.copy}>
          <h2>{slide.title}</h2>
          <p>{slide.text}</p>
          <Link href={slide.href}>Узнать больше</Link>
        </div>
      </div>
    </section>
  );
}
