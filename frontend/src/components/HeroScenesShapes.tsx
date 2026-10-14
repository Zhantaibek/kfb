"use client";

import styles from "./HeroCandleWave.module.css";
import { noise, useHeroCanvas, type Colors, type Draw } from "./HeroCandleScenes";
import { clamp01, smooth, stage } from "./HeroScenesAbstract";

/** Сцены с абстрактными фигурами: «Композиция», «Конструктор», «Плоскости», «Морфинг». */

const isDark = () => document.documentElement.dataset.theme === "dark";

type Kind = "semi" | "ring" | "tri" | "rect" | "quarter" | "circle" | "square";

/** Фигура с центром в (0,0) и размером size; заливка или контур — по аргументу. */
function shape(ctx: CanvasRenderingContext2D, kind: Kind, size: number, fill: boolean, lineWidth = 2) {
  const r = size / 2;
  ctx.beginPath();
  switch (kind) {
    case "semi":
      ctx.arc(0, r * 0.25, r, Math.PI, 0);
      ctx.closePath();
      break;
    case "ring":
    case "circle":
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      break;
    case "tri":
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.92, r * 0.62);
      ctx.lineTo(-r * 0.92, r * 0.62);
      ctx.closePath();
      break;
    case "rect":
      ctx.roundRect(-r * 0.42, -r, r * 0.84, r * 2, 6);
      break;
    case "square":
      ctx.roundRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6, 8);
      break;
    case "quarter":
      ctx.moveTo(-r, r);
      ctx.arc(-r, r, r * 2, -Math.PI / 2, 0);
      ctx.closePath();
      break;
  }
  if (kind === "ring") {
    ctx.lineWidth = size * 0.12;
    ctx.stroke();
  } else if (fill) ctx.fill();
  else {
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/* ── 17. «Композиция»: фигуры в духе Баухауса медленно плывут и поворачиваются, на пересечениях смешиваются ── */
const COMPOSITION: { kind: Kind; x: number; y: number; size: number; tone: "up" | "down" | "deep"; spin: number; alpha: number }[] = [
  { kind: "semi", x: 0.42, y: 0.62, size: 0.42, tone: "up", spin: 0.00004, alpha: 0.7 },
  { kind: "ring", x: 0.72, y: 0.36, size: 0.3, tone: "up", spin: 0, alpha: 0.55 },
  { kind: "rect", x: 0.6, y: 0.5, size: 0.36, tone: "down", spin: -0.00003, alpha: 0.55 },
  { kind: "tri", x: 0.86, y: 0.66, size: 0.22, tone: "deep", spin: 0.00006, alpha: 0.5 },
  { kind: "quarter", x: 0.28, y: 0.3, size: 0.2, tone: "deep", spin: -0.00002, alpha: 0.35 },
  { kind: "circle", x: 0.9, y: 0.22, size: 0.07, tone: "down", spin: 0, alpha: 0.85 },
  { kind: "circle", x: 0.5, y: 0.2, size: 0.04, tone: "up", spin: 0, alpha: 0.9 },
];

function toneColor(c: Colors, tone: "up" | "down" | "deep") {
  if (tone === "down") return c.down;
  if (tone === "deep") return isDark() ? "#9fd6dc" : "#1d4f55";
  return c.up;
}

const drawComposition: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const unit = Math.min(s.width, h * 1.4);
  ctx.globalCompositeOperation = isDark() ? "screen" : "multiply";
  COMPOSITION.forEach((f, i) => {
    let x = s.left + s.width * f.x + Math.sin(t * 0.00022 + i * 1.7) * 18;
    let y = h * f.y + Math.cos(t * 0.00018 + i * 2.3) * 14;
    // От курсора фигуры мягко отодвигаются.
    if (p.s > 0.01) {
      const dx = x - p.x;
      const dy = y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      const push = p.s * smooth(clamp01(1 - d / 220)) * 40;
      x += (dx / d) * push;
      y += (dy / d) * push;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * f.spin + i);
    ctx.globalAlpha = f.alpha;
    ctx.fillStyle = toneColor(c, f.tone);
    ctx.strokeStyle = toneColor(c, f.tone);
    shape(ctx, f.kind, unit * f.size, true);
    ctx.restore();
  });
  ctx.globalCompositeOperation = "source-over";
  // Тонкая линия-ось под композицией.
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(s.left + s.width * 0.2, h * 0.84);
  ctx.lineTo(s.right - 40, h * 0.84);
  ctx.stroke();
};

