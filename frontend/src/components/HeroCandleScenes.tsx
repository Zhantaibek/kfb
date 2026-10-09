"use client";

import { useEffect, useRef } from "react";
import styles from "./HeroCandleWave.module.css";

/**
 * Живые свечные сцены баннера без интерактива: «Орбита», «Живой рынок», «Всплытие».
 * Общий цикл отрисовки — useHeroCanvas; цвета и раскладка слоя — из HeroCandleWave.module.css.
 */

type Colors = { up: string; down: string; wick: string };
/** Курсор над сценой: координаты в пикселях слоя и сила влияния 0…1 (плавно нарастает и гаснет). */
type Pointer = { x: number; y: number; s: number };
type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, c: Colors, p: Pointer) => void;

/** Целочисленный хеш вместо Math.random — сцена одинакова при каждой отрисовке. */
function noise(n: number) {
  let h = Math.imul(n + 31, 2654435761) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0;
  return (h % 10000) / 10000;
}

function candle(ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number, wickTop: number, wickBottom: number, w: number, color: string, wick: string) {
  ctx.strokeStyle = wick;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, wickTop);
  ctx.lineTo(x, wickBottom);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, top, w, Math.max(bottom - top, 1.5), Math.min(2, w / 3));
  ctx.fill();
}

/** Цикл canvas: DPR, размер, тема; пауза на заставке, вне экрана и при «меньше движения». */
function useHeroCanvas(draw: Draw) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);

  useEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let colors: Colors = { up: "#3f9aa4", down: "#dc8f9b", wick: "rgba(13,42,46,0.28)" };
    let frame = 0;
    let visible = true;
    const start = performance.now();
    // Курсор: цель и сглаженное положение — сцена плавно «оборачивается» к нему.
    const pointer: Pointer = { x: 0, y: 0, s: 0 };
    const target = { x: 0, y: 0, on: false };

    const read = () => {
      const s = getComputedStyle(canvas);
      colors = {
        up: s.getPropertyValue("--cw-up").trim() || colors.up,
        down: s.getPropertyValue("--cw-down").trim() || colors.down,
        wick: s.getPropertyValue("--cw-wick").trim() || colors.wick,
      };
    };
    const resize = () => {
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = box.width;
      h = box.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      read();
    };
    const paint = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      if (w && h) drawRef.current(ctx, w, h, t, colors, pointer);
      ctx.globalAlpha = 1;
    };
    const loop = (now: number) => {
      pointer.s += ((target.on ? 1 : 0) - pointer.s) * 0.08;
      pointer.x += (target.x - pointer.x) * 0.18;
      pointer.y += (target.y - pointer.y) * 0.18;
      if (visible && !document.body.querySelector('[data-site-splash="show"]')) paint(now - start + 6000);
      frame = requestAnimationFrame(loop);
    };

    resize();
    paint(6000);
    const size = new ResizeObserver(() => {
      resize();
      paint(performance.now() - start + 6000);
    });
    size.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    io.observe(canvas);
    const theme = new MutationObserver(() => {
      read();
      paint(performance.now() - start + 6000);
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    // Слой не ловит события (под ним кнопки баннера) — слушаем окно и проверяем, что курсор над слоем.
    const onMove = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      target.on = x >= 0 && y >= 0 && x <= box.width && y <= box.height;
      if (target.on) {
        if (pointer.s < 0.02) {
          pointer.x = x;
          pointer.y = y;
        }
        target.x = x;
        target.y = y;
      }
    };
    const onLeave = () => {
      target.on = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    if (!reduce) frame = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
      size.disconnect();
      io.disconnect();
      theme.disconnect();
    };
  }, []);

  return ref;
}

/* ── «Орбита»: свечи на вращающемся кольце в перспективе ── */
const ORBIT_N = 46;

