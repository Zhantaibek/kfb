"use client";

import { useEffect, useRef } from "react";
import styles from "./HeroCandleWave.module.css";

/**
 * «Свечная волна»: сотни тонких свечей стоят вдоль медленно текущей волны.
 * Высота свечи — толщина ленты в этом месте (перекрут сжимает и вытягивает их),
 * цвет — направление волны: вверх — рост, вниз — падение. Без интерактива, просто живёт.
 */

const STEP = 9;

/** Целочисленный хеш вместо Math.random — фактура теней одинакова при каждой отрисовке. */
function noise(n: number) {
  let h = Math.imul(n + 23, 2654435761) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0;
  return (h % 10000) / 10000;
}

export function HeroCandleWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let colors = { up: "#3f9aa4", down: "#d0697a", wick: "rgba(13,42,46,0.35)" };
    let frame = 0;
    let visible = true;
    const start = performance.now();

    const readColors = () => {
      const style = getComputedStyle(canvas);
      colors = {
        up: style.getPropertyValue("--cw-up").trim() || colors.up,
        down: style.getPropertyValue("--cw-down").trim() || colors.down,
        wick: style.getPropertyValue("--cw-wick").trim() || colors.wick,
      };
    };

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = box.width;
      height = box.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      readColors();
    };

    const wave = (p: number, t: number, amp: number) =>
      Math.sin(p * 4.2 + t * 0.00026) * amp + Math.sin(p * 9.1 - t * 0.00017 + 1.7) * amp * 0.25;

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      if (!width || !height) return;
      const narrow = width < 900;
      const x0 = narrow ? -20 : width * 0.34;
      const x1 = width + 20;
      const cy = height * (narrow ? 0.64 : 0.5);
      const amp = height * 0.15;
      const spread = height * (narrow ? 0.34 : 0.5);
      const body = narrow ? 3.5 : 5;
      const count = Math.ceil((x1 - x0) / STEP);

      for (let k = 0; k <= count; k++) {
        const x = x0 + k * STEP;
        const p = (x - x0) / (x1 - x0);
        const grow = Math.min(1, p * 2.4);
        const y = cy + wave(p, t, amp) * grow;
        // Наклон волны → цвет свечи.
        const slope = wave(p + 0.004, t, amp) - wave(p - 0.004, t, amp);
        // Как на живом рынке: на подъёме почти все свечи растущие, на спаде — вперемешку, с перевесом роста.
        const up = slope < 0 ? noise(k + 900) > 0.1 : noise(k + 900) > 0.5;
        // Толщина ленты: перекрут сжимает свечи в точку и снова вытягивает.
        const twist = Math.abs(Math.cos(p * 2.6 - t * 0.00021 + 0.9)) * (0.45 + 0.55 * p);
        const half = Math.max(1.5, (spread * twist * grow) / 2) * (0.55 + 0.45 * noise(k));
        const wickTop = half + 4 + noise(k + 300) * half * 0.5;
        const wickBottom = half + 4 + noise(k + 600) * half * 0.5;

        ctx.globalAlpha = (0.25 + 0.75 * grow) * (0.55 + 0.45 * Math.min(1, twist * 1.6));
        ctx.strokeStyle = colors.wick;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 0.5, y - wickTop);
        ctx.lineTo(x + 0.5, y + wickBottom);
        ctx.stroke();

        ctx.fillStyle = up ? colors.up : colors.down;
        ctx.beginPath();
        ctx.roundRect(x - body / 2 + 0.5, y - half, body, half * 2, 1.5);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      const paused = document.body.querySelector('[data-site-splash="show"]');
      if (visible && !paused) draw(now - start + 4000);
      frame = requestAnimationFrame(loop);
    };

    resize();
    draw(4000);
    const sizeObserver = new ResizeObserver(() => {
      resize();
      draw(performance.now() - start + 4000);
    });
    sizeObserver.observe(canvas);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    visibility.observe(canvas);
    const theme = new MutationObserver(() => {
      readColors();
      draw(performance.now() - start + 4000);
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    if (!reduce) frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      visibility.disconnect();
      theme.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.wave} aria-hidden="true" />;
}
