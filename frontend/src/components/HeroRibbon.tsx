"use client";

import { useEffect, useRef } from "react";
import styles from "./HeroRibbon.module.css";

/**
 * «Шёлковая лента»: десятки тонких линий образуют ленту, которая медленно течёт и перекручивается.
 * Рисуется на canvas; пока идёт заставка, баннер вне экрана или включено «меньше движения» — стоит.
 */

const LINES = 52;
const STEP = 6;

export function HeroRibbon() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let colors = { a: "#3f9aa4", b: "#57b6c0" };
    let frame = 0;
    let visible = true;
    const start = performance.now();

    const readColors = () => {
      const style = getComputedStyle(canvas);
      colors = {
        a: style.getPropertyValue("--ribbon-a").trim() || colors.a,
        b: style.getPropertyValue("--ribbon-b").trim() || colors.b,
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

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      if (!width || !height) return;
      const narrow = width < 900;
      const x0 = narrow ? -40 : width * 0.34;
      const x1 = width + 40;
      const cy = height * (narrow ? 0.62 : 0.5);
      const amp = height * 0.16;
      const spread = height * (narrow ? 0.42 : 0.62);

      const gradient = ctx.createLinearGradient(x0, 0, x1, 0);
      gradient.addColorStop(0, colors.b);
      gradient.addColorStop(1, colors.a);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;

      for (let i = 0; i < LINES; i++) {
        const u = i / (LINES - 1) - 0.5;
        // Края ленты бледнее, середина плотнее — ощущение объёма.
        ctx.globalAlpha = 0.14 + 0.5 * (1 - Math.abs(u) * 1.6);
        ctx.beginPath();
        for (let x = x0; x <= x1; x += STEP) {
          const p = (x - x0) / (x1 - x0);
          // Плавный вход слева: лента рождается из точки.
          const grow = Math.min(1, p * 2.2);
          const wave = Math.sin(p * 4.2 + t * 0.00028) * amp + Math.sin(p * 9.1 - t * 0.00019 + 1.7) * amp * 0.25;
          // Перекрут: ширина ленты меняет знак — линии сходятся и расходятся, как сложенная ткань.
          const twist = Math.cos(p * 2.6 - t * 0.00022 + 0.9) * (0.45 + 0.55 * p);
          const y = cy + wave * grow + u * spread * twist * grow;
          if (x === x0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      frame = 0;
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

  return <canvas ref={canvasRef} className={styles.ribbon} aria-hidden="true" />;
}
