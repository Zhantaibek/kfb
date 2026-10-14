"use client";

import styles from "./HeroCandleWave.module.css";
import { candle, noise, useHeroCanvas, type Draw } from "./HeroCandleScenes";

/**
 * Новые живые сцены баннера: «Түндүк», «Спираль роста», «Нарастание», «Биржевой стакан».
 * Движок (цикл, тема, курсор, пауза на заставке) — общий, из HeroCandleScenes.
 */

/** Правая часть баннера — слева текст и кнопки. На узком экране сцена на всю ширину. */
function stage(w: number, h: number) {
  const narrow = w < 900;
  const left = narrow ? 12 : w * 0.42;
  const right = w - (narrow ? 12 : 40);
  return { narrow, left, right, top: h * 0.1, bottom: h * 0.9, width: right - left };
}

const smooth = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const isDark = () => document.documentElement.dataset.theme === "dark";

/** Мягкое белое пятно под курсором — общий отклик всех сцен. */
function pointerLight(ctx: CanvasRenderingContext2D, p: { x: number; y: number; s: number }, reach: number) {
  if (p.s < 0.01) return;
  const light = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, reach);
  light.addColorStop(0, "#ffffff");
  light.addColorStop(1, "rgba(255,255,255,0)");
  ctx.globalAlpha = (isDark() ? 0.16 : 0.5) * p.s;
  ctx.fillStyle = light;
  ctx.fillRect(p.x - reach, p.y - reach, reach * 2, reach * 2);
  ctx.globalAlpha = 1;
}

/* ── 1. «Түндүк»: солнце с флага — 40 лучей-свечей, в центре тюндюк, решётка которого собрана из свечей ── */
const RAYS = 40;

const drawTunduk: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w, h);
  const cx = s.narrow ? w / 2 : s.left + s.width * 0.52;
  const cy = h * 0.5;
  const R = Math.min(s.width * 0.33, h * 0.34);
  pointerLight(ctx, p, R * 1.6);

  // Лучи: медленно вращаются, длина бежит волной по кругу; у курсора — длиннее и ярче.
  const spin = t * 0.000035;
  const pointerAngle = Math.atan2(p.y - cy, p.x - cx);
  for (let i = 0; i < RAYS; i++) {
    const a = (i / RAYS) * Math.PI * 2 + spin;
    const wave = 0.5 + 0.5 * Math.sin(t * 0.0011 - i * 0.62);
    const toward = p.s * Math.max(0, Math.cos(a - pointerAngle)) ** 6;
    const len = R * (0.2 + 0.16 * wave + 0.28 * toward) * (0.85 + 0.3 * noise(i + 7));
    const up = i % 5 !== 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a + Math.PI / 2);
    ctx.globalAlpha = 0.55 + 0.35 * wave + 0.1 * toward;
    const base = R * 1.06;
    candle(ctx, 0, -base - len, -base, -base - len - 5 - 6 * noise(i + 3), -base + 4, 6 + 3 * toward, up ? c.up : c.down, c.wick);
    ctx.restore();
  }

  // Кольцо и диск.
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.96, 0, Math.PI * 2);
  ctx.stroke();
  const r = R * 0.62;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Решётка тюндюка: по три изогнутых перекладины в двух направлениях, каждая — цепочка маленьких свечей.
  for (let dir = 0; dir < 2; dir++) {
    for (let k = -1; k <= 1; k++) {
      const offset = k * r * 0.42;
      const half = Math.sqrt(Math.max(0, r * r - offset * offset));
      const steps = Math.round((half * 2) / 8);
      for (let j = 1; j < steps; j++) {
        const u = j / steps;
        const along = -half + u * half * 2;
        // Перекладины чуть выгнуты, как у настоящего тюндюка.
        const bend = (k === 0 ? 0 : k * r * 0.12) * Math.sin(u * Math.PI);
        const x = dir === 0 ? cx + offset + bend : cx + along;
        const y = dir === 0 ? cy + along : cy + offset + bend;
        const n = dir * 1000 + (k + 1) * 100 + j;
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.0018 - u * 7 - dir * 1.7 - k);
        const tall = 5 + 12 * pulse * (0.6 + 0.4 * noise(n));
        ctx.globalAlpha = 0.6 + 0.4 * pulse;
        candle(ctx, x, y - tall / 2, y + tall / 2, y - tall / 2 - 2, y + tall / 2 + 2, 4.5, noise(n + 5) > 0.22 ? c.up : c.down, c.wick);
      }
    }
  }
};

