"use client";

import { useRef } from "react";
import styles from "./HeroCandleWave.module.css";
import { noise, useHeroCanvas, type Draw } from "./HeroCandleScenes";

/**
 * Живые сцены баннера без свечей: «Поток капитала», «Рельеф рынка», «Кочкор мүйүз», «Сеть рынка».
 * Движок (цикл, тема, курсор, пауза на заставке и вне экрана) — общий, из HeroCandleScenes.
 */

export function stage(w: number) {
  const narrow = w < 900;
  const left = narrow ? 0 : w * 0.38;
  const right = w;
  return { narrow, left, right, width: right - left };
}
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => x * x * (3 - 2 * x);
/** Плавное появление сцены от текста к правому краю — слева текст баннера остаётся чистым. */
export const edgeFade = (x: number, left: number, width: number) => smooth(clamp01((x - left) / (width * 0.22)));

/* ── 1. «Поток капитала»: сотни тонких линий текут вправо и вверх; курсор закручивает поток ── */
const FLOW_COUNT = 300;
const FLOW_TAIL = 46;
type Flow = { x: number[]; y: number[]; life: number; tone: number };

function useFlowDraw(): Draw {
  const state = useRef<{ list: Flow[]; last: number; w: number; h: number } | null>(null);
  return (ctx, w, h, t, c, p) => {
    const s = stage(w);
    if (!state.current || state.current.w !== w || state.current.h !== h) {
      // Частицы раскиданы по всей сцене сразу — поток виден с первого кадра.
      const list: Flow[] = [];
      for (let i = 0; i < FLOW_COUNT; i++) {
        const x = s.left - 60 + noise(i * 3) * (s.width + 60);
        const y = noise(i * 7 + 1) * h;
        list.push({ x: Array(FLOW_TAIL).fill(x), y: Array(FLOW_TAIL).fill(y), life: noise(i * 11) * 400, tone: noise(i * 13) });
      }
      state.current = { list, last: t, w, h };
    }
    const st = state.current;
    const dt = Math.min(48, Math.max(0, t - st.last));
    st.last = t;
    const speed = dt * 0.075;

    for (let i = 0; i < st.list.length; i++) {
      const f = st.list[i];
      let x = f.x[0];
      let y = f.y[0];
      // Поле направлений: мягкие волны и общий подъём вправо — «рост».
      let a =
        -0.28 +
        0.42 * Math.sin(x * 0.0042 + t * 0.00018) +
        0.36 * Math.cos(y * 0.0063 - t * 0.00013 + x * 0.0012) +
        0.18 * Math.sin((x + y) * 0.009 + t * 0.0004);
      // Курсор: вихрь — направление поворачивается по касательной к окружности вокруг него.
      if (p.s > 0.01) {
        const dx = x - p.x;
        const dy = y - p.y;
        const pull = p.s * smooth(clamp01(1 - Math.hypot(dx, dy) / 190));
        if (pull > 0) a = a * (1 - pull) + (Math.atan2(dy, dx) + Math.PI / 2) * pull;
      }
      x += Math.cos(a) * speed * (0.7 + 0.6 * f.tone);
      y += Math.sin(a) * speed * (0.7 + 0.6 * f.tone);
      f.life += dt * 0.06;
      for (let k = FLOW_TAIL - 1; k > 0; k--) {
        f.x[k] = f.x[k - 1];
        f.y[k] = f.y[k - 1];
      }
      f.x[0] = x;
      f.y[0] = y;
      if (x > w + 20 || y < -40 || y > h + 40 || f.life > 520) {
        const nx = s.left - 40 + noise(i * 17 + Math.floor(t)) * s.width * 0.5;
        const ny = noise(i * 19 + Math.floor(t / 3)) * h;
        f.x.fill(nx);
        f.y.fill(ny);
        f.life = 0;
      }

      const fade = edgeFade(x, s.left, s.width) * clamp01(f.life / 40) * clamp01((520 - f.life) / 60);
      if (fade <= 0.01) continue;
      ctx.globalAlpha = fade * (0.22 + 0.5 * f.tone);
      ctx.strokeStyle = f.tone > 0.88 ? c.down : c.up;
      ctx.lineWidth = 0.7 + f.tone * 1.1;
      ctx.beginPath();
      ctx.moveTo(f.x[0], f.y[0]);
      for (let k = 1; k < FLOW_TAIL; k++) ctx.lineTo(f.x[k], f.y[k]);
      ctx.stroke();
    }
  };
}

