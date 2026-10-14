"use client";

import styles from "./HeroCandleWave.module.css";
import { useHeroCanvas, type Draw } from "./HeroCandleScenes";
import { clamp01, edgeFade, smooth, stage } from "./HeroScenesAbstract";

/** Ещё лаконичные сцены: «Пульс», «Сетка», «Стрелка роста», «Тюндюк линией». */

/* ── 13. «Пульс»: одна линия, как кардиограмма рынка, — ровная, с редкими спокойными всплесками ── */
const drawPulse: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const y0 = h * 0.55;
  const x0 = s.left + s.width * 0.02;
  const x1 = s.right - 40;
  const speed = 0.06;
  const beat = 520;
  // Форма всплеска: маленький зубец, большой подъём, провал, возврат.
  const spike = (d: number) => {
    if (d < 0 || d > 60) return 0;
    const k = d / 60;
    return (
      Math.exp(-(((k - 0.15) / 0.05) ** 2)) * 0.18 +
      Math.exp(-(((k - 0.42) / 0.035) ** 2)) * 1 -
      Math.exp(-(((k - 0.55) / 0.04) ** 2)) * 0.45 +
      Math.exp(-(((k - 0.8) / 0.07) ** 2)) * 0.22
    );
  };
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  let first = true;
  for (let x = x0; x <= x1; x += 2) {
    const d = (((x - t * speed) % beat) + beat) % beat;
    const amp = h * 0.22 * (1 + 0.6 * p.s * smooth(clamp01(1 - Math.abs(x - p.x) / 160)));
    const y = y0 - spike(d) * amp;
    if (first) {
      ctx.moveTo(x, y);
      first = false;
    } else ctx.lineTo(x, y);
  }
  const grad = ctx.createLinearGradient(x0, 0, x1, 0);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.25, c.up);
  grad.addColorStop(1, c.up);
  ctx.strokeStyle = grad;
  ctx.globalAlpha = 1;
  ctx.stroke();
  // Точка на правом конце.
  const d = (((x1 - t * speed) % beat) + beat) % beat;
  ctx.fillStyle = c.up;
  ctx.beginPath();
  ctx.arc(x1, y0 - spike(d) * h * 0.22, 4.5, 0, Math.PI * 2);
  ctx.fill();
};

export function HeroPulse() {
  const ref = useHeroCanvas(drawPulse);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 14. «Сетка»: ровная сетка точек, по ней наискосок проходит еле заметная волна ── */
const GRID = 30;

const drawGrid: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const cols = Math.floor(s.width / GRID);
  const rows = Math.floor(h / GRID);
  const ox = s.right - cols * GRID + GRID / 2;
  const oy = (h - rows * GRID) / 2 + GRID / 2;
  ctx.fillStyle = c.up;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = ox + i * GRID;
      const y = oy + j * GRID;
      const wave = Math.max(0, Math.sin((i - j) * 0.32 - t * 0.0012)) ** 6;
      const near = p.s * smooth(clamp01(1 - Math.hypot(x - p.x, y - p.y) / 120));
      const v = Math.max(wave, near);
      ctx.globalAlpha = (0.22 + 0.6 * v) * edgeFade(x, s.left, s.width);
      ctx.beginPath();
      ctx.arc(x, y, 1.4 + 2.2 * v, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

export function HeroGrid() {
  const ref = useHeroCanvas(drawGrid);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 15. «Стрелка роста»: одна тонкая линия-стрелка вверх-вправо прорисовывается, держится и рисуется снова ── */
const drawArrow: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const cycle = 9000;
  const u = (t % cycle) / cycle;
  const drawn = smooth(clamp01(u / 0.4));
  const fade = 1 - smooth(clamp01((u - 0.88) / 0.12));
  // Ломаная с двумя «откатами» — путь рынка, но вверх.
  const pts: [number, number][] = [
    [0.06, 0.82],
    [0.3, 0.6],
    [0.42, 0.68],
    [0.62, 0.42],
    [0.72, 0.5],
    [0.92, 0.18],
  ].map(([x, y]) => [s.left + s.width * x, h * y]);
  const lens = pts.slice(1).map((pt, i) => Math.hypot(pt[0] - pts[i][0], pt[1] - pts[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  let left = total * drawn;
  ctx.strokeStyle = c.up;
  ctx.lineWidth = 2.5 + 1.5 * p.s;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = fade;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  let end = pts[0];
  let dir = 0;
  for (let i = 0; i < lens.length && left > 0; i++) {
    const k = Math.min(1, left / lens[i]);
    end = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    dir = Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]);
    ctx.lineTo(end[0], end[1]);
    left -= lens[i];
  }
  ctx.stroke();
  // Наконечник стрелки.
  if (drawn > 0.02) {
    const head = 16;
    ctx.beginPath();
    ctx.moveTo(end[0] - head * Math.cos(dir - 0.5), end[1] - head * Math.sin(dir - 0.5));
    ctx.lineTo(end[0], end[1]);
    ctx.lineTo(end[0] - head * Math.cos(dir + 0.5), end[1] - head * Math.sin(dir + 0.5));
    ctx.stroke();
  }
  // Точки-узлы на уже пройденных изломах.
  ctx.fillStyle = c.up;
  let passed = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    passed += lens[i - 1];
    if (passed > total * drawn) break;
    ctx.globalAlpha = 0.6 * fade;
    ctx.beginPath();
    ctx.arc(pts[i][0], pts[i][1], 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
};

export function HeroArrow() {
  const ref = useHeroCanvas(drawArrow);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}

/* ── 16. «Тюндюк линией»: символ с флага одной тонкой линией — круг и перекрещенные дуги, медленно вращается ── */
const drawTundukLine: Draw = (ctx, w, h, t, c, p) => {
  const s = stage(w);
  const cx = s.narrow ? w / 2 : s.left + s.width * 0.56;
  const cy = h * 0.5;
  const R = Math.min(s.width * 0.28, h * 0.36);
  const near = p.s * smooth(clamp01(1 - Math.hypot(p.x - cx, p.y - cy) / (R * 1.6)));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 0.00004);
  ctx.strokeStyle = c.up;
  ctx.lineCap = "round";
  ctx.lineWidth = 2 + near;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, R * 1.12, 0, Math.PI * 2);
  ctx.stroke();
  // По три выгнутые перекладины в двух направлениях; выгиб чуть «дышит».
  const breathe = 1 + 0.08 * Math.sin(t * 0.0008);
  ctx.lineWidth = 1.8 + near;
  ctx.globalAlpha = 0.85;
  for (let dir = 0; dir < 2; dir++) {
    for (let k = -1; k <= 1; k++) {
      const off = k * R * 0.42;
      const half = Math.sqrt(R * R - off * off);
      const bend = k * R * 0.16 * breathe;
      ctx.beginPath();
      if (dir === 0) {
        ctx.moveTo(off, -half);
        ctx.quadraticCurveTo(off + bend * 2, 0, off, half);
      } else {
        ctx.moveTo(-half, off);
        ctx.quadraticCurveTo(0, off + bend * 2, half, off);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
};

export function HeroTundukLine() {
  const ref = useHeroCanvas(drawTundukLine);
  return <canvas ref={ref} className={styles.wave} aria-hidden="true" />;
}