export function HeroCandleTunduk() {
  const ref = useHeroCanvas(drawTunduk);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 2. «Спираль роста»: две нити свечей закручены в объёмную спираль, она вращается и поднимается вправо ── */
const HELIX = 34;
type HelixDot = { x: number; y: number; z: number; strand: number; i: number };

const drawHelix: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w, h);
  const step = s.width / (HELIX - 1);
  const amp = h * 0.24;
  pointerLight(ctx, p, 220);

  const dots: HelixDot[] = [];
  for (let i = 0; i < HELIX; i++) {
    const x = s.left + i * step;
    // Ось спирали поднимается слева направо — рост.
    const axis = h * 0.62 - (i / (HELIX - 1)) * h * 0.24;
    // У курсора спираль раскрывается шире.
    const near = p.s * smooth(clamp01(1 - Math.abs(x - p.x) / 200));
    const a = amp * (1 + 0.45 * near) * (0.75 + 0.25 * Math.sin(i * 0.35 + t * 0.0005));
    const theta = i * 0.5 - t * 0.00075;
    for (let strand = 0; strand < 2; strand++) {
      const th = theta + strand * Math.PI;
      dots.push({ x, y: axis + a * Math.sin(th), z: Math.cos(th), strand, i });
    }
  }

  // Перемычки между нитями — тонкие, как ступени.
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < HELIX; i += 1) {
    const a = dots[i * 2];
    const b = dots[i * 2 + 1];
    ctx.globalAlpha = 0.1 + 0.18 * ((a.z + b.z) / 2 + 1) / 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  // Сначала дальние свечи, потом ближние — объём без размытия.
  dots.sort((a, b) => a.z - b.z);
  for (const d of dots) {
    const depth = (d.z + 1) / 2;
    const n = d.i * 3 + d.strand;
    const near = p.s * smooth(clamp01(1 - Math.hypot(d.x - p.x, d.y - p.y) / 160));
    const tall = (14 + 20 * noise(n + 11)) * (0.55 + 0.45 * depth) * (1 + 0.3 * near);
    const width = (3 + 11 * depth) * (1 + 0.3 * near);
    ctx.globalAlpha = Math.min(1, 0.12 + 0.88 * depth ** 1.5 + 0.3 * near);
    candle(ctx, d.x, d.y - tall / 2, d.y + tall / 2, d.y - tall / 2 - 6 * depth, d.y + tall / 2 + 5 * depth, width, d.strand === 0 ? c.up : c.down, c.wick);
  }
};

