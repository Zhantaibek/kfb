"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import styles from "./SiteSplash.module.css";

const WORD = "Kyrgyz Stock Exchange";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const noop = () => () => {};

export function SiteSplash() {
  const [phase, setPhase] = useState<"show" | "hide" | "gone">("show");
  // Анимация стоит на паузе, пока страница не готова к показу: иначе буквы «доигрывали» ещё во время загрузки
  // стилей и шрифтов, и посетитель видел уже готовую надпись без анимации.
  const [playing, setPlaying] = useState(false);
  // Кто просил меньше анимаций — заставку не показываем вовсе.
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
  // Заставка — один раз за сессию браузера: атрибут ставит скрипт в layout.tsx до первой отрисовки.
  const seen = useSyncExternalStore(
    noop,
    () => document.documentElement.dataset.splash === "seen",
    () => false,
  );

  useEffect(() => {
    if (reducedMotion || seen) return;
    try {
      sessionStorage.setItem("kse-splash", "1");
    } catch {
      // Хранилище недоступно (приватный режим) — заставка просто покажется снова.
    }
    let hide = 0;
    let gone = 0;
    let frame = 0;
    let cancelled = false;
    // Запуск — когда загрузились шрифты (но не дольше 800 мс) и отрисован первый кадр; таймеры скрытия — от запуска.
    const fontsReady = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((resolve) => window.setTimeout(resolve, 800))]);
    void fontsReady.then(() => {
      if (cancelled) return;
      frame = window.requestAnimationFrame(() => {
        setPlaying(true);
        hide = window.setTimeout(() => setPhase("hide"), 2900);
        gone = window.setTimeout(() => setPhase("gone"), 3700);
      });
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(hide);
      window.clearTimeout(gone);
    };
  }, [reducedMotion, seen]);

  if (reducedMotion || seen || phase === "gone") return null;

  return (
    // data-site-splash читают другие блоки (баннер на главной), чтобы начать анимацию после заставки.
    <div className={styles.splash} data-phase={phase} data-site-splash={phase} data-play={playing || undefined} aria-hidden="true">
      <span className={`${styles.orb} ${styles.orbA}`} />
      <span className={`${styles.orb} ${styles.orbB}`} />
      <div className={styles.inner}>
        <Image className={styles.mark} src="/brand/kse-mark.png" alt="" width={160} height={152} loading="eager" />
        <p className={styles.word} data-text={WORD}>
          {WORD.split("").map((letter, i) => (
            <span key={`${letter}-${i}`} style={{ animationDelay: `${(0.35 + i * 0.03).toFixed(3)}s` }}>
              {letter === " " ? " " : letter}
            </span>
          ))}
        </p>
        <span className={styles.rule} />
      </div>
    </div>
  );
}