const drawOrbit: Draw = (ctx, w, h, t, c) => {
  const narrow = w < 900;
  const cx = narrow ? w * 0.5 : w * 0.7;
  const cy = h * (narrow ? 0.7 : 0.6);
  const rx = Math.min(w * (narrow ? 0.46 : 0.23), 400);
  const ry = rx * 0.26;
  const turn = t * 0.00011;

  // Кольцо-орбита: тонкий эллипс под свечами.
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  const items = Array.from({ length: ORBIT_N }, (_, k) => {
    const a = (k / ORBIT_N) * Math.PI * 2 + turn;
    return { k, a, z: (Math.sin(a) + 1) / 2 };
  }).sort((p, q) => p.z - q.z);

  for (const { k, a, z } of items) {
    const s = 0.5 + 0.5 * z;
    const x = cx + rx * Math.cos(a);
    const y = cy + ry * Math.sin(a);
    // Высота «дышит»: у каждой свечи свой ритм.
    const tall = (26 + 70 * noise(k)) * (0.7 + 0.3 * Math.sin(t * 0.0011 + k * 0.9)) * s;
    const gap = 6 * s;
    ctx.globalAlpha = 0.18 + 0.82 * z;
    candle(
      ctx,
      x,
      y - gap - tall,
      y - gap,
      y - gap - tall - (6 + 10 * noise(k + 50)) * s,
      y - gap + (3 + 6 * noise(k + 90)) * s,
      Math.max(3, 9 * s),
      noise(k + 7) > 0.3 ? c.up : c.down,
      c.wick,
    );
  }
};

export function HeroCandleOrbit() {
  const ref = useHeroCanvas(drawOrbit);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── «Живой рынок»: график плавно течёт, справа формируется новая свеча ── */
const FEED_STEP = 16;
const FEED_SPEED = 0.012;

const level = (n: number) => Math.sin(n * 0.11) * 0.5 + Math.sin(n * 0.037 + 1) * 0.35 + (noise(Math.floor(n)) - 0.5) * 0.5 + n * 0.004;

const drawFeed: Draw = (ctx, w, h, t, c) => {
  const narrow = w < 900;
  const left = narrow ? 0 : w * 0.34;
  const right = w - (narrow ? 16 : 56);
  const top = h * 0.14;
  const bottom = h * 0.86;
  const count = Math.ceil((right - left) / FEED_STEP) + 1;
  const shift = t * FEED_SPEED;
  const head = Math.floor(shift / FEED_STEP);
  const frac = (shift % FEED_STEP) / FEED_STEP;
  const first = head - count + 1;

  const values: number[] = [];
  for (let n = first - 1; n <= head; n++) values.push(level(n));
  const lo = Math.min(...values) - 0.2;
  const hi = Math.max(...values) + 0.2;
  const y = (v: number) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
  const x = (n: number) => right - (head - n) * FEED_STEP - frac * FEED_STEP;

  // Мягкая заливка и линия по закрытиям.
  const pts: { x: number; y: number }[] = [];
  for (let n = first; n <= head; n++) {
    const close = n === head ? level(n - 1) + (level(n) - level(n - 1)) * frac : level(n);
    pts.push({ x: x(n), y: y(close) });
  }
  const fill = ctx.createLinearGradient(0, top, 0, bottom);
  fill.addColorStop(0, c.up);
  fill.addColorStop(1, "transparent");
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, bottom);
  pts.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, bottom);
  ctx.closePath();
  ctx.fill();

  for (let n = first; n <= head; n++) {
    const open = level(n - 1);
    const close = n === head ? open + (level(n) - open) * frac + Math.sin(t * 0.01) * 0.01 : level(n);
    const reach = 0.04 + noise(n + 500) * 0.1;
    const up = close >= open;
    const px = x(n);
    ctx.globalAlpha = n === head ? 1 : 0.85;
    candle(ctx, px, y(Math.max(open, close)), y(Math.min(open, close)), y(Math.max(open, close) + reach), y(Math.min(open, close) - reach * 0.8), 8, up ? c.up : c.down, c.wick);
  }

  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();

  // Пульсирующая точка на последней цене.
  const last = pts[pts.length - 1];
  const pulse = (t % 2400) / 2400;
  ctx.globalAlpha = 0.35 * (1 - pulse);
  ctx.fillStyle = c.up;
  ctx.beginPath();
  ctx.arc(last.x, last.y, 4 + pulse * 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2);
  ctx.fill();
};