export function HeroCandleHelix() {
  const ref = useHeroCanvas(drawHelix);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 3. «Нарастание»: частицы падают и складываются в свечи, график строится, затем рассыпается и собирается заново ── */
const BUILD_COLS = 16;
const BUILD_PERIOD = 17000;
const BUILD_STEP = 560;
const BUILD_FILL = 1100;
const BUILD_FADE = 2600;

const drawBuild: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w, h);
  const cycle = Math.floor(t / BUILD_PERIOD);
  const u = t % BUILD_PERIOD;
  const step = s.width / BUILD_COLS;
  const bodyW = Math.min(20, step * 0.55);
  pointerLight(ctx, p, 200);

  // Цены цикла: случайное блуждание с уклоном вверх — каждый цикл свой график.
  const opens: number[] = [];
  const closes: number[] = [];
  let price = 0.25 + 0.15 * noise(cycle * 7);
  for (let i = 0; i < BUILD_COLS; i++) {
    opens.push(price);
    price = clamp01(price + (noise(cycle * 131 + i * 17) - 0.38) * 0.16);
    closes.push(price);
  }
  const yOf = (v: number) => s.bottom - v * (s.bottom - s.top) * 0.85;
  const fade = clamp01((u - (BUILD_PERIOD - BUILD_FADE)) / BUILD_FADE);

  // Линия тренда по закрытиям — проявляется, когда график построен.
  const built = clamp01((u - (500 + BUILD_STEP * BUILD_COLS + BUILD_FILL)) / 900);
  if (built > 0 && fade < 1) {
    ctx.globalAlpha = 0.35 * built * (1 - fade);
    ctx.strokeStyle = c.up;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    closes.forEach((v, i) => {
      const x = s.left + (i + 0.5) * step;
      if (i === 0) ctx.moveTo(x, yOf(v));
      else ctx.lineTo(x, yOf(v));
    });
    ctx.stroke();
  }

  for (let i = 0; i < BUILD_COLS; i++) {
    const x = s.left + (i + 0.5) * step;
    const up = closes[i] >= opens[i];
    const color = up ? c.up : c.down;
    const top = yOf(Math.max(opens[i], closes[i]));
    const bottom = Math.max(yOf(Math.min(opens[i], closes[i])), top + 3);
    const start = 500 + i * BUILD_STEP;
    const g = clamp01((u - start) / BUILD_FILL);
    // Рассыпаются по очереди слева направо.
    const gone = clamp01(fade * 1.6 - (i / BUILD_COLS) * 0.6);
    const near = p.s * smooth(clamp01(1 - Math.abs(x - p.x) / 140));

    // Падающие частицы, пока свеча набирается.
    if (g > 0 && g < 1) {
      ctx.fillStyle = color;
      const fillTop = bottom - (bottom - top) * g;
      for (let j = 0; j < 9; j++) {
        const local = ((u - start + j * 130) % 520) / 520;
        const y = s.top - 30 + (fillTop - s.top + 30) * local * local;
        const jitter = (noise(i * 37 + j) - 0.5) * bodyW * 1.4;
        ctx.globalAlpha = 0.25 + 0.6 * local;
        ctx.beginPath();
        ctx.arc(x + jitter * (1 - local), y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Рассыпание: частицы поднимаются из тела свечи.
    if (gone > 0 && gone < 1) {
      ctx.fillStyle = color;
      for (let j = 0; j < 10; j++) {
        const rise = gone * (60 + 90 * noise(i * 53 + j));
        const y = top + (bottom - top) * noise(i * 71 + j) - rise;
        const x2 = x + (noise(i * 91 + j) - 0.5) * bodyW * (1 + gone * 3);
        ctx.globalAlpha = (1 - gone) * 0.8;
        ctx.beginPath();
        ctx.arc(x2, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (g <= 0 || gone >= 1) continue;
    const fillTop = bottom - (bottom - top) * smooth(g);
    const wickIn = clamp01((g - 0.7) / 0.3);
    const wickTop = top - (8 + 10 * noise(cycle + i * 3)) * wickIn;
    const wickBottom = bottom + (6 + 8 * noise(cycle + i * 5)) * wickIn;
    ctx.globalAlpha = Math.min(1, (0.85 + 0.15 * near) * (1 - gone));
    candle(ctx, x, fillTop, bottom, Math.min(wickTop, fillTop), Math.max(wickBottom, bottom), bodyW * (1 + 0.25 * near), color, c.wick);
  }
};

export function HeroCandleBuild() {
  const ref = useHeroCanvas(drawBuild);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 4. «Биржевой стакан»: заявки на продажу сверху и на покупку снизу дышат, по линии цены бежит свечной график ── */
const BOOK_ROWS = 9;

const drawBook: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w, h);
  const mid = h * 0.5 + Math.sin(t * 0.00028) * h * 0.035;
  const rowH = (s.bottom - s.top) / (BOOK_ROWS * 2 + 1.5);
  const bookRight = s.right;
  const maxBar = s.width * 0.5;
  pointerLight(ctx, p, 200);

  // Ленты заявок: продажа (сверху) и покупка (снизу), ширина «дышит», у курсора — ярче.
  for (let side = 0; side < 2; side++) {
    for (let r = 0; r < BOOK_ROWS; r++) {
      const n = side * 50 + r;
      const y = side === 0 ? mid - (r + 1.25) * rowH : mid + (r + 0.25) * rowH;
      const depth = 0.35 + 0.65 * ((r + 1) / BOOK_ROWS) ** 0.7;
      const breathe = 0.82 + 0.18 * Math.sin(t * (0.0009 + 0.0004 * noise(n)) + n);
      const near = p.s * smooth(clamp01(1 - Math.abs(y + rowH / 2 - p.y) / (rowH * 2.5)));
      const width = maxBar * depth * (0.55 + 0.45 * noise(n + 9)) * breathe * (1 + 0.15 * near);
      ctx.globalAlpha = 0.18 + 0.22 * (1 - r / BOOK_ROWS) + 0.35 * near;
      ctx.fillStyle = side === 0 ? c.down : c.up;
      ctx.beginPath();
      ctx.roundRect(bookRight - width, y + rowH * 0.18, width, rowH * 0.64, 3);
      ctx.fill();
    }
  }

  // Линия цены.
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.moveTo(s.left, mid);
  ctx.lineTo(bookRight, mid);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.fillStyle = c.up;
  ctx.beginPath();
  ctx.arc(bookRight - 4, mid, 4 + Math.sin(t * 0.004) * 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Свечной график вдоль линии цены: непрерывно едет влево и уходит в прозрачность.
  const step = 26;
  const speed = 0.02;
  const shift = (t * speed) % step;
  const base = Math.floor((t * speed) / step);
  const chartRight = s.left + s.width * 0.56;
  const count = Math.ceil((chartRight - s.left) / step) + 1;
  // Цена — функция номера свечи, а не накопленная сумма: при прокрутке свечи не перескакивают.
  const level = (n: number) => rowH * 2.6 * (0.7 * Math.sin(n * 0.37) + 0.9 * Math.sin(n * 0.11 + 1.3) + 0.8 * (noise(n) - 0.5));
  for (let k = 0; k < count; k++) {
    const x = chartRight - k * step - shift;
    if (x < s.left - 10) break;
    const close = mid + level(base - k);
    const open = mid + level(base - k - 1);
    const up = close <= open;
    const edge = clamp01((x - s.left) / (s.width * 0.18));
    const near = p.s * smooth(clamp01(1 - Math.hypot(x - p.x, close - p.y) / 120));
    const n = base - k;
    ctx.globalAlpha = edge * (0.75 + 0.25 * near);
    candle(
      ctx,
      x,
      Math.min(open, close),
      Math.max(open, close),
      Math.min(open, close) - 4 - 8 * noise(n + 3),
      Math.max(open, close) + 4 + 7 * noise(n + 4),
      12 * (1 + 0.3 * near),
      up ? c.up : c.down,
      c.wick,
    );
  }
};

export function HeroCandleBook() {
  const ref = useHeroCanvas(drawBook);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}