export function HeroComposition() {
  const ref = useHeroCanvas(drawComposition);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 18. «Конструктор»: сетка фигур; раз в несколько секунд они поворачиваются и меняют форму ── */
const KINDS: Kind[] = ["semi", "circle", "tri", "square", "quarter", "ring"];
const STEP_MS = 3400;

const drawBlocks: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const cols = s.narrow ? 4 : 5;
  const rows = 3;
  const cell = Math.min((s.width * 0.86) / cols, (h * 0.78) / rows);
  const ox = s.narrow ? (w - cell * cols) / 2 : s.right - cell * cols - 40;
  const oy = (h - cell * rows) / 2;
  const phase = t / STEP_MS;
  const k = Math.floor(phase);
  const f = smooth(clamp01((phase - k) * 2.2));
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const n = j * 10 + i;
      const cx = ox + (i + 0.5) * cell;
      const cy = oy + (j + 0.5) * cell;
      // Меняется не всё сразу: каждый шаг — примерно половина ячеек.
      const changes = noise(n * 13 + k) > 0.5;
      const kindA = KINDS[Math.floor(noise(n * 7 + k) * KINDS.length)];
      const kindB = changes ? KINDS[Math.floor(noise(n * 7 + k + 1) * KINDS.length)] : kindA;
      const rotA = Math.floor(noise(n * 3 + k) * 4);
      const rotB = changes ? rotA + 1 : rotA;
      const rot = (rotA + (rotB - rotA) * f) * (Math.PI / 2);
      const tone = noise(n * 5) > 0.8 ? c.down : c.up;
      const near = p.s * smooth(clamp01(1 - Math.hypot(cx - p.x, cy - p.y) / cell));
      const base = 0.25 + 0.35 * noise(n * 9) + 0.25 * near;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.fillStyle = tone;
      ctx.strokeStyle = tone;
      const size = cell * 0.62 * (1 + 0.12 * near);
      // Смена формы — перетекание прозрачности.
      ctx.globalAlpha = base * (1 - f);
      shape(ctx, kindA, size, true);
      ctx.globalAlpha = base * f;
      shape(ctx, kindB, size, true);
      ctx.restore();
      // Тонкая рамка ячейки.
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = c.up;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - cell / 2 + 0.5, cy - cell / 2 + 0.5, cell - 1, cell - 1);
    }
  }
};

