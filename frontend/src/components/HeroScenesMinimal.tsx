"use client";

import styles from "./HeroCandleWave.module.css";
import { useHeroCanvas, type Draw } from "./HeroCandleScenes";
import { clamp01, edgeFade, smooth, stage } from "./HeroScenesAbstract";

/**
 * Лаконичные сцены баннера: «Линия», «Знак», «Круг», «Ступени» — минимум элементов, тонкие линии, спокойное движение.
 */

const isDark = () => document.documentElement.dataset.theme === "dark";

/* ── 9. «Линия»: одна линия цены через баннер, лёгкая заливка и пульсирующая точка «сейчас» ── */
const drawLine: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const x0 = s.left + s.width * 0.04;
  const x1 = s.right - 70;
  const yOf = (u: number) =>
    h * (0.7 - 0.36 * u) +
    Math.sin(u * 9 + t * 0.00035) * h * 0.035 +
    Math.sin(u * 23 - t * 0.0006) * h * 0.012 +
    Math.sin(u * 3.2 + t * 0.0002) * h * 0.04;
  const pts: [number, number][] = [];
  for (let k = 0; k <= 120; k++) {
    const u = k / 120;
    pts.push([x0 + (x1 - x0) * u, yOf(u)]);
  }

  // Три еле заметные линии уровней.
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    const y = Math.round(h * (0.2 + i * 0.18)) + 0.5;
    ctx.globalAlpha = 0.08;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(s.right - 30, y);
    ctx.stroke();
  }

  // Заливка под линией.
  const area = ctx.createLinearGradient(0, h * 0.25, 0, h);
  area.addColorStop(0, c.up);
  area.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = isDark() ? 0.14 : 0.18;
  ctx.fillStyle = area;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], h);
  for (const [x, y] of pts) ctx.lineTo(x, y);
  ctx.lineTo(pts[pts.length - 1][0], h);
  ctx.closePath();
  ctx.fill();

  // Линия: слева растворяется, справа — в полную силу.
  const stroke = ctx.createLinearGradient(x0, 0, x1, 0);
  stroke.addColorStop(0, "rgba(0,0,0,0)");
  stroke.addColorStop(0.3, c.up);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();

  // Точка «сейчас» с мягкой пульсацией.
  const [ex, ey] = pts[pts.length - 1];
  const pulse = (t * 0.0006) % 1;
  ctx.globalAlpha = (1 - pulse) * 0.5;
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ex, ey, 6 + pulse * 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = c.up;
  ctx.beginPath();
  ctx.arc(ex, ey, 5, 0, Math.PI * 2);
  ctx.fill();

  // Курсор: вертикальная направляющая и точка на линии.
  if (p.s > 0.01 && p.x > x0 && p.x < x1) {
    const u = (p.x - x0) / (x1 - x0);
    const y = yOf(u);
    ctx.globalAlpha = 0.35 * p.s;
    ctx.setLineDash([3, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x, h * 0.12);
    ctx.lineTo(p.x, h * 0.95);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = p.s;
    ctx.beginPath();
    ctx.arc(p.x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
};

export function HeroLine() {
  const ref = useHeroCanvas(drawLine);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 10. «Знак»: крупный контурный знак КФБ — рамка и три диагональные полосы, по полосам идёт блик ── */
const drawMark: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const size = Math.min(s.width * 0.42, h * 0.62);
  const cx = s.narrow ? w / 2 : s.left + s.width * 0.56;
  const cy = h * 0.5 + Math.sin(t * 0.0005) * 4;
  const half = size / 2;
  const tiltX = p.s * clamp01((p.x - cx) / 400) * 0.06;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.transform(1, 0, tiltX, 1, 0, 0);

  // Рамка-уголки, как у знака.
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.85;
  const arm = size * 0.3;
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    ctx.beginPath();
    ctx.moveTo(sx * half, sy * (half - arm));
    ctx.lineTo(sx * half, sy * half);
    ctx.lineTo(sx * (half - arm), sy * half);
    ctx.stroke();
  }

  // Три диагональные полосы (снизу-слева вверх-вправо) — контуром; блик бежит по диагонали.
  const sweep = ((t * 0.00012) % 1.6) - 0.3;
  ctx.rotate(-Math.PI / 4);
  const barW = size * 0.86;
  const barH = size * 0.17;
  for (let i = -1; i <= 1; i++) {
    const y = i * barH * 1.35;
    const len = barW * (1 - Math.abs(i) * 0.28);
    const glow = smooth(clamp01(1 - Math.abs(sweep - (i + 1) / 2) * 3));
    ctx.globalAlpha = 0.7 + 0.3 * glow;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-len / 2, y - barH / 2, len, barH, barH / 2);
    ctx.stroke();
    // Заливка полосы проявляется бликом.
    ctx.globalAlpha = 0.08 + 0.32 * glow;
    ctx.fillStyle = c.up;
    ctx.fill();
  }
  ctx.restore();
};