export function HeroCandleFeed() {
  const ref = useHeroCanvas(drawFeed);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── «Всплытие»: свечи на трёх глубинах всплывают (рост) и опускаются (падение) ──
 * Строго по вертикальным дорожкам, как столбцы графика: ближний слой — на основных дорожках,
 * средний — между ними, дальний — в промежутках. Без покачивания и размытия.
 */
const RISE_LANES = 16;
const RISE_LAYERS = [
  { d: 0.45, shift: 0.25, alpha: 0.42, width: 5.5 },
  { d: 0.7, shift: 0.5, alpha: 0.74, width: 8 },
  { d: 1, shift: 0, alpha: 1, width: 12 },
];

const RISE_REACH = 170;

const drawRise: Draw = (ctx, w, h, t, c, p) => {
  const narrow = w < 900;
  const left = narrow ? 8 : w * 0.4;
  const right = w - (narrow ? 8 : 36);
  const lane = (right - left) / (RISE_LANES - 1);
  const travel = h + 160;

  // Тонкая сетка уровней — картинка читается как график.
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const y = Math.round((h * i) / 5) + 0.5;
    const grid = ctx.createLinearGradient(left - 60, 0, right, 0);
    grid.addColorStop(0, "transparent");
    grid.addColorStop(0.25, c.up);
    ctx.strokeStyle = grid;
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.moveTo(left - 60, y);
    ctx.lineTo(right + 20, y);
    ctx.stroke();
  }

  // Под курсором — мягкое белое пятно, как фонарик над графиком.
  if (p.s > 0.01) {
    const light = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, RISE_REACH * 1.4);
    light.addColorStop(0, "#ffffff");
    light.addColorStop(1, "rgba(255, 255, 255, 0)");
    // На тёмном фоне белое пятно сильнее — там оно слабее, чтобы не превращалось в туман.
    const dark = document.documentElement.dataset.theme === "dark";
    ctx.globalAlpha = (dark ? 0.2 : 0.55) * p.s;
    ctx.fillStyle = light;
    ctx.fillRect(p.x - RISE_REACH * 1.4, p.y - RISE_REACH * 1.4, RISE_REACH * 2.8, RISE_REACH * 2.8);
  }

  RISE_LAYERS.forEach((layer, li) => {
    for (let i = 0; i < RISE_LANES; i++) {
      const k = li * 100 + i;
      const laneX = Math.round(left + (i + layer.shift) * lane) + 0.5;
      if (laneX > right + 2) continue;
      const up = noise(k + 3) > 0.25;
      // Скорость постоянная внутри слоя: ближние быстрее, дальние медленнее — глубина без размытия.
      const speed = 0.014 * layer.d * (0.85 + noise(k + 8) * 0.3);
      const phase = (noise(k + 13) * travel + t * speed) % travel;
      const y = up ? h + 80 - phase : -80 + phase;
      const tall = (22 + 42 * noise(k + 34)) * (0.55 + layer.d * 0.45);
      const edge = Math.max(0, Math.min(1, Math.min(y, h - y) / (h * 0.25)));
      if (!edge) continue;
      // Рядом с курсором свеча расступается в сторону, становится шире и ярче.
      const dist = Math.hypot(laneX - p.x, y - p.y);
      const near = Math.max(0, 1 - dist / RISE_REACH);
      const f = p.s * near * near * (3 - 2 * near);
      const x = laneX + Math.sign(laneX - p.x || 1) * 34 * f * layer.d;
      ctx.globalAlpha = Math.min(1, edge * (layer.alpha + 0.5 * f));
      candle(
        ctx,
        x,
        y - tall / 2,
        y + tall / 2,
        y - tall / 2 - (5 + 8 * noise(k + 40)) * layer.d,
        y + tall / 2 + (4 + 6 * noise(k + 44)) * layer.d,
        layer.width * (1 + 0.5 * f),
        up ? c.up : c.down,
        c.wick,
      );
    }
  });
};

