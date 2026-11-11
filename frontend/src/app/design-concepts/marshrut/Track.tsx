"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import css from "./marshrut.module.css";

/** Горизонтальный проезд включён только на широком экране и без «уменьшить движение»; иначе станции идут столбиком. */
const RIDE = "(min-width: 900px) and (prefers-reduced-motion: no-preference)";

/**
 * Лента станций: вертикальная прокрутка страницы двигает ленту по горизонтали (sticky-окно внутри высокой обёртки).
 * Внизу — схема линии: активная станция подсвечена, клик по станции доезжает до неё.
 */
export function Track({ stations, children }: { stations: { id: string; name: string }[]; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const last = stations.length - 1;

  useEffect(() => {
    const media = window.matchMedia(RIDE);
    let frame = 0;

    const update = () => {
      frame = 0;
      const box = outer.current;
      const strip = track.current;
      if (!box || !strip) return;
      if (!media.matches) {
        strip.style.transform = "";
        return;
      }
      const run = box.offsetHeight - window.innerHeight;
      const progress = run > 0 ? Math.min(1, Math.max(0, -box.getBoundingClientRect().top / run)) : 0;
      strip.style.transform = `translate3d(${-(strip.scrollWidth - window.innerWidth) * progress}px, 0, 0)`;
      setActive(Math.round(progress * last));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    media.addEventListener("change", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", schedule);
    };
  }, [last]);

  const goTo = (i: number) => {
    const box = outer.current;
    if (!box) return;
    if (!window.matchMedia(RIDE).matches) {
      document.getElementById(stations[i].id)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const run = box.offsetHeight - window.innerHeight;
    window.scrollTo({ top: box.offsetTop + (run * i) / last, behavior: "smooth" });
  };

  return (
    <div ref={outer} className={css.outer} style={{ "--n": stations.length } as CSSProperties}>
      <div className={css.window}>
        <div ref={track} className={css.track}>
          {children}
        </div>
        <nav className={css.rail} aria-label="Станции страницы">
          <ol style={{ "--p": last ? active / last : 0 } as CSSProperties}>
            {stations.map((station, i) => (
              <li key={station.id}>
                <button type="button" aria-current={i === active ? "step" : undefined} data-passed={i < active || undefined} onClick={() => goTo(i)}>
                  <i aria-hidden="true" />
                  <span>{station.name}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
}
