"use client";

import styles from "./HeroCandleWave.module.css";
import { noise, useHeroCanvas, type Draw } from "./HeroCandleScenes";
import { clamp01, edgeFade, smooth, stage } from "./HeroScenesAbstract";

/** Сцены «про данные» в духе «Рельефа», «Сети» и «Поля точек»: «Хребты», «Карта ветров», «Точечный график». */

/* ── 21. «Хребты»: стопка тонких линий с волнами-пиками; пики текут и растут к правому краю ── */
const RIDGES = 22;

const drawRidges: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const top = h * 0.12;
  const gap = (h * 0.8) / RIDGES;
  const x0 = s.left;
  const x1 = s.right - 30;
  for (let r = 0; r < RIDGES; r++) {
    const base = top + r * gap + gap;
    const points: [number, number][] = [];
    for (let x = x0; x <= x1; x += 6) {
      const u = (x - x0) / (x1 - x0);
      // Пики сильнее к центру-право, на краях линия почти ровная.
      const envelope = Math.exp(-(((u - 0.62) / 0.22) ** 2)) * (0.5 + 0.5 * u);
      const flow = x * 0.018 - t * 0.0006 + r * 0.7;
      const raw = Math.sin(flow) * 0.6 + Math.sin(flow * 2.3 + r) * 0.4 + (noise(Math.floor(x / 6) + r * 997) - 0.5) * 0.25;
      let lift = envelope * Math.max(0, raw) ** 1.4;
      if (p.s > 0.01) lift += p.s * 0.8 * Math.exp(-((x - p.x) ** 2) / (2 * 60 * 60)) * Math.exp(-((base - p.y) ** 2) / (2 * 120 * 120));
      points.push([x, base - lift * gap * 4.2]);
    }
    // Ниже линии стираем то, что нарисовано раньше, — передние хребты закрывают задние, как настоящие горы.
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.moveTo(points[0][0], h);
    for (const [x, y] of points) ctx.lineTo(x, y);
    ctx.lineTo(points[points.length - 1][0], h);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    const color = r === RIDGES - 6 ? c.down : c.up;
    const fade = ctx.createLinearGradient(x0, 0, x1, 0);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(0.25, color);
    fade.addColorStop(1, color);
    ctx.strokeStyle = fade;
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.45 + 0.5 * (r / RIDGES);
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
};

export function HeroRidges() {
  const ref = useHeroCanvas(drawRidges);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 22. «Карта ветров»: сетка штрихов поворачивается по невидимому потоку, как ветер на метеокарте ── */
const WIND_STEP = 26;

const drawWind: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const cols = Math.floor(s.width / WIND_STEP);
  const rows = Math.floor(h / WIND_STEP);
  const ox = s.right - cols * WIND_STEP + WIND_STEP / 2;
  const oy = (h - rows * WIND_STEP) / 2 + WIND_STEP / 2;
  ctx.lineCap = "round";
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = ox + i * WIND_STEP;
      const y = oy + j * WIND_STEP;
      // Поле направлений: общий поток вверх-вправо и медленные завихрения.
      let a =
        -0.45 +
        0.7 * Math.sin(x * 0.006 + t * 0.00025) * Math.cos(y * 0.008 - t * 0.0002) +
        0.35 * Math.sin((x + y) * 0.004 + t * 0.00015);
      const strength = 0.5 + 0.5 * Math.sin(x * 0.01 - y * 0.007 + t * 0.0009);
      if (p.s > 0.01) {
        const dx = x - p.x;
        const dy = y - p.y;
        const pull = p.s * smooth(clamp01(1 - Math.hypot(dx, dy) / 160));
        if (pull > 0) a = a * (1 - pull) + (Math.atan2(dy, dx) + Math.PI / 2) * pull;
      }
      const len = 6 + 9 * strength;
      const color = strength > 0.985 && noise(i * 31 + j) > 0.5 ? c.down : c.up;
      ctx.globalAlpha = (0.25 + 0.6 * strength) * edgeFade(x, s.left, s.width);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2 + strength;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(a) * len * 0.5, y - Math.sin(a) * len * 0.5);
      ctx.lineTo(x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.5);
      ctx.stroke();
      // Головка — точка на конце штриха, показывает направление.
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.5, 1 + strength, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

export function HeroWind() {
  const ref = useHeroCanvas(drawWind);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 23. «Точечный график»: график рынка из точек — столбцы точек под растущей кривой, кривая медленно бежит ── */
const DOT_STEP = 12;

const drawDotChart: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const cols = Math.floor((s.width - 40) / DOT_STEP);
  const ox = s.right - 40 - cols * DOT_STEP;
  const base = h * 0.92;
  const shift = t * 0.012;
  const price = (k: number) => {
    const u = k / cols;
    // Растущая кривая с волнами; сдвиг во времени — график бежит.
    const n = k + shift / DOT_STEP;
    return h * (0.62 - 0.4 * u) + Math.sin(n * 0.21) * h * 0.06 + Math.sin(n * 0.07 + 1.3) * h * 0.08 + Math.sin(n * 0.53) * h * 0.015;
  };
  for (let k = 0; k < cols; k++) {
    const x = ox + k * DOT_STEP;
    const y = price(k);
    const fade = edgeFade(x, s.left, s.width);
    const near = p.s * smooth(clamp01(1 - Math.abs(x - p.x) / 60));
    // Столбец точек от линии вниз: чем ниже, тем бледнее.
    ctx.fillStyle = c.up;
    for (let yy = y + DOT_STEP; yy < base; yy += DOT_STEP) {
      const depth = (yy - y) / (base - y);
      ctx.globalAlpha = Math.max(0, 0.55 - 0.45 * depth + 0.3 * near) * fade;
      ctx.beginPath();
      ctx.arc(x, yy, 1.6 + 0.6 * near, 0, Math.PI * 2);
      ctx.fill();
    }
    // Точка на линии цены — ярче и крупнее; часть падений — розовым.
    const down = price(k) > price(k - 1);
    ctx.globalAlpha = Math.min(1, (0.9 + 0.1 * near) * fade);
    ctx.fillStyle = down && noise(Math.floor(k + shift / DOT_STEP)) > 0.55 ? c.down : c.up;
    ctx.beginPath();
    ctx.arc(x, y, 2.8 + 1.2 * near, 0, Math.PI * 2);
    ctx.fill();
  }
  // Пульсирующая точка «сейчас» на правом конце.
  const lastX = ox + (cols - 1) * DOT_STEP;
  const lastY = price(cols - 1);
  const pulse = (t * 0.0006) % 1;
  ctx.globalAlpha = (1 - pulse) * 0.6;
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(lastX, lastY, 5 + pulse * 20, 0, Math.PI * 2);
  ctx.stroke();
};

export function HeroDotChart() {
  const ref = useHeroCanvas(drawDotChart);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}