export function HeroCandleRise() {
  const ref = useHeroCanvas(drawRise);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── «Поле рынка»: ряды свечей в перспективе плывут на зрителя, по полю идёт волна ── */
const FIELD_COLS = 15;
const FIELD_ROWS = 16;
const FIELD_GAP = 0.55;
const FIELD_NEAR = 1.1;

const drawField: Draw = (ctx, w, h, t, c) => {
  const narrow = w < 900;
  const cx = narrow ? w * 0.5 : w * 0.69;
  const horizon = h * 0.3;
  const focal = Math.min(w * (narrow ? 0.9 : 0.42), h * 1.5);
  const camY = 0.55;
  const spanX = 3.2;
  const travel = t * 0.00016;
  const shift = travel % FIELD_GAP;
  const base = Math.floor(travel / FIELD_GAP);
  const far = FIELD_NEAR + FIELD_ROWS * FIELD_GAP;

  // Дымка у горизонта.
  const haze = ctx.createLinearGradient(0, horizon - h * 0.1, 0, horizon + h * 0.25);
  haze.addColorStop(0, "transparent");
  haze.addColorStop(1, c.up);
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = haze;
  ctx.fillRect(0, horizon - h * 0.1, w, h);

  // Сетка «пола»: линии рядов к горизонту и поперечные линии под каждым рядом.
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 1;
  const nearScale = focal / 0.6;
  for (let col = 0; col < FIELD_COLS; col++) {
    const X = (col / (FIELD_COLS - 1) - 0.5) * spanX * 2;
    const grad = ctx.createLinearGradient(0, horizon, 0, horizon + camY * nearScale);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(1, c.up);
    ctx.strokeStyle = grad;
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.moveTo(cx, horizon);
    ctx.lineTo(cx + X * nearScale * 0.5, horizon + camY * nearScale);
    ctx.stroke();
  }
  ctx.strokeStyle = c.up;
  for (let r = 0; r < FIELD_ROWS; r++) {
    const z = FIELD_NEAR + r * FIELD_GAP - shift;
    if (z < 0.6) continue;
    const scale = focal / z;
    const gy = horizon + camY * scale;
    const half = spanX * scale * 0.5;
    ctx.globalAlpha = 0.12 * Math.max(0, 1 - (z - FIELD_NEAR) / (far - FIELD_NEAR)) * Math.min(1, (z - 0.6) / 0.6);
    ctx.beginPath();
    ctx.moveTo(cx - half, gy);
    ctx.lineTo(cx + half, gy);
    ctx.stroke();
  }

  for (let r = FIELD_ROWS - 1; r >= 0; r--) {
    const z = FIELD_NEAR + r * FIELD_GAP - shift;
    if (z < 0.6) continue;
    const row = base + r;
    const scale = focal / z;
    const groundY = horizon + camY * scale;
    // Ближе — плотнее, дальше — растворяется в дымке; у самого края — тоже мягко гаснет.
    const fog = Math.pow(1 - (z - FIELD_NEAR) / (far - FIELD_NEAR), 1.3);
    const fadeNear = Math.min(1, (z - 0.6) / 0.6);
    const alpha = Math.max(0, fog) * fadeNear;
    if (alpha <= 0.01) continue;

    for (let col = 0; col < FIELD_COLS; col++) {
      const X = (col / (FIELD_COLS - 1) - 0.5) * spanX * 2;
      const sx = cx + X * scale * 0.5;
      if (sx < -40 || sx > w + 40) continue;
      // Пологая волна по полю + своя фактура у каждой свечи.
      const wave = 0.5 + 0.3 * Math.sin(X * 1.1 + row * 0.42 - t * 0.0005) + 0.2 * Math.sin(row * 0.17 + col * 0.6);
      const tall = (0.08 + 0.32 * wave * (0.7 + 0.3 * noise(row * 37 + col))) * scale * 0.5;
      const width = Math.max(1.5, 0.05 * scale * 0.5);
      const up = noise(row * 53 + col * 7) > 0.18;
      ctx.globalAlpha = alpha * (0.55 + 0.45 * wave);
      candle(
        ctx,
        sx,
        groundY - tall,
        groundY,
        groundY - tall - tall * (0.15 + 0.2 * noise(row * 11 + col)),
        groundY + tall * 0.12,
        width,
        up ? c.up : c.down,
        c.wick,
      );
    }
  }
};

export function HeroCandleField() {
  const ref = useHeroCanvas(drawField);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── «Город роста»: три ряда свечей внизу, как силуэт города в глубину, плывут вбок ── */
const drawSkyline: Draw = (ctx, w, h, t, c) => {
  const narrow = w < 900;
  const left = narrow ? 0 : w * 0.36;
  const ground = h * 0.94;
  const layers = [
    { step: 11, width: 5, max: 0.42, speed: 0.006, alpha: 0.28, seed: 100 },
    { step: 15, width: 7, max: 0.58, speed: 0.011, alpha: 0.5, seed: 300 },
    { step: 21, width: 10, max: 0.74, speed: 0.018, alpha: 0.95, seed: 500 },
  ];
  for (const layer of layers) {
    const offset = (t * layer.speed) % layer.step;
    const first = Math.floor((t * layer.speed) / layer.step);
    const count = Math.ceil((w - left) / layer.step) + 2;
    for (let i = 0; i < count; i++) {
      const n = first + i;
      const x = w - i * layer.step + offset;
      if (x < left - 20) continue;
      // Силуэт: плавная гряда + своя высота у каждой «башни», к правому краю — выше (рост).
      const ridge = 0.55 + 0.25 * Math.sin(n * 0.21 + layer.seed) + 0.2 * noise(n + layer.seed);
      const rise = 0.75 + 0.25 * ((x - left) / (w - left));
      const tall = h * layer.max * ridge * rise * (0.92 + 0.08 * Math.sin(t * 0.0012 + n));
      const up = noise(n * 3 + layer.seed) > 0.18;
      ctx.globalAlpha = layer.alpha * Math.max(0, Math.min(1, (x - left + 20) / 160));
      candle(ctx, x, ground - tall, ground, ground - tall - 6 - noise(n + 9) * 14, ground, layer.width, up ? c.up : c.down, c.wick);
    }
  }
  // Линия земли.
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, ground + 0.5);
  ctx.lineTo(w, ground + 0.5);
  ctx.stroke();
};

export function HeroCandleSkyline() {
  const ref = useHeroCanvas(drawSkyline);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── «Лестница роста»: свечи ступенями снизу-слева вверх-вправо, по ним бежит волна света ── */
const STAIRS = 22;

const drawStairs: Draw = (ctx, w, h, t, c) => {
  const narrow = w < 900;
  const x0 = narrow ? w * 0.08 : w * 0.42;
  const x1 = w - (narrow ? 20 : 70);
  const y0 = h * 0.86;
  const y1 = h * 0.14;
  const step = (x1 - x0) / (STAIRS - 1);
  const width = Math.min(16, step * 0.5);
  // Волна света идёт от первой ступени к последней и начинается заново.
  const head = ((t * 0.0006) % 1.4) * STAIRS;
  for (let i = 0; i < STAIRS; i++) {
    const p = i / (STAIRS - 1);
    const x = x0 + i * step;
    const mid = y0 + (y1 - y0) * p + Math.sin(i * 1.3) * h * 0.025;
    const tall = h * (0.08 + 0.06 * noise(i + 70));
    const up = i % 5 !== 3;
    const glow = Math.max(0, 1 - Math.abs(i - head) / 3);
    ctx.globalAlpha = Math.min(1, 0.35 + 0.4 * p + 0.25 * glow);
    if (glow > 0.05) {
      ctx.shadowColor = c.up;
      ctx.shadowBlur = 18 * glow;
    }
    const lift = glow * 6;
    candle(ctx, x, mid - tall / 2 - lift, mid + tall / 2 - lift, mid - tall / 2 - lift - 8 - noise(i) * 10, mid + tall / 2 - lift + 6, width, up ? c.up : c.down, c.wick);
    ctx.shadowBlur = 0;
  }
  // Пунктир тренда под ступенями.
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 6]);
  ctx.beginPath();
  ctx.moveTo(x0, y0 + h * 0.08);
  ctx.lineTo(x1, y1 + h * 0.08);
  ctx.stroke();
  ctx.setLineDash([]);
};

