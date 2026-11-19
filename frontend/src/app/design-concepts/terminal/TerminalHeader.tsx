"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Шапка концепции «Терминал»: прилипает к верху и меняет тему — тёмная над чёрными блоками,
 * белая, как только под неё заезжает светлая часть страницы (элемент с id="tm-light").
 */
export function TerminalHeader({ className, children }: { className: string; children: ReactNode }) {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const target = document.getElementById("tm-light");
    if (!target) return;
    const update = () => setLight(target.getBoundingClientRect().top <= 40);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <header className={className} data-light={light || undefined}>
      {children}
    </header>
  );
}
