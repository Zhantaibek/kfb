"use client";

import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  const value = document.documentElement.getAttribute("data-theme");
  return value === "dark" ? "dark" : "light";
}

/** Тема — атрибут data-theme на <html> (его ставит скрипт в layout ещё до гидратации). */
function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const SYSTEM_DARK = "(prefers-color-scheme: dark)";

function systemTheme(): Theme {
  return window.matchMedia(SYSTEM_DARK).matches ? "dark" : "light";
}

function storedTheme() {
  try {
    return localStorage.getItem("kse-theme");
  } catch {
    return null;
  }
}

/**
 * По умолчанию сайт следует теме системы. Ручной выбор запоминается;
 * если пользователь вернул тему, совпадающую с системной, — снова следуем системе.
 */
function applyTheme(next: Theme) {
  document.documentElement.setAttribute("data-theme", next);
  try {
    if (next === systemTheme()) localStorage.removeItem("kse-theme");
    else localStorage.setItem("kse-theme", next);
  } catch {
    // Хранилище недоступно (приватный режим) — тема просто не запомнится.
  }
}

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(subscribeTheme, currentTheme, () => "dark");

  // Пока пользователь не выбрал тему сам, сайт меняет её вместе с системой.
  useEffect(() => {
    const media = window.matchMedia(SYSTEM_DARK);
    const onChange = () => {
      if (!storedTheme()) document.documentElement.setAttribute("data-theme", systemTheme());
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";

    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.classList.add("theme-switching");
    window.setTimeout(() => root.classList.remove("theme-switching"), 600);

    const start = document.startViewTransition?.bind(document);
    if (!reduce && start) {
      start(() => applyTheme(next));
      return;
    }

    applyTheme(next);
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
    >
      <span className="theme-toggle-icons" data-mode={theme}>
        <svg className="theme-icon-sun" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 3.2v1.8M12 19v1.8M4.9 4.9l1.3 1.3M17.8 17.8l1.3 1.3M3.2 12h1.8M19 12h1.8M4.9 19.1l1.3-1.3M17.8 6.2l1.3-1.3" />
        </svg>
        <svg className="theme-icon-moon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15.2 4.4A8.2 8.2 0 1 0 19.6 15 6.4 6.4 0 0 1 15.2 4.4Z" />
        </svg>
      </span>
    </button>
  );
}
