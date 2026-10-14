"use client";

import styles from "./HeroCanvas.module.css";
import { useHeroCanvas, type Draw } from "./HeroCanvas";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => x * x * (3 - 2 * x);

/**
 * «Стеклянные плитки»: сетка мягких скруглённых плиток на весь баннер; справа скопление плиток
 * светится фирменным бирюзовым — от светлого по краям до глубокого в центре — и медленно меняет форму.
 * Курсор зажигает плитки под собой.
 */

type RGB = [number, number, number];
const hex = (value: string): RGB => {
  const v = value.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
};
const mix = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const rgba = (c: RGB, alpha = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${alpha})`;

/** Палитры: светлая тема — от светло-бирюзового к глубокому; тёмная — от приглушённого к яркому. */
const PALETTE = {
  light: { soft: hex("#cdeff2"), mid: hex("#4cc0cc"), deep: hex("#0e97a6"), cool: hex("#2f7fe0"), grid: "rgba(29,79,85,0.10)", cell: "rgba(255,255,255,0.32)" },
  dark: { soft: hex("#21454b"), mid: hex("#3f9aa4"), deep: hex("#6fdae3"), cool: hex("#5cb8e6"), grid: "rgba(159,214,220,0.09)", cell: "rgba(255,255,255,0.025)" },
};

const drawTiles: Draw = (ctx, w, h, t, _c, p) => {
  const dark = document.documentElement.dataset.theme === "dark";
  const pal = dark ? PALETTE.dark : PALETTE.light;
  const narrow = w < 900;
  const cell = Math.max(58, Math.min(92, w / 15));
  const gap = Math.round(cell * 0.11);
  const radius = cell * 0.2;
  const cols = Math.ceil(w / cell) + 1;
  const rows = Math.ceil(h / cell) + 1;
  // Сетка выравнивается по правому краю — справа плитки целые.
  const ox = w - cols * cell + gap / 2;
  const oy = (h - rows * cell) / 2 + gap / 2;

  // Центр скопления — справа (на телефоне по центру); три «ядра» медленно ходят по своим орбитам.
  const cx = narrow ? w * 0.5 : w * 0.72;
  const cy = h * 0.42;
  const spread = cell * 1.05;
  const cores = [
    { x: cx + Math.sin(t * 0.00021) * cell * 0.9, y: cy + Math.cos(t * 0.00017) * cell * 0.7, r: spread * 1.15, k: 1 },
    { x: cx + cell * 1.4 + Math.sin(t * 0.00016 + 2) * cell * 0.8, y: cy + cell * 0.6 + Math.cos(t * 0.00023 + 1) * cell * 0.7, r: spread * 0.85, k: 0.8 },
    { x: cx - cell * 1.2 + Math.cos(t * 0.00019 + 4) * cell * 0.7, y: cy + cell * 1.1 + Math.sin(t * 0.00014) * cell * 0.6, r: spread * 0.8, k: 0.7 },
  ];
  const field = (x: number, y: number) => {
    let v = 0;
    for (const core of cores) v += core.k * Math.exp(-((x - core.x) ** 2 + (y - core.y) ** 2) / (2 * core.r * core.r));
    if (p.s > 0.01) v += p.s * 0.85 * Math.exp(-((x - p.x) ** 2 + (y - p.y) ** 2) / (2 * (cell * 0.9) ** 2));
    // Порог даёт чёткий край скопления, дальше — плавное нарастание к центру.
    return clamp01((v - 0.12) / 0.95);
  };

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = ox + i * cell;
      const y = oy + j * cell;
      const size = cell - gap;
      const mx = x + size / 2;
      const my = y + size / 2;
      const v = smooth(field(mx, my));

      // Фоновая плитка — едва заметная рамка, как в сетке примера.
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, radius);
      ctx.fillStyle = pal.cell;
      ctx.fill();
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1;
      ctx.stroke();
      if (v < 0.04) continue;

      // Цвет: по силе — от светлого к глубокому; правее — с холодным оттенком.
      const tilt = clamp01((mx - (cx - cell * 2)) / (cell * 5));
      const core = mix(mix(pal.soft, pal.mid, smooth(clamp01(v * 1.6))), mix(pal.deep, pal.cool, tilt * 0.6), smooth(clamp01((v - 0.45) / 0.55)));
      const edge = mix(pal.soft, core, 0.35);
      const s2 = size * (1 + 0.03 * v);
      const x2 = mx - s2 / 2;
      const y2 = my - s2 / 2;

      // Стекло: насыщенная середина, светлые края, мягкое свечение вокруг.
      const glass = ctx.createRadialGradient(mx, my, s2 * 0.05, mx, my, s2 * 0.72);
      glass.addColorStop(0, rgba(mix(core, [255, 255, 255], dark ? 0.08 : 0.22), 0.95));
      glass.addColorStop(0.7, rgba(core, 0.92));
      glass.addColorStop(1, rgba(mix(core, edge, 0.4), 0.8));
      ctx.globalAlpha = Math.min(1, 0.25 + v);
      ctx.shadowColor = rgba(core, dark ? 0.55 : 0.45);
      ctx.shadowBlur = 24 * v;
      ctx.beginPath();
      ctx.roundRect(x2, y2, s2, s2, radius);
      ctx.fillStyle = glass;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Блик по верхнему краю и тонкая светлая обводка — эффект матового стекла.
      const shine = ctx.createLinearGradient(0, y2, 0, y2 + s2);
      shine.addColorStop(0, "rgba(255,255,255,0.55)");
      shine.addColorStop(0.35, "rgba(255,255,255,0.08)");
      shine.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalAlpha = 0.35 + 0.4 * v;
      ctx.fillStyle = shine;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;
};

export function HeroTiles() {
  const ref = useHeroCanvas(drawTiles);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}
