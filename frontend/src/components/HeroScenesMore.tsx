"use client";

import styles from "./HeroCandleWave.module.css";
import { noise, useHeroCanvas, type Draw } from "./HeroCandleScenes";
import { clamp01, edgeFade, smooth, stage } from "./HeroScenesAbstract";

/**
 * Ещё четыре живые сцены баннера без свечей: «Гладь», «Поле точек», «Струны», «Мозаика».
 * Движок (цикл, тема, курсор, пауза на заставке и вне экрана) — общий, из HeroCandleScenes.
 */

/* ── 5. «Гладь»: водная поверхность в перспективе, по ней расходятся круги; курсор оставляет свои ── */
const RIPPLE_SOURCES = 9;

const drawRipple: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const squash = 0.36;
  // Поверхность воды: тонкие горизонтальные линии, к горизонту — чаще и бледнее, медленно колышутся.
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 1;
  for (let k = 0; k < 14; k++) {
    const z = k / 13;
    const y = h * (0.14 + 0.82 * z ** 1.6);
    ctx.globalAlpha = 0.08 + 0.14 * z;
    ctx.beginPath();
    for (let x = s.left; x <= s.right; x += 24) {
      const yy = y + Math.sin(x * 0.012 + t * 0.0009 + k) * (1 + 3 * z);
      if (x === s.left) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  const ring = (x: number, y: number, r: number, alpha: number, color: string, width: number) => {
    if (alpha <= 0.01 || r <= 1) return;
    ctx.globalAlpha = alpha * edgeFade(x + r * 0.6, s.left, s.width);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * squash, 0, 0, Math.PI * 2);
    ctx.stroke();
  };
  for (let i = 0; i < RIPPLE_SOURCES; i++) {
    const period = 5200 + 2600 * noise(i * 3);
    const shift = noise(i * 7) * period;
    const cycle = Math.floor((t + shift) / period);
    const age = ((t + shift) % period) / period;
    // Каждая «капля» падает в новом месте.
    const x = s.left + s.width * (0.15 + 0.8 * noise(i * 31 + cycle * 7));
    const y = h * (0.2 + 0.65 * noise(i * 37 + cycle * 11));
    const maxR = 160 + 180 * noise(i * 41 + cycle);
    for (let k = 0; k < 4; k++) {
      const a = age - k * 0.09;
      if (a <= 0) continue;
      ring(x, y, maxR * Math.sqrt(a), (1 - a) ** 1.3 * (0.85 - k * 0.12), i % 4 === 3 && k === 0 ? c.down : c.up, 1.6 - k * 0.25);
    }
    // Точка падения.
    ctx.globalAlpha = Math.max(0, 1 - age * 6) * edgeFade(x, s.left, s.width);
    ctx.fillStyle = c.up;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Курсор — как палец по воде.
  if (p.s > 0.01) {
    for (let k = 0; k < 4; k++) {
      const a = (t * 0.0007 + k / 4) % 1;
      ring(p.x, p.y, 10 + a * 130, p.s * (1 - a) * 0.8, c.up, 1.4);
    }
  }
};

export function HeroRipple() {
  const ref = useHeroCanvas(drawRipple);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 6. «Поле точек»: тысячи точек — волнующаяся поверхность в глубину; под курсором поднимается бугор ── */
const DOT_COLS = 96;
const DOT_ROWS = 38;

const drawDots: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const cx = s.narrow ? w / 2 : s.left + s.width * 0.55;
  const horizon = h * 0.04;
  const ground = h * 1.04;
  const dark = document.documentElement.dataset.theme === "dark";
  // Поле медленно течёт вбок — волны «приходят» справа.
  const flow = t * 0.00005;
  for (let r = 0; r < DOT_ROWS; r++) {
    const z = r / (DOT_ROWS - 1);
    // Дальние ряды ближе к горизонту и плотнее — перспектива; к горизонту точки уходят в дымку.
    const scale = 1 / (1 + z * 2.8);
    const rowY = horizon + (ground - horizon) * scale ** 1.2 * 0.96;
    const haze = 0.12 + 0.88 * scale ** 1.3;
    for (let k = 0; k < DOT_COLS; k++) {
      const x3 = k / (DOT_COLS - 1) - 0.5;
      const sx = cx + x3 * s.width * 2 * scale;
      if (sx < s.left - 20 || sx > w + 10) continue;
      const wx = x3 + flow;
      let lift =
        Math.sin(wx * 7 + t * 0.0007 + z * 3) * 0.5 +
        Math.cos(z * 8 - t * 0.0006 + wx * 2.4) * 0.45 +
        Math.sin((wx + z) * 4.4 + t * 0.0004) * 0.35;
      // Поверхность поднимается к правому краю — рост рынка заложен в саму форму.
      const trend = (x3 + 0.5) * 1.5 - 0.3;
      const sy0 = rowY - (lift + trend) * 30 * scale;
      if (p.s > 0.01) lift += p.s * 2.6 * Math.exp(-((sx - p.x) ** 2 + (sy0 - p.y) ** 2) / (2 * 80 * 80));
      const sy = rowY - (lift + trend) * 30 * scale;
      const peak = clamp01((lift + 1.1) / 2.6);
      // Гребни волн светлее и крупнее, изредка — розовые искры на самых высоких точках.
      const crest = smooth(clamp01((peak - 0.62) / 0.38));
      ctx.globalAlpha = Math.min(1, haze * (dark ? 0.3 + 0.7 * peak : 0.45 + 0.75 * peak)) * edgeFade(sx, s.left, s.width);
      ctx.fillStyle = crest > 0.85 && noise(r * 131 + k) > 0.6 ? c.down : crest > 0.4 && dark ? "#bfeef2" : c.up;
      ctx.beginPath();
      ctx.arc(sx, sy, (0.6 + 2.1 * scale) * (1 + 0.45 * crest), 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

export function HeroDots() {
  const ref = useHeroCanvas(drawDots);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 7. «Струны»: ряд струн, как у комуза или арфы, мягко колеблется; курсор трогает струны ── */
const STRINGS = 30;
/** Сила «щипка» каждой струны: нарастает от курсора и медленно затухает. */
const pluck = new Array<number>(STRINGS).fill(0);

const drawStrings: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const top = h * 0.06;
  const bottom = h * 0.94;
  for (let i = 0; i < STRINGS; i++) {
    const u = i / (STRINGS - 1);
    // Струны сходятся к верху — как у арфы.
    const xBottom = s.left + s.width * (0.08 + 0.88 * u);
    const xTop = s.left + s.width * (0.3 + 0.62 * u);
    const near = p.s * smooth(clamp01(1 - Math.abs((xBottom + xTop) / 2 - p.x) / 36));
    pluck[i] = Math.max(pluck[i] * 0.985, near);
    const amp = 3 + 4 * Math.sin(t * 0.0006 + i * 0.5) ** 2 + 26 * pluck[i];
    const freq = 0.006 + 0.004 * noise(i);
    const harmonic = 1 + Math.round(noise(i * 11) * 2);
    const alpha = (0.35 + 0.5 * Math.max(pluck[i], 0.3 * noise(i * 3))) * edgeFade(xBottom, s.left, s.width);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = noise(i * 5) > 0.84 ? c.down : c.up;
    ctx.lineWidth = 0.8 + 1.4 * noise(i * 7) + pluck[i];
    ctx.beginPath();
    for (let k = 0; k <= 48; k++) {
      const v = k / 48;
      const y = bottom + (top - bottom) * v;
      // Стоячая волна: закреплена на концах, колеблется посередине.
      const shape = Math.sin(v * Math.PI) * Math.sin(v * Math.PI * harmonic);
      const x = xBottom + (xTop - xBottom) * v + amp * shape * Math.sin(t * freq * 10 + i);
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Колки сверху и снизу.
    ctx.fillStyle = c.up;
    ctx.globalAlpha = alpha * 0.9;
    ctx.beginPath();
    ctx.arc(xBottom, bottom, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(xTop, top, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
};

export function HeroStrings() {
  const ref = useHeroCanvas(drawStrings);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 8. «Мозаика»: плитки, как тепловая карта рынка; по ним бегут волны яркости; под курсором плитки приподнимаются ── */
const TILE = 24;
const TILE_GAP = 5;

const drawMosaic: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const step = TILE + TILE_GAP;
  const cols = Math.floor(s.width / step);
  const rows = Math.floor(h / step);
  const ox = s.right - cols * step;
  const oy = (h - rows * step) / 2;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = ox + i * step;
      const y = oy + j * step;
      const n = i * 131 + j * 17;
      // Волна идёт наискосок вверх-вправо; к правому верхнему углу плитки ярче — «рост».
      const wave = 0.5 + 0.5 * Math.sin((i - j) * 0.45 - t * 0.0016 + noise(n) * 1.2);
      const trend = clamp01(0.25 + (i / cols) * 0.55 + (1 - j / rows) * 0.3);
      const near = p.s * smooth(clamp01(1 - Math.hypot(x + TILE / 2 - p.x, y + TILE / 2 - p.y) / 110));
      const value = clamp01(wave * trend * (0.6 + 0.6 * noise(n + 3)) + 0.35 * near);
      if (value < 0.08) continue;
      const size = TILE * (0.55 + 0.45 * value) * (1 + 0.25 * near);
      ctx.globalAlpha = (0.12 + 0.75 * value) * edgeFade(x, s.left, s.width);
      ctx.fillStyle = noise(n + 7) > 0.9 ? c.down : c.up;
      ctx.beginPath();
      ctx.roundRect(x + (TILE - size) / 2, y + (TILE - size) / 2, size, size, 4);
      ctx.fill();
    }
  }
};

export function HeroMosaic() {
  const ref = useHeroCanvas(drawMosaic);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}
