"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import styles from "./SiteSplash.module.css";

const WORD = "Kyrgyz Stock Exchange";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

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
    const hide = window.setTimeout(() => setPhase("hide"), 2700);
    const gone = window.setTimeout(() => setPhase("gone"), 4300);
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
            <span key={`${letter}-${i}`} style={{ animationDelay: `${(0.45 + i * 0.035).toFixed(3)}s` }}>
              {letter === " " ? " " : letter}
            </span>
          ))}
        </p>
        <span className={styles.rule} />
      </div>
    </div>
  );
}