export function HeroMark() {
  const ref = useHeroCanvas(drawMark);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 11. «Круг»: одно тонкое кольцо, по нему плавно идёт дуга — как ход торгового дня ── */
const drawCircle: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const cx = s.narrow ? w / 2 : s.left + s.width * 0.56;
  const cy = h * 0.5;
  const R = Math.min(s.width * 0.3, h * 0.36);
  const near = p.s * smooth(clamp01(1 - Math.abs(Math.hypot(p.x - cx, p.y - cy) - R) / 80));

  ctx.lineCap = "round";
  ctx.strokeStyle = c.up;
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  // Восемь рисок — часы торговой сессии.
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI * 2;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (R - 8), cy + Math.sin(a) * (R - 8));
    ctx.lineTo(cx + Math.cos(a) * (R + 8), cy + Math.sin(a) * (R + 8));
    ctx.stroke();
  }

  // Дуга: плавно растёт до полного круга, затем «сессия» начинается заново.
  const cycle = 22000;
  const u = smooth(clamp01(((t % cycle) / cycle) * 1.08));
  const fadeOut = 1 - smooth(clamp01(((t % cycle) / cycle - 0.94) / 0.06));
  const start = -Math.PI / 2;
  const end = start + Math.PI * 2 * u;
  ctx.globalAlpha = fadeOut;
  ctx.lineWidth = 3 + 2 * near;
  ctx.beginPath();
  ctx.arc(cx, cy, R, start, end);
  ctx.stroke();
  ctx.fillStyle = c.up;
  ctx.beginPath();
  ctx.arc(cx + Math.cos(end) * R, cy + Math.sin(end) * R, 6 + 2 * near, 0, Math.PI * 2);
  ctx.fill();

  // Внутреннее тонкое кольцо медленно «дышит».
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R * (0.62 + 0.02 * Math.sin(t * 0.0008)), 0, Math.PI * 2);
  ctx.stroke();
};

export function HeroCircle() {
  const ref = useHeroCanvas(drawCircle);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 12. «Ступени»: пять тонких столбиков нарастающей высоты, по их вершинам пробегает точка ── */
const STEPS = 5;

const drawSteps: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const gap = s.width * 0.11;
  const x0 = (s.narrow ? w / 2 : s.left + s.width * 0.56) - gap * ((STEPS - 1) / 2);
  const base = h * 0.86;
  const tops: [number, number][] = [];
  for (let i = 0; i < STEPS; i++) {
    const x = x0 + i * gap;
    const near = p.s * smooth(clamp01(1 - Math.abs(x - p.x) / (gap * 0.7)));
    const height = h * (0.16 + i * 0.13) * (1 + 0.04 * Math.sin(t * 0.0009 + i * 1.3)) * (1 + 0.08 * near);
    const top = base - height;
    tops.push([x, top]);
    ctx.globalAlpha = (0.35 + 0.12 * i + 0.3 * near) * edgeFade(x, s.left, s.width);
    ctx.fillStyle = c.up;
    ctx.beginPath();
    ctx.roundRect(x - 3, top, 6, height, 3);
    ctx.fill();
  }

  // Точка бежит по вершинам слева направо и вверх, затем пауза.
  const u = (t * 0.00012) % 1.3;
  if (u <= 1) {
    const pos = u * (STEPS - 1);
    const i = Math.min(STEPS - 2, Math.floor(pos));
    const f = smooth(clamp01(pos - i));
    const x = tops[i][0] + (tops[i + 1][0] - tops[i][0]) * f;
    const y = tops[i][1] + (tops[i + 1][1] - tops[i][1]) * f - Math.sin(f * Math.PI) * 18;
    ctx.globalAlpha = Math.sin(u * Math.PI) ** 0.5;
    ctx.fillStyle = c.up;
    ctx.beginPath();
    ctx.arc(x, y - 10, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Базовая линия.
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0 - gap * 0.6, base + 0.5);
  ctx.lineTo(x0 + gap * (STEPS - 0.4), base + 0.5);
  ctx.stroke();
};

export function HeroSteps() {
  const ref = useHeroCanvas(drawSteps);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}