export function HeroCandleStairs() {
  const ref = useHeroCanvas(drawStairs);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── «Отражение»: ряд свечей на стеклянном полу, высоты переливаются волной ── */
const drawMirror: Draw = (ctx, w, h, t, c) => {
  const narrow = w < 900;
  const left = narrow ? 0 : w * 0.38;
  const floor = h * 0.62;
  const step = 14;
  const count = Math.floor((w - left - 20) / step);
  for (let i = 0; i < count; i++) {
    const x = left + 10 + i * step;
    const p = i / count;
    const wave = 0.5 + 0.3 * Math.sin(p * 7 - t * 0.0011) + 0.2 * Math.sin(p * 17 + t * 0.0007);
    const tall = h * (0.06 + 0.4 * wave * (0.6 + 0.4 * p)) * (0.85 + 0.15 * noise(i));
    const up = noise(i + 40) > 0.2;
    const color = up ? c.up : c.down;
    const fade = Math.min(1, p * 4);
    ctx.globalAlpha = 0.9 * fade;
    candle(ctx, x, floor - tall, floor - 3, floor - tall - 6 - noise(i + 5) * 10, floor - 3, 7, color, c.wick);
    // Отражение: короче, бледнее, уходит в глубину стекла.
    const mirror = ctx.createLinearGradient(0, floor + 3, 0, floor + 3 + tall * 0.6);
    mirror.addColorStop(0, color);
    mirror.addColorStop(1, "transparent");
    ctx.globalAlpha = 0.28 * fade;
    ctx.fillStyle = mirror;
    ctx.beginPath();
    ctx.roundRect(x - 3.5, floor + 3, 7, tall * 0.6, 1.5);
    ctx.fill();
  }
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, floor);
  ctx.lineTo(w, floor);
  ctx.stroke();
};

