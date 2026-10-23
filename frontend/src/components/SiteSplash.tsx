"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import styles from "./SiteSplash.module.css";

const WORD = "Kyrgyz Stock Exchange";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
/** Ключ в sessionStorage; его же читает скрипт темы в app/layout.tsx, чтобы скрыть заставку до отрисовки. */
const SEEN_KEY = "kse-splash";

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function SiteSplash() {
  const [phase, setPhase] = useState<"show" | "hide" | "gone">("show");
  // Кто просил меньше анимаций — заставку не показываем вовсе.
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );

  useEffect(() => {
    if (reducedMotion) return;
    // Заставка — только при первом заходе за сеанс браузера; дальше сразу убираем её из DOM,
    // чтобы анимации страницы, которые ждут окончания заставки, стартовали без задержки.
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {}
    if (seen) {
      const gone = window.setTimeout(() => setPhase("gone"), 0);
      return () => window.clearTimeout(gone);
    }
    const hide = window.setTimeout(() => setPhase("hide"), 1700);
    const gone = window.setTimeout(() => setPhase("gone"), 2300);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(gone);
    };
  }, [reducedMotion]);

  if (reducedMotion || phase === "gone") return null;

  return (
    // data-site-splash читают другие блоки (баннер на главной), чтобы начать анимацию после заставки.
    <div className={styles.splash} data-phase={phase} data-site-splash={phase} aria-hidden="true">
      <span className={`${styles.orb} ${styles.orbA}`} />
      <span className={`${styles.orb} ${styles.orbB}`} />
      <div className={styles.inner}>
        <img className={styles.mark} src="/brand/kse-mark.png" alt="" />
        <p className={styles.word} data-text={WORD}>
          {WORD.split("").map((letter, i) => (
            <span key={`${letter}-${i}`} style={{ animationDelay: `${(0.25 + i * 0.022).toFixed(3)}s` }}>
              {letter === " " ? " " : letter}
            </span>
          ))}
        </p>
        <span className={styles.rule} />
      </div>
    </div>
  );
}
