"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  /** Знаков после запятой. */
  digits?: number;
  /** Длительность счёта, мс. */
  duration?: number;
  className?: string;
};

const format = (value: number, digits: number) =>
  value.toLocaleString("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/**
 * Число, которое «досчитывается» от нуля, когда впервые появляется на экране (главная, рыночные показатели).
 * Сервер и первый кадр показывают итоговое значение — без мигания нулей и с правильным текстом для поисковиков;
 * при prefers-reduced-motion счёта нет.
 */
export function CountUp({ value, digits = 0, duration = 1400, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const node = ref.current;
    if (!node || !Number.isFinite(value) || value === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // easeOutCubic: быстро в начале, мягкая остановка на итоговом значении.
          setShown(value * (1 - Math.pow(1 - t, 3)));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        setShown(0);
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {format(shown, digits)}
    </span>
  );
}