export function HeroCandleMirror() {
  const ref = useHeroCanvas(drawMirror);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── «Циферблат»: свечи лучами по кругу, кольцо медленно вращается, длина лучей дышит ── */
const CLOCK_N = 60;

const drawClock: Draw = (ctx, w, h, t, c) => {
  const narrow = w < 900;
  const cx = narrow ? w * 0.5 : w * 0.7;
  const cy = h * 0.5;
  const r = Math.min(h * 0.22, w * 0.15);
  const turn = t * 0.00006;

  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(cx, cy, r + h * 0.24, 0, Math.PI * 2);
  ctx.stroke();

  for (let k = 0; k < CLOCK_N; k++) {
    const a = (k / CLOCK_N) * Math.PI * 2 + turn;
    const len = h * (0.05 + 0.13 * (0.5 + 0.5 * Math.sin(k * 0.45 - t * 0.0012)) * (0.6 + 0.4 * noise(k)));
    const up = noise(k + 17) > 0.2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.globalAlpha = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(a - Math.PI / 2));
    // Свеча стоит на кольце и смотрит наружу.
    candle(ctx, 0, -r - len, -r, -r - len - 6 - noise(k + 3) * 8, -r + 4, 6, up ? c.up : c.down, c.wick);
    ctx.restore();
  }
};

export function HeroCandleClock() {
  const ref = useHeroCanvas(drawClock);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}
