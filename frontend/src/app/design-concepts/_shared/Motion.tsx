"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const reveals = "[data-reveal],[data-stagger],[data-draw],[data-grow],[data-count]";

function format(el: HTMLElement, value: number) {
  const digits = Number(el.dataset.digits ?? 0);
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: !("plain" in el.dataset),
  }).format(value);
}

/** Счётчик от нуля до значения из data-count: быстро в начале, плавно к концу. */
function countUp(el: HTMLElement) {
  const target = Number(el.dataset.count);
  const final = el.dataset.final ?? el.textContent;
  const start = performance.now();
  const duration = 1800;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = t < 1 ? format(el, target * eased) : final;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/**
 * Оживляет макет: ставит .kc-in элементам при появлении в окне, запускает счётчики, параллакс фото,
 * наклон карточек и подсветку под курсором. Стили — в motion.css. Перезапускается при смене страницы.
 */
export function MotionRoot() {
  const pathname = usePathname();

  useEffect(() => {
    const items = [...document.querySelectorAll<HTMLElement>(reveals)];
    for (const group of document.querySelectorAll<HTMLElement>("[data-stagger]")) {
      [...group.children].forEach((child, i) => (child as HTMLElement).style.setProperty("--kc-i", String(i)));
    }

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("kc-in"));
      return;
    }

    // Обрезанный clip-path элемент (шторка, прорисовка) наблюдатель считает невидимым — следим за его родителем.
    const proxies = new Map<Element, HTMLElement[]>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Высокий блок (каталог из 25 карточек) никогда не покажет 12% своей высоты в одном экране —
          // ему достаточно, чтобы в экран попала пятая часть окна.
          const tall = entry.boundingClientRect.height > innerHeight;
          const seen = entry.intersectionRatio >= 0.12 || (tall && entry.intersectionRect.height >= innerHeight * 0.2);
          if (!entry.isIntersecting || !seen) continue;
          // Родитель-прокси сам может быть анимируемым блоком (панель с графиком внутри) — тогда показываем и его.
          const proxied = proxies.get(entry.target) ?? [];
          const own = !proxied.length || entry.target.matches(reveals) ? [entry.target as HTMLElement] : [];
          const targets = [...proxied, ...own];
          for (const el of targets) {
            el.classList.add("kc-in");
            if (el.dataset.count && el.dataset.counting) countUp(el);
          }
          observer.unobserve(entry.target);
        }
      },
      // Мелкие пороги нужны высоким блокам: иначе наблюдатель не сообщит о них, пока не дойдёт до 12%.
      { rootMargin: "0px 0px -8% 0px", threshold: [0, 0.01, 0.05, 0.12] },
    );

    for (const el of items) {
      // Счётчик сбрасываем в ноль, только пока его не видно (ниже экрана или в ещё не появившемся блоке) — иначе цифры мигнут.
      const unseen = el.getBoundingClientRect().top > innerHeight || el.parentElement?.closest("[data-reveal],[data-stagger]");
      if (el.dataset.count && unseen) {
        el.dataset.counting = "1";
        // Исходный текст сохраняем один раз: эффект может перезапуститься, когда в элементе уже ноль.
        el.dataset.final ??= el.textContent ?? "";
        el.textContent = format(el, 0);
      }
      const clipped = (el.dataset.reveal === "mask" || "draw" in el.dataset) && el.parentElement;
      if (clipped) {
        proxies.set(clipped, [...(proxies.get(clipped) ?? []), el]);
        observer.observe(clipped);
      } else {
        observer.observe(el);
      }
    }

    // Параллакс: фото сдвигается медленнее страницы, пока его блок на экране; в центре окна сдвиг нулевой.
    const layers = [...document.querySelectorAll<HTMLElement>("[data-parallax]")];
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        for (const layer of layers) {
          const box = (layer.parentElement ?? layer).getBoundingClientRect();
          if (box.bottom < 0 || box.top > innerHeight) continue;
          const shift = (innerHeight / 2 - (box.top + box.height / 2)) * Number(layer.dataset.parallax);
          layer.style.translate = `0 ${shift.toFixed(1)}px`;
        }
      });
    };
    if (layers.length) {
      onScroll();
      addEventListener("scroll", onScroll, { passive: true });
    }

    // Наклон карточки и подсветка под курсором — только для мыши.
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !(event.target instanceof Element)) return;
      const tilt = event.target.closest<HTMLElement>("[data-tilt]");
      if (tilt) {
        const box = tilt.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - 0.5;
        const y = (event.clientY - box.top) / box.height - 0.5;
        tilt.style.setProperty("--kc-ry", `${(x * 8).toFixed(2)}deg`);
        tilt.style.setProperty("--kc-rx", `${(-y * 8).toFixed(2)}deg`);
      }
      const spot = event.target.closest<HTMLElement>("[data-spotlight]");
      if (spot) {
        const box = spot.getBoundingClientRect();
        spot.style.setProperty("--kc-mx", `${event.clientX - box.left}px`);
        spot.style.setProperty("--kc-my", `${event.clientY - box.top}px`);
      }
    };
    const onLeave = (event: PointerEvent) => {
      const tilt = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-tilt]") : null;
      // pointerout срабатывает и при переходе на дочерний элемент — сбрасываем наклон, только когда курсор ушёл с карточки.
      if (!tilt || (event.relatedTarget instanceof Node && tilt.contains(event.relatedTarget))) return;
      tilt.style.removeProperty("--kc-rx");
      tilt.style.removeProperty("--kc-ry");
    };
    addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onLeave, { passive: true });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      removeEventListener("scroll", onScroll);
      removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onLeave);
    };
  }, [pathname]);

  return null;
}