export function HeroFlow() {
  const ref = useHeroCanvas(useFlowDraw());
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 2. «Рельеф рынка»: линии высот топографической карты медленно перетекают; под курсором растёт вершина ── */
const TOPO_CELL = 10;
const TOPO_LEVELS = 15;

/** Маленький вспомогательный холст для заливки рельефа (один на страницу, пересоздаётся при смене размера). */
let topoCanvas: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null = null;
function topoBands(cols: number, rows: number) {
  if (!topoCanvas) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    topoCanvas = { canvas, ctx };
  }
  if (topoCanvas.canvas.width !== cols || topoCanvas.canvas.height !== rows) {
    topoCanvas.canvas.width = cols;
    topoCanvas.canvas.height = rows;
  }
  topoCanvas.ctx.clearRect(0, 0, cols, rows);
  return topoCanvas;
}

const drawTopo: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const cols = Math.ceil(s.width / TOPO_CELL) + 1;
  const rows = Math.ceil(h / TOPO_CELL) + 1;
  // Рельеф медленно течёт влево, как время на графике.
  const drift = t * 0.012;
  const height = (x: number, y: number) => {
    const xx = x + drift;
    let v =
      Math.sin(xx * 0.0065 + t * 0.00006) * Math.cos(y * 0.0071 - t * 0.00005) * 0.45 +
      Math.sin((xx + y) * 0.0042) * 0.35 +
      Math.cos(xx * 0.0021 - y * 0.0048 + t * 0.00008) * 0.3 +
      // Общий подъём к правому верхнему углу.
      ((x - s.left) / s.width) * 0.35 -
      (y / h) * 0.2;
    if (p.s > 0.01) v += p.s * 0.9 * Math.exp(-((x - p.x) ** 2 + (y - p.y) ** 2) / (2 * 90 * 90));
    return v;
  };
  const grid = new Float32Array(cols * rows);
  let peak = { v: -Infinity, x: 0, y: 0 };
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = s.left + i * TOPO_CELL;
      const y = j * TOPO_CELL;
      const v = height(x, y);
      grid[j * cols + i] = v;
      // Вершина ищется в спокойной зоне — не у самого края и не у текста.
      if (v > peak.v && x > s.left + s.width * 0.45 && x < s.right - s.width * 0.14 && y > h * 0.26 && y < h * 0.74) peak = { v, x, y };
    }
  }

  // Заливка по высоте, как на карте: низины прозрачные, вершины насыщеннее.
  // Сетка высот рисуется в маленький холст и растягивается со сглаживанием — плавные переходы почти даром.
  const bands = topoBands(cols, rows);
  if (bands) {
    const image = bands.ctx.createImageData(cols, rows);
    const dark = document.documentElement.dataset.theme === "dark";
    for (let k = 0; k < cols * rows; k++) {
      const v = clamp01((grid[k] + 0.9) / 2);
      image.data[k * 4 + 3] = Math.round(255 * v ** 1.6 * (dark ? 0.42 : 0.55));
    }
    bands.ctx.putImageData(image, 0, 0);
    bands.ctx.globalCompositeOperation = "source-in";
    bands.ctx.fillStyle = c.up;
    bands.ctx.fillRect(0, 0, cols, rows);
    bands.ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(bands.canvas, s.left, 0, (cols - 1) * TOPO_CELL + TOPO_CELL, (rows - 1) * TOPO_CELL + TOPO_CELL);
  }

  for (let l = 0; l < TOPO_LEVELS; l++) {
    const level = -0.9 + (l / (TOPO_LEVELS - 1)) * 2;
    const major = l % 4 === 3;
    // Чем выше уровень, тем линия ярче — рельеф читается без заливки.
    ctx.strokeStyle = l === TOPO_LEVELS - 3 ? c.down : c.up;
    ctx.lineWidth = major ? 1.9 : 1;
    ctx.globalAlpha = Math.min(1, (major ? 0.55 : 0.3) + 0.55 * (l / (TOPO_LEVELS - 1)));
    ctx.beginPath();
    // Marching squares: в каждой клетке — отрезок там, где поверхность пересекает уровень.
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = grid[j * cols + i] - level;
        const b = grid[j * cols + i + 1] - level;
        const cc = grid[(j + 1) * cols + i + 1] - level;
        const d = grid[(j + 1) * cols + i] - level;
        const code = (a > 0 ? 8 : 0) | (b > 0 ? 4 : 0) | (cc > 0 ? 2 : 0) | (d > 0 ? 1 : 0);
        if (code === 0 || code === 15) continue;
        const x0 = s.left + i * TOPO_CELL;
        const y0 = j * TOPO_CELL;
        const top: [number, number] = [x0 + (a / (a - b)) * TOPO_CELL, y0];
        const right: [number, number] = [x0 + TOPO_CELL, y0 + (b / (b - cc)) * TOPO_CELL];
        const bottom: [number, number] = [x0 + (d / (d - cc)) * TOPO_CELL, y0 + TOPO_CELL];
        const leftP: [number, number] = [x0, y0 + (a / (a - d)) * TOPO_CELL];
        const seg = (u: [number, number], v: [number, number]) => {
          ctx.moveTo(u[0], u[1]);
          ctx.lineTo(v[0], v[1]);
        };
        switch (code) {
          case 1:
          case 14:
            seg(leftP, bottom);
            break;
          case 2:
          case 13:
            seg(bottom, right);
            break;
          case 3:
          case 12:
            seg(leftP, right);
            break;
          case 4:
          case 11:
            seg(top, right);
            break;
          case 5:
            seg(leftP, top);
            seg(bottom, right);
            break;
          case 6:
          case 9:
            seg(top, bottom);
            break;
          case 7:
          case 8:
            seg(leftP, top);
            break;
          case 10:
            seg(leftP, bottom);
            seg(top, right);
            break;
        }
      }
    }
    ctx.stroke();
  }

  // Отметка вершины: мягкое свечение, точка, крестик и расходящееся кольцо.
  if (Number.isFinite(peak.v)) {
    const glow = ctx.createRadialGradient(peak.x, peak.y, 0, peak.x, peak.y, 90);
    glow.addColorStop(0, c.up);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = glow;
    ctx.fillRect(peak.x - 90, peak.y - 90, 180, 180);
    const pulse = (t * 0.0005) % 1;
    ctx.strokeStyle = c.up;
    ctx.fillStyle = c.up;
    ctx.globalAlpha = (1 - pulse) * 0.6;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(peak.x, peak.y, 6 + pulse * 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(peak.x, peak.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(peak.x - 14, peak.y);
    ctx.lineTo(peak.x - 7, peak.y);
    ctx.moveTo(peak.x + 7, peak.y);
    ctx.lineTo(peak.x + 14, peak.y);
    ctx.moveTo(peak.x, peak.y - 14);
    ctx.lineTo(peak.x, peak.y - 7);
    ctx.stroke();
  }
  // Маска: линии плавно растворяются к тексту слева.
  if (!s.narrow) {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "destination-out";
    const mask = ctx.createLinearGradient(s.left, 0, s.left + s.width * 0.28, 0);
    mask.addColorStop(0, "rgba(0,0,0,1)");
    mask.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = mask;
    ctx.fillRect(s.left - 1, 0, s.width * 0.28 + 2, h);
    ctx.globalCompositeOperation = "source-over";
  }
};

export function HeroTopo() {
  const ref = useHeroCanvas(drawTopo);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 3. «Кочкор мүйүз»: розетка из завитков «рога барана» сама прорисовывается линией и медленно вращается ── */
const HORN_SAMPLES = 46;

/**
 * Пара завитков «рог барана»: из основания вверх, затем через верх наружу и внутрь по спирали.
 * Левый рог считается, правый — его зеркало.
 */
function hornPath(size: number) {
  const center = { x: -size * 0.85, y: -size * 1.05 };
  const r0 = Math.hypot(center.x, center.y);
  const a0 = Math.atan2(-center.y, -center.x);
  const leftHorn: [number, number][] = [];
  for (let k = 0; k <= HORN_SAMPLES; k++) {
    const u = k / HORN_SAMPLES;
    const a = a0 - u * Math.PI * 1.85;
    const r = r0 * (1 - 0.72 * u);
    leftHorn.push([center.x + r * Math.cos(a), center.y + r * Math.sin(a)]);
  }
  return [leftHorn, leftHorn.map(([x, y]) => [-x, y] as [number, number])];
}

const drawHorns: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const cx = s.narrow ? w / 2 : s.left + s.width * 0.5;
  const cy = h * 0.5;
  const R = Math.min(s.width * 0.28, h * 0.32);
  const cycle = 16000;
  const u = (t % cycle) / cycle;
  // Прорисовка: первые 35% цикла линия рисуется, дальше держится, в конце тает и рисуется снова.
  const drawn = smooth(clamp01(u / 0.35));
  const fade = 1 - smooth(clamp01((u - 0.9) / 0.1));
  const near = p.s * smooth(clamp01(1 - Math.hypot(p.x - cx, p.y - cy) / (R * 1.8)));

  const rings = [
    { count: 6, radius: R * 0.5, size: R * 0.2, spin: t * 0.00006, color: c.up, width: 2.6 },
    { count: 12, radius: R * 0.98, size: R * 0.14, spin: -t * 0.00004, color: c.up, width: 2 },
    { count: 4, radius: R * 0.08, size: R * 0.11, spin: t * 0.0001, color: c.down, width: 2.4 },
  ];

  // Тонкие кольца-основания тоже прорисовываются по кругу.
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 1;
  for (const r of [R * 0.42, R * 0.82, R * 1.22]) {
    ctx.globalAlpha = 0.25 * fade;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * drawn);
    ctx.stroke();
  }

  rings.forEach((ring, ri) => {
    const path = hornPath(ring.size * (1 + 0.08 * near));
    for (let k = 0; k < ring.count; k++) {
      const a = (k / ring.count) * Math.PI * 2 + ring.spin;
      const local = clamp01(drawn * 1.4 - (k / ring.count) * 0.4 - ri * 0.08);
      const last = Math.max(1, Math.round(local * HORN_SAMPLES));
      ctx.save();
      ctx.translate(cx + Math.cos(a) * ring.radius, cy + Math.sin(a) * ring.radius);
      ctx.rotate(a + Math.PI / 2);
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = ring.width;
      ctx.lineCap = "round";
      ctx.globalAlpha = Math.min(1, (0.7 + 0.25 * Math.sin(t * 0.001 + k) ** 2 + 0.2 * near) * fade);
      for (const side of path) {
        ctx.beginPath();
        ctx.moveTo(side[0][0], side[0][1]);
        for (let i = 1; i <= last; i++) ctx.lineTo(side[i][0], side[i][1]);
        ctx.stroke();
      }
      // Точка в основании завитка.
      ctx.fillStyle = ring.color;
      ctx.beginPath();
      ctx.arc(0, 2, ring.width * 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });
};

export function HeroHorns() {
  const ref = useHeroCanvas(drawHorns);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 4. «Сеть рынка»: участники — узлы, между ними бегут импульсы-сделки; курсор подключается к ближайшим ── */
const NET_COLS = 9;
const NET_ROWS = 6;

type NetNode = { x: number; y: number; size: number; hub: boolean; far: boolean; flash: number };

const drawNet: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const linkDist = Math.min(200, s.width * 0.24);
  // Узлы на «дрожащей» сетке — распределены ровно, без пустот и скоплений. Два слоя: дальний и ближний.
  const nodes: NetNode[] = [];
  for (let layer = 0; layer < 2; layer++) {
    for (let j = 0; j < NET_ROWS; j++) {
      for (let i = 0; i < NET_COLS; i++) {
        const n = layer * 1000 + j * 50 + i;
        if (noise(n * 7) < 0.18) continue;
        const bx = s.left + s.width * ((i + 0.5 + (noise(n * 3) - 0.5) * 0.8 + layer * 0.5) / NET_COLS);
        const by = h * ((j + 0.5 + (noise(n * 3 + 1) - 0.5) * 0.8) / NET_ROWS);
        let x = bx + Math.sin(t * 0.00022 * (0.6 + noise(n)) + n) * 22;
        let y = by + Math.cos(t * 0.00018 * (0.6 + noise(n + 9)) + n * 1.7) * 18;
        // Ближние узлы слегка тянутся к курсору.
        if (p.s > 0.01 && layer === 1) {
          const pull = p.s * smooth(clamp01(1 - Math.hypot(x - p.x, y - p.y) / 200)) * 0.18;
          x += (p.x - x) * pull;
          y += (p.y - y) * pull;
        }
        if (x > s.right - 10) continue;
        nodes.push({ x, y, size: (layer ? 2.2 : 1.4) + (layer ? 3.6 : 1.6) * noise(n * 3 + 3) ** 2, hub: layer === 1 && noise(n * 3 + 4) > 0.84, far: layer === 0, flash: 0 });
      }
    }
  }

  // Связи и импульсы-сделки: связи только внутри слоя; импульс оставляет короткий след и зажигает узел по прибытии.
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      if (a.far !== b.far) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > linkDist * (a.far ? 0.8 : 1)) continue;
      const strength = 1 - d / linkDist;
      const fade = edgeFade(Math.min(a.x, b.x), s.left, s.width) * (a.far ? 0.45 : 1);
      ctx.globalAlpha = 0.3 * strength * fade;
      ctx.strokeStyle = c.up;
      ctx.lineWidth = a.far ? 0.7 : 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      if (a.far) continue;
      const id = i * 131 + j;
      if (noise(id) > 0.28) continue;
      const period = 2400 + 2600 * noise(id + 1);
      const k = ((t + noise(id + 2) * period) % period) / period;
      const forward = noise(id + 3) > 0.5;
      const q = forward ? k : 1 - k;
      const tail = forward ? Math.max(0, k - 0.18) : Math.min(1, 1 - k + 0.18);
      const color = noise(id + 4) > 0.8 ? c.down : c.up;
      const px = a.x + (b.x - a.x) * q;
      const py = a.y + (b.y - a.y) * q;
      // След импульса.
      const trail = ctx.createLinearGradient(a.x + (b.x - a.x) * tail, a.y + (b.y - a.y) * tail, px, py);
      trail.addColorStop(0, "rgba(0,0,0,0)");
      trail.addColorStop(1, color);
      ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9 * fade;
      ctx.strokeStyle = trail;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.x + (b.x - a.x) * tail, a.y + (b.y - a.y) * tail);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, 2.4, 0, Math.PI * 2);
      ctx.fill();
      // Сделка дошла — узел вспыхивает.
      if (k > 0.85) (forward ? b : a).flash = Math.max((forward ? b : a).flash, (k - 0.85) / 0.15);
    }
  }

  // Курсор — ещё один участник: тянет связи к ближайшим узлам.
  if (p.s > 0.01) {
    for (const n of nodes) {
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d > linkDist * 1.2) continue;
      ctx.globalAlpha = p.s * 0.6 * (1 - d / (linkDist * 1.2));
      ctx.strokeStyle = c.up;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(n.x, n.y);
      ctx.stroke();
    }
    ctx.globalAlpha = p.s;
    ctx.fillStyle = c.up;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Узлы: дальние бледнее и мельче; крупные «хабы» с мягко пульсирующим кольцом; вспышка — при приходе сделки.
  nodes.forEach((n, i) => {
    const fade = edgeFade(n.x, s.left, s.width) * (n.far ? 0.45 : 1);
    const near = n.far ? 0 : p.s * smooth(clamp01(1 - Math.hypot(n.x - p.x, n.y - p.y) / 160));
    if (n.flash > 0) {
      ctx.globalAlpha = (1 - n.flash) * 0.7 * fade;
      ctx.strokeStyle = c.up;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.size + 3 + n.flash * 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = Math.min(1, (0.6 + 0.4 * near + 0.4 * n.flash) * fade);
    ctx.fillStyle = c.up;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.size * (1 + 0.4 * near + 0.3 * n.flash), 0, Math.PI * 2);
    ctx.fill();
    // Ореол — только в тёмной теме: на светлом фоне он выглядит серым пятном.
    if (n.hub && document.documentElement.dataset.theme === "dark") {
      const halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 26);
      halo.addColorStop(0, c.up);
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = 0.22 * fade;
      ctx.fillStyle = halo;
      ctx.fillRect(n.x - 26, n.y - 26, 52, 52);
    }
    if (n.hub) {
      const pulse = (t * 0.0005 + noise(i)) % 1;
      ctx.globalAlpha = (1 - pulse) * 0.5 * fade;
      ctx.strokeStyle = c.up;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.size + 4 + pulse * 22, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  // Подписи у крупных узлов: тикеры бумаг КФБ и изменение цены — сразу видно, что это биржа.
  const font = getComputedStyle(document.body).fontFamily || "sans-serif";
  let label = 0;
  nodes.forEach((n, i) => {
    if (!n.hub || n.far) return;
    const fade = edgeFade(n.x, s.left, s.width);
    if (fade < 0.3 || n.x > s.right - 80) return;
    const ticker = NET_TICKERS[label++ % NET_TICKERS.length];
    // Изменение цены медленно «плавает», знак — стабильный для узла.
    const base = (noise(i * 17) - 0.35) * 3.2;
    const change = base + Math.sin(t * 0.0004 + i) * 0.15;
    const up = change >= 0;
    const x = n.x + n.size + 8;
    const y = n.y - n.size - 4;
    ctx.globalAlpha = 0.9 * fade;
    ctx.font = `600 11px ${font}`;
    ctx.fillStyle = c.up;
    ctx.fillText(ticker, x, y);
    const width = ctx.measureText(ticker).width;
    ctx.font = `500 10px ${font}`;
    ctx.fillStyle = up ? c.up : c.down;
    ctx.fillText(`${up ? "▲" : "▼"} ${Math.abs(change).toFixed(1).replace(".", ",")}%`, x + width + 5, y);
  });
};

const NET_TICKERS = ["KTEL", "KAKB", "MAIR", "KNEF", "ELST", "NESK", "KKNT", "OPTM", "KMZT", "SALM"];

export function HeroNet() {
  const ref = useHeroCanvas(drawNet);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}