export function HeroBlocks() {
  const ref = useHeroCanvas(drawBlocks);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 19. «Плоскости»: тонкие квадратные пластины парят в объёме и медленно вращаются ── */
const PLANES = 7;

const drawPlanes: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const cx = s.narrow ? w / 2 : s.left + s.width * 0.56;
  const cy = h * 0.5;
  const unit = Math.min(s.width * 0.22, h * 0.3);
  // Группа слегка поворачивается вслед за курсором.
  const yaw = t * 0.00012 + p.s * (clamp01((p.x - cx) / 600 + 0.5) - 0.5) * 0.8;
  const pitch = 0.45 + Math.sin(t * 0.0001) * 0.1 + p.s * ((p.y - cy) / 1200);
  const project = (x: number, y: number, z: number) => {
    const x1 = x * Math.cos(yaw) - z * Math.sin(yaw);
    const z1 = x * Math.sin(yaw) + z * Math.cos(yaw);
    const y1 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
    const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
    const k = 900 / (900 + z2 * unit);
    return { x: cx + x1 * unit * k, y: cy + y1 * unit * k, z: z2 };
  };
  const planes = Array.from({ length: PLANES }, (_, i) => {
    const px = (noise(i * 3) - 0.5) * 2.6;
    const py = (i / (PLANES - 1) - 0.5) * 2.2;
    const pz = (noise(i * 3 + 1) - 0.5) * 2;
    const size = 0.35 + 0.35 * noise(i * 3 + 2);
    const spin = t * 0.0003 * (noise(i * 5) - 0.5) * 2 + i;
    const bob = Math.sin(t * 0.0005 + i) * 0.08;
    const corners = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([a, b]) => project(px + a * size * Math.cos(spin), py + bob, pz + a * size * Math.sin(spin) + b * size));
    return { corners, depth: corners.reduce((sum, pt) => sum + pt.z, 0) / 4, i };
  });
  planes.sort((a, b) => b.depth - a.depth);
  for (const pl of planes) {
    const tone = pl.i % 3 === 1 ? c.down : c.up;
    const near = clamp01((1.5 - pl.depth) / 3);
    ctx.beginPath();
    pl.corners.forEach((pt, k) => (k ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
    ctx.closePath();
    ctx.globalAlpha = 0.08 + 0.18 * near;
    ctx.fillStyle = tone;
    ctx.fill();
    ctx.globalAlpha = 0.45 + 0.5 * near;
    ctx.strokeStyle = tone;
    ctx.lineWidth = 1.2 + near;
    ctx.stroke();
  }
};

export function HeroPlanes() {
  const ref = useHeroCanvas(drawPlanes);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 20. «Морфинг»: одна фигура перетекает — круг, квадрат, треугольник, шестиугольник; за ней тонкое эхо ── */
const MORPH_POINTS = 180;
/** Расстояние от центра до контура правильного n-угольника в направлении a (n=0 — круг). */
function polygonRadius(n: number, a: number) {
  if (n === 0) return 1;
  const sector = (Math.PI * 2) / n;
  const local = (((a % sector) + sector) % sector) - sector / 2;
  return Math.cos(Math.PI / n) / Math.cos(local);
}
const MORPH_SHAPES = [0, 4, 3, 6];

const drawMorph: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const cx = s.narrow ? w / 2 : s.left + s.width * 0.56;
  const cy = h * 0.5;
  const R = Math.min(s.width * 0.26, h * 0.34);
  const near = p.s * smooth(clamp01(1 - Math.hypot(p.x - cx, p.y - cy) / (R * 1.8)));
  const outline = (time: number, scale: number) => {
    const phase = time / 4200;
    const k = Math.floor(phase);
    const f = smooth(clamp01((phase - k) * 1.6));
    const a = MORPH_SHAPES[((k % MORPH_SHAPES.length) + MORPH_SHAPES.length) % MORPH_SHAPES.length];
    const b = MORPH_SHAPES[(((k + 1) % MORPH_SHAPES.length) + MORPH_SHAPES.length) % MORPH_SHAPES.length];
    const rot = time * 0.00008;
    const pts: [number, number][] = [];
    for (let i = 0; i < MORPH_POINTS; i++) {
      const ang = (i / MORPH_POINTS) * Math.PI * 2 - Math.PI / 2;
      const r = polygonRadius(a, ang + Math.PI / 2) * (1 - f) + polygonRadius(b, ang + Math.PI / 2) * f;
      pts.push([cx + Math.cos(ang + rot) * r * R * scale, cy + Math.sin(ang + rot) * r * R * scale]);
    }
    return pts;
  };
  const path = (pts: [number, number][]) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  };
  // Эхо — те же формы с запаздыванием, крупнее и бледнее.
  for (let e = 3; e >= 1; e--) {
    path(outline(t - e * 260, 1 + e * 0.1));
    ctx.globalAlpha = 0.22 - e * 0.05;
    ctx.strokeStyle = e === 2 ? c.down : c.up;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  path(outline(t, 1 + 0.06 * near));
  ctx.globalAlpha = isDark() ? 0.12 : 0.16;
  ctx.fillStyle = c.up;
  ctx.fill();
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.stroke();
};

export function HeroMorph() {
  const ref = useHeroCanvas(drawMorph);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}
