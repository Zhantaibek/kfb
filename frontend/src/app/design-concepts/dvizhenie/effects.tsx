"use client";

import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import css from "./dvizhenie.module.css";

/*
 * Библиотека анимаций КФБ: каждый эффект — отдельный экспорт, стили — в dvizhenie.module.css.
 * Зависимостей нет (только React, CSS и canvas). При prefers-reduced-motion эффекты показывают итоговое состояние.
 */

export type Paper = { ticker: string; name: string; type: string; price: number; volume: number };
export type Step = { title: string; text: string };

const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const money = (value: number, digits = 2) =>
  new Intl.NumberFormat("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value).replace(/\s/g, " ");

/** Виден ли элемент: анимации работают только на экране и не тратят ресурсы за его пределами. */
function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold });
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

/* ---------- Цифры-барабаны ---------- */

/** Число на барабанах: каждая цифра прокручивается к новому значению. intro — первая прокрутка при появлении. */
export function Odometer({ text, intro = false }: { text: string; intro?: boolean }) {
  return (
    <span className={css.odo}>
      <span className={css.sr}>{text}</span>
      {[...text].map((char, i) =>
        /\d/.test(char) ? (
          // Ключ — позиция с конца: при смене длины числа разряды остаются на своих барабанах.
          <span key={text.length - i} className={css.odoCol} aria-hidden="true">
            <span className={intro ? css.odoIntro : undefined} style={{ "--d": char, "--i": i } as CSSProperties}>
              {"0123456789".split("").map((digit) => (
                <span key={digit}>{digit}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={text.length - i} aria-hidden="true">
            {char}
          </span>
        ),
      )}
    </span>
  );
}

/* ---------- 1. Индекс-хребет ---------- */

const W = 1600;
const H = 900;

/** Декоративный дальний хребет: сумма синусов с острыми вершинами, без случайных чисел — одинаков на сервере и в браузере. */
function farRidge(seed: number, base: number, amp: number) {
  const points = Array.from({ length: 41 }, (_, i) => {
    const x = (i / 40) * W;
    const wave = Math.abs(Math.sin(i * 0.37 + seed)) * 0.6 + Math.abs(Math.sin(i * 0.91 + seed * 2.3)) * 0.3 + Math.abs(Math.sin(i * 1.73 + seed * 0.7)) * 0.1;
    return `${x.toFixed(1)},${(base - wave * amp).toFixed(1)}`;
  });
  return `M0,${H} L${points.join(" L")} L${W},${H} Z`;
}

/** Передний хребет — настоящий ряд индекса: вершины этих гор и есть значения последних сессий. */
function indexRidge(values: number[]) {
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const points = values.map((value, i) => [(i / (values.length - 1 || 1)) * 1470, 866 - ((value - min) / span) * 190] as const);
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L");
  const end = points.at(-1) ?? [1470, 760];
  return { line: `M${line}`, fill: `M0,${H} L${line} L${W},${(end[1] + 40).toFixed(1)} L${W},${H} Z`, end };
}

const stars = Array.from({ length: 46 }, (_, i) => ({
  x: (i * 389) % W,
  y: (i * 137) % 420,
  r: 0.8 + (i % 3) * 0.5,
  delay: (i % 7) * 0.6,
}));

/** Первый экран: хребет с гравюры превращается в график — линия индекса рисуется, горы поднимаются и следуют за курсором. */
export function RidgeHero({ values, children }: { values: number[]; children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const ridge = useMemo(() => indexRidge(values.length > 1 ? values : [1, 1]), [values]);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !stage.current) return;
    const box = stage.current.getBoundingClientRect();
    stage.current.style.setProperty("--mx", ((event.clientX - box.left) / box.width - 0.5).toFixed(3));
    stage.current.style.setProperty("--my", ((event.clientY - box.top) / box.height - 0.5).toFixed(3));
  };

  return (
    <div ref={stage} className={css.ridge} onPointerMove={onMove}>
      <svg className={css.ridgeArt} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="dv-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1c5a63" stopOpacity="0.7" />
            <stop offset="1" stopColor="#071518" />
          </linearGradient>
          <radialGradient id="dv-sun">
            <stop offset="0" stopColor="#ffd9a0" />
            <stop offset="0.35" stopColor="#f2b35e" stopOpacity="0.55" />
            <stop offset="1" stopColor="#f2b35e" stopOpacity="0" />
          </radialGradient>
        </defs>
        {stars.map((star) => (
          <circle key={`${star.x}-${star.y}`} className={css.star} cx={star.x} cy={star.y} r={star.r} style={{ animationDelay: `${star.delay}s` }} />
        ))}
        <circle className={css.sun} cx="1180" cy="430" r="300" fill="url(#dv-sun)" />
        <path className={`${css.layer} ${css.layerFar}`} d={farRidge(1.2, 640, 300)} />
        <path className={`${css.layer} ${css.layerMid}`} d={farRidge(3.4, 730, 240)} />
        <g className={`${css.layer} ${css.layerFront}`}>
          <path className={css.ridgeFill} d={ridge.fill} fill="url(#dv-front)" />
          <path className={css.ridgeLine} d={ridge.line} pathLength={1} />
          <circle className={css.ridgePing} cx={ridge.end[0]} cy={ridge.end[1]} r="9" />
          <circle className={css.ridgeDot} cx={ridge.end[0]} cy={ridge.end[1]} r="7" />
        </g>
      </svg>
      <div className={css.ridgeBody}>{children}</div>
    </div>
  );
}

/* ---------- 2. Табло ---------- */

const FLAPS = " 0123456789,.+-%ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ROWS = 6;

function flapRow(paper: Paper) {
  return `${paper.ticker.slice(0, 7).padEnd(7)} ${money(paper.price).padStart(10)} ${money(paper.volume, 0).padStart(8)}`;
}

/** Следующая пластина на пути к нужному символу; символа нет в наборе — ставим сразу. */
function nextFlap(current: string, target: string) {
  if (current === target) return current;
  const at = FLAPS.indexOf(current);
  if (at < 0 || !FLAPS.includes(target)) return target;
  return FLAPS[(at + 1) % FLAPS.length];
}

function FlapCell({ char, from }: { char: string; from: string }) {
  return (
    <span className={css.flap}>
      <span className={css.flapUp}>
        <span>{char}</span>
      </span>
      <span className={css.flapDown}>
        <span>{from}</span>
      </span>
      {char === from ? null : (
        <>
          <span key={`u${from}`} className={`${css.flapUp} ${css.flipUp}`}>
            <span>{from}</span>
          </span>
          <span key={`d${char}`} className={`${css.flapDown} ${css.flipDown}`}>
            <span>{char}</span>
          </span>
        </>
      )}
    </span>
  );
}

/** Котировки на вокзальном табло: пластины перелистываются до нужного символа, страницы бумаг сменяются сами. */
export function FlapBoard({ papers }: { papers: Paper[] }) {
  const pages = useMemo(() => {
    const list = [];
    for (let i = 0; i < papers.length; i += ROWS) list.push(papers.slice(i, i + ROWS));
    return list;
  }, [papers]);
  const [ref, inView] = useInView<HTMLDivElement>();
  const [page, setPage] = useState(0);
  const [board, setBoard] = useState(() => {
    const rows = (pages[0] ?? []).map(flapRow);
    return { rows, prev: rows };
  });

  useEffect(() => {
    if (!inView || pages.length < 2 || calm()) return;
    // Первая смена — почти сразу, чтобы табло ожило, как только его увидели.
    const turn = () => setPage((current) => (current + 1) % pages.length);
    let timer = 0;
    const first = window.setTimeout(() => {
      turn();
      timer = window.setInterval(turn, 7000);
    }, 900);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [inView, pages.length]);

  useEffect(() => {
    const target = (pages[page] ?? []).map(flapRow);
    const timer = window.setInterval(() => {
      setBoard(({ rows }) => {
        const next = target.map((row, r) => [...row].map((char, c) => nextFlap(rows[r]?.[c] ?? " ", char)).join(""));
        if (next.join() === rows.join()) window.clearInterval(timer);
        return { rows: next, prev: rows };
      });
    }, 80);
    return () => window.clearInterval(timer);
  }, [page, pages]);

  const shown = pages[page] ?? [];

  return (
    <div ref={ref} className={css.board}>
      <p className={css.sr}>{shown.map((paper) => `${paper.ticker}: ${money(paper.price)} сом`).join("; ")}</p>
      <div aria-hidden="true">
        <p className={css.boardHead}>
          <span>Бумага</span>
          <span>Цена, сом</span>
          <span>Оборот, сом</span>
        </p>
        {board.rows.map((row, r) => (
          <div key={r} className={css.flapRow}>
            {[...row].map((char, c) => (
              <FlapCell key={c} char={char} from={board.prev[r]?.[c] ?? char} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 3. Частицы ---------- */

type Dot = { x: number; y: number; vx: number; vy: number; tx: number; ty: number };

/** Слова из тысяч частиц: собираются, рассыпаются при смене, разлетаются от курсора. Клик — следующее слово. */
export function ParticleWord({ words }: { words: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-brand").trim() || "sans-serif";
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const still = calm();
    const dots: Dot[] = [];
    const pointer = { x: -9999, y: -9999 };
    let width = 0;
    let height = 0;
    let word = 0;
    let frame = 0;
    let timer = 0;
    let visible = false;

    const sample = (text: string) => {
      const paper = document.createElement("canvas");
      paper.width = width;
      paper.height = height;
      const pen = paper.getContext("2d", { willReadFrequently: true });
      if (!pen || !width || !height) return [];
      let size = height * 0.72;
      pen.font = `800 ${size}px ${family}`;
      size = Math.min(size, (size * width * 0.92) / pen.measureText(text).width);
      pen.font = `800 ${size}px ${family}`;
      pen.textAlign = "center";
      pen.textBaseline = "middle";
      pen.fillText(text, width / 2, height / 2);
      const { data } = pen.getImageData(0, 0, width, height);
      const gap = Math.max(3, Math.round(Math.sqrt(width * height) / 150));
      const points: [number, number][] = [];
      for (let y = 0; y < height; y += gap) {
        for (let x = 0; x < width; x += gap) {
          if (data[(y * width + x) * 4 + 3] > 128) points.push([x, y]);
        }
      }
      return points;
    };

    const shape = () => {
      const points = sample(words[word % words.length]);
      if (!points.length) return;
      while (dots.length < points.length) dots.push({ x: Math.random() * width, y: Math.random() * height, vx: 0, vy: 0, tx: 0, ty: 0 });
      dots.length = points.length;
      // Частицы перемешаны: при смене слова каждая летит в другой конец надписи, а не сдвигается на пару пикселей.
      for (let i = points.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [points[i], points[j]] = [points[j], points[i]];
      }
      dots.forEach((dot, i) => {
        [dot.tx, dot.ty] = points[i];
        if (still) [dot.x, dot.y] = points[i];
      });
    };

    const paint = () => {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      for (const [color, odd] of [["#8fe0e6", 0], ["#ffffff", 1]] as const) {
        ctx.fillStyle = color;
        for (let i = odd; i < dots.length; i += 2) ctx.fillRect(dots[i].x, dots[i].y, 2.2, 2.2);
      }
    };

    const step = () => {
      for (const dot of dots) {
        const dx = dot.x - pointer.x;
        const dy = dot.y - pointer.y;
        const near = dx * dx + dy * dy;
        if (near < 8100) {
          const push = (8100 - near) / 8100;
          dot.vx += (dx / (Math.sqrt(near) + 1)) * push * 5;
          dot.vy += (dy / (Math.sqrt(near) + 1)) * push * 5;
        }
        dot.vx = (dot.vx + (dot.tx - dot.x) * 0.05) * 0.84;
        dot.vy = (dot.vy + (dot.ty - dot.y) * 0.05) * 0.84;
        dot.x += dot.vx;
        dot.y += dot.vy;
      }
      paint();
      frame = requestAnimationFrame(step);
    };

    const next = () => {
      word += 1;
      shape();
      if (still) paint();
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      shape();
      if (still) paint();
    };

    const onMove = (event: globalThis.PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      pointer.x = event.clientX - box.left;
      pointer.y = event.clientY - box.top;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };

    const sizes = new ResizeObserver(resize);
    const watch = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frame);
      window.clearInterval(timer);
      if (!visible || still) return;
      frame = requestAnimationFrame(step);
      timer = window.setInterval(next, 4600);
    });
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("click", next);
    // Надпись рисуем уже загруженным фирменным шрифтом, иначе первое слово соберётся системным.
    void document.fonts.ready.then(() => {
      sizes.observe(canvas);
      watch.observe(canvas);
    });

    return () => {
      sizes.disconnect();
      watch.disconnect();
      cancelAnimationFrame(frame);
      window.clearInterval(timer);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", next);
    };
  }, [words]);

  return <canvas ref={canvasRef} className={css.particles} role="img" aria-label={words.join(", ")} />;
}

/* ---------- 4. Живой рейтинг ---------- */

const orders = [
  { id: "price", label: "По цене", value: (paper: Paper) => paper.price, text: (paper: Paper) => `${money(paper.price)} сом` },
  { id: "volume", label: "По обороту", value: (paper: Paper) => paper.volume, text: (paper: Paper) => `${money(paper.volume, 0)} сом` },
];

/** Рейтинг бумаг: при смене сортировки строки переезжают на новые места, полосы меняют длину. */
export function LiveRank({ papers }: { papers: Paper[] }) {
  const [orderId, setOrderId] = useState(orders[0].id);
  const order = orders.find((item) => item.id === orderId) ?? orders[0];
  const ranked = [...papers].sort((a, b) => order.value(b) - order.value(a));
  // Корень сжимает разброс: самая дорогая бумага не превращает остальные полосы в точки.
  const top = Math.sqrt(order.value(ranked[0] ?? papers[0]) || 1);

  return (
    <div className={css.rank}>
      <div className={css.rankTabs}>
        {orders.map((item) => (
          <button key={item.id} type="button" aria-pressed={item.id === orderId} onClick={() => setOrderId(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      <ol className={css.rankList} style={{ "--rows": papers.length } as CSSProperties}>
        {papers.map((paper) => {
          const place = ranked.indexOf(paper);
          return (
            <li key={paper.ticker} style={{ "--place": place, "--bar": Math.sqrt(order.value(paper)) / top } as CSSProperties}>
              <span className={css.rankPlace}>{place + 1}</span>
              <span className={css.rankName}>
                <b>{paper.ticker}</b>
                <small>{paper.name}</small>
              </span>
              <span className={css.rankBar} />
              <span className={css.rankValue}>{order.text(paper)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------- 5. Тропа инвестора ---------- */

const path: [number, number][] = [
  [50, 610], [230, 566], [140, 508], [350, 470], [262, 408], [486, 376], [404, 306], [620, 286], [546, 214], [730, 186], [672, 122], [812, 66],
];
const legs = path.slice(1).map(([x, y], i) => Math.hypot(x - path[i][0], y - path[i][1]));
const total = legs.reduce((sum, leg) => sum + leg, 0);
const stations = [0.14, 0.42, 0.7, 1];

/** Точка на серпантине: t = 0 у подножия, t = 1 на вершине. */
function pointAt(t: number): [number, number] {
  let left = t * total;
  for (let i = 0; i < legs.length; i++) {
    if (left <= legs[i]) {
      const k = legs[i] ? left / legs[i] : 0;
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k];
    }
    left -= legs[i];
  }
  return path[path.length - 1];
}

/** Шаги инвестора — подъём в гору: прокрутка ведёт точку по серпантину, а небо светлеет к вершине. */
export function Trail({ steps }: { steps: Step[] }) {
  const section = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (calm()) {
      const frame = requestAnimationFrame(() => setProgress(1));
      return () => cancelAnimationFrame(frame);
    }
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = section.current?.getBoundingClientRect();
        if (box) setProgress(clamp(-box.top / (box.height - innerHeight)));
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    };
  }, []);

  const [x, y] = pointAt(progress);
  const reached = stations.filter((station) => progress >= station - 0.05).length;
  const active = Math.max(0, reached - 1);

  return (
    <div ref={section} className={css.trail} style={{ "--p": progress } as CSSProperties}>
      <div className={css.trailStage}>
        <svg className={css.trailArt} viewBox="0 0 1000 660" aria-hidden="true">
          <circle className={css.trailSun} cx="880" cy={340 - progress * 250} r="46" />
          <path className={css.trailFar} d="M-3000,2000 L-3000,560 L-400,520 L0,470 L170,330 L300,430 L470,250 L600,370 L790,150 L1000,420 L1300,330 L1600,470 L4000,560 L4000,2000 Z" />
          <path className={css.trailMount} d="M-3000,2000 L-3000,690 L-300,670 L40,620 L320,420 L560,240 L812,40 L1000,300 L1240,500 L1500,640 L4000,700 L4000,2000 Z" />
          <path className={css.trailSnow} d="M812,40 L752,88 L782,80 L806,104 L830,78 L866,114 Z" />
          <polyline className={css.trailBase} points={path.join(" ")} />
          <polyline className={css.trailDone} points={path.join(" ")} pathLength={1} style={{ strokeDashoffset: 1 - progress }} />
          {stations.map((station, i) => {
            const [sx, sy] = pointAt(station);
            return (
              <g key={station} className={css.station} data-done={i < reached || undefined} transform={`translate(${sx} ${sy})`}>
                <circle r="17" />
                <text dy="6">{i + 1}</text>
              </g>
            );
          })}
          <circle className={css.climberHalo} cx={x} cy={y} r="20" />
          <circle className={css.climber} cx={x} cy={y} r="9" />
        </svg>
        <ol className={css.trailSteps}>
          {steps.map((step, i) => (
            <li key={step.title} data-active={i === active || undefined}>
              <span>Шаг {i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ---------- 6. Тюндюк ---------- */

const R = 150;
const chords = [-0.5, 0, 0.5].map((k) => {
  const d = k * R;
  const half = Math.sqrt(R * R - d * d);
  return `M${d},${-half} Q${d * 1.5},0 ${d},${half}`;
});
const rays = Array.from({ length: 40 }, (_, i) => i * 9);

/** Заставка: купол юрты собирается по линиям, поворачивается на место, и от него расходятся лучи. */
export function Tunduk() {
  const [ref, inView] = useInView<HTMLDivElement>(0.45);
  const [run, setRun] = useState(0);

  return (
    <div ref={ref} className={css.tunduk}>
      {/* Новый key пересоздаёт рисунок, и анимация проигрывается с начала. */}
      <svg key={run} className={css.tundukArt} data-run={inView || undefined} viewBox="-300 -300 600 600" aria-hidden="true">
        <g className={css.tundukRays}>
          {rays.map((angle, i) => (
            <line key={angle} x1="0" y1="-178" x2="0" y2={i % 2 ? -236 : -282} transform={`rotate(${angle})`} style={{ "--i": i } as CSSProperties} pathLength={1} />
          ))}
        </g>
        <g className={css.tundukCrown}>
          <circle r={R} pathLength={1} />
          <circle r={R + 18} pathLength={1} />
          {[0, 90].map((turn, group) => (
            <g key={turn} transform={`rotate(${turn})`}>
              {chords.map((d, i) => (
                <path key={d} d={d} pathLength={1} style={{ "--i": group * 3 + i } as CSSProperties} />
              ))}
            </g>
          ))}
        </g>
      </svg>
      <p className={css.tundukWord} key={`w${run}`} data-run={inView || undefined}>
        Кыргызская фондовая биржа
      </p>
      <button type="button" className={css.ghost} onClick={() => setRun((value) => value + 1)}>
        Повторить
      </button>
    </div>
  );
}

/* ---------- 7. Окно из точки клика ---------- */

export type Scene = { label: string; photo: string };

/** Смена разделов: новый кадр раскрывается кругом от того места, куда нажали. */
export function Iris({ scenes }: { scenes: Scene[] }) {
  const [state, setState] = useState({ current: 0, next: -1, x: 50, y: 50 });

  const open = (next: number, x: number, y: number) => {
    setState((prev) => {
      if (next === prev.current || prev.next >= 0) return prev;
      return calm() ? { ...prev, current: next } : { ...prev, next, x, y };
    });
  };

  const fromEvent = (event: PointerEvent<HTMLElement>, next: number) => {
    const box = event.currentTarget.closest(`.${css.iris}`)?.getBoundingClientRect();
    if (!box) return;
    open(next, ((event.clientX - box.left) / box.width) * 100, ((event.clientY - box.top) / box.height) * 100);
  };

  const shown = state.next >= 0 ? state.next : state.current;

  return (
    <div className={css.iris} onPointerUp={(event) => fromEvent(event, (shown + 1) % scenes.length)}>
      {scenes.map((scene, i) => (
        <div
          key={scene.photo}
          className={css.irisScene}
          data-state={i === state.next ? "opening" : i === state.current ? "current" : undefined}
          style={{ "--x": `${state.x}%`, "--y": `${state.y}%` } as CSSProperties}
          onAnimationEnd={() => setState((prev) => (prev.next === i ? { ...prev, current: i, next: -1 } : prev))}
        >
          <Image src={scene.photo} alt="" fill sizes="(max-width: 900px) 100vw, 1100px" loading="eager" />
          <strong>{scene.label}</strong>
        </div>
      ))}
      <div className={css.irisTabs}>
        {scenes.map((scene, i) => (
          <button
            key={scene.photo}
            type="button"
            aria-pressed={i === shown}
            onPointerUp={(event) => {
              event.stopPropagation();
              fromEvent(event, i);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") open(i, 50, 50);
            }}
          >
            {scene.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- 8. Микро-взаимодействия ---------- */

/** Кнопка тянется к курсору, когда он рядом, и мягко возвращается на место. */
export function MagneticLink({ href, children }: { href: string; children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.pointerType !== "mouse" || !ref.current) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - box.left - box.width / 2;
    const y = event.clientY - box.top - box.height / 2;
    ref.current.style.translate = `${(x * 0.32).toFixed(1)}px ${(y * 0.32).toFixed(1)}px`;
  };

  return (
    <span className={css.magnetZone} onPointerMove={onMove} onPointerLeave={() => ref.current?.style.removeProperty("translate")}>
      <Link ref={ref} href={href} className={css.magnet}>
        {children}
      </Link>
    </span>
  );
}

/** Кнопка наполняется волной снизу вверх. */
export function LiquidLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={css.liquid}>
      <span>{children}</span>
    </Link>
  );
}

/** Вокруг карточки бежит луч света. */
export function BeamCard({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link href={href} className={css.beam}>
      <strong>{title}</strong>
      <span>{text}</span>
    </Link>
  );
}

/** Цены лидеров по очереди на барабанах. */
export function PriceDrums({ papers }: { papers: Paper[] }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!inView || papers.length < 2 || calm()) return;
    const timer = window.setInterval(() => setI((value) => (value + 1) % papers.length), 2600);
    return () => window.clearInterval(timer);
  }, [inView, papers.length]);

  const paper = papers[i];
  if (!paper) return null;

  return (
    <div ref={ref} className={css.drums}>
      <span>{paper.ticker}</span>
      <strong>
        <Odometer text={money(paper.price)} />
      </strong>
      <small>сом, последняя сессия</small>
    </div>
  );
}

/* ---------- 9. Лента скорости ---------- */

/** Бегущая лента, которая чувствует прокрутку: разгоняется, наклоняется и разворачивается вместе со страницей. */
export function SpeedTape({ items }: { items: string[] }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = box.current;
    if (!root || calm()) return;
    const rows = [...root.querySelectorAll<HTMLElement>("[data-tape]")];
    const offsets = rows.map(() => 0);
    let halves = rows.map((row) => row.scrollWidth / 2);
    let frame = 0;
    let last = scrollY;
    let speed = 0;

    const tick = () => {
      speed += (scrollY - last - speed) * 0.12;
      last = scrollY;
      const skew = clamp(speed * 0.5, -14, 14);
      rows.forEach((row, i) => {
        const half = halves[i] || 1;
        offsets[i] = (offsets[i] + (i % 2 ? 1 : -1) * (1.1 + speed * 0.9)) % half;
        // Лента задвоена, поэтому сдвиг держим в пределах одной половины — стык не виден.
        const x = offsets[i] > 0 ? offsets[i] - half : offsets[i];
        row.style.transform = `translateX(${x.toFixed(1)}px) skewX(${skew.toFixed(2)}deg)`;
      });
      frame = requestAnimationFrame(tick);
    };

    const sizes = new ResizeObserver(() => {
      halves = rows.map((row) => row.scrollWidth / 2);
    });
    const watch = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (!entry.isIntersecting) return;
      last = scrollY;
      frame = requestAnimationFrame(tick);
    });
    sizes.observe(root);
    watch.observe(root);
    return () => {
      sizes.disconnect();
      watch.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={box} className={css.tape}>
      <p className={css.sr}>{items.join(", ")}</p>
      {[0, 1].map((row) => (
        <div key={row} data-tape className={css.tapeRow} aria-hidden="true">
          {[...items, ...items].map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- 10. Струна индекса ---------- */

export type IndexPoint = { date: string; value: number };

const NODES = 140;

/** График как струна комуза: линию индекса можно оттянуть и отпустить — она звенит и затихает. Подпись показывает значение под курсором. */
export function IndexString({ points }: { points: IndexPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || points.length < 2) return;

    const ratio = Math.min(devicePixelRatio || 1, 2);
    const still = calm();
    const shift = new Float32Array(NODES);
    const speed = new Float32Array(NODES);
    const base = new Float32Array(NODES);
    const min = Math.min(...points.map((point) => point.value));
    const span = Math.max(...points.map((point) => point.value)) - min || 1;
    const pointer = { x: -1, y: 0, lastY: 0, held: false };
    let width = 0;
    let height = 0;
    let frame = 0;

    const nodeX = (i: number) => (i / (NODES - 1)) * width;

    const layout = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      for (let i = 0; i < NODES; i++) {
        const at = (i / (NODES - 1)) * (points.length - 1);
        const left = points[Math.floor(at)].value;
        const right = points[Math.ceil(at)].value;
        const value = left + (right - left) * (at % 1);
        base[i] = height * 0.72 - ((value - min) / span) * height * 0.42;
      }
    };

    const paint = () => {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      for (let i = 0; i < NODES; i++) ctx.lineTo(nodeX(i), base[i] + shift[i]);
      ctx.lineJoin = "round";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#8fe0e6";
      ctx.shadowColor = "rgba(143, 224, 230, 0.8)";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      const fill = ctx.createLinearGradient(0, 0, 0, height);
      fill.addColorStop(0, "rgba(87, 182, 192, 0.3)");
      fill.addColorStop(1, "rgba(87, 182, 192, 0)");
      ctx.fillStyle = fill;
      ctx.fill();

      if (pointer.x < 0) return;
      const node = Math.round(clamp(pointer.x / (width || 1)) * (NODES - 1));
      const point = points[Math.round((node / (NODES - 1)) * (points.length - 1))];
      const x = nodeX(node);
      const y = base[node] + shift[node];
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "600 14px system-ui, sans-serif";
      ctx.textAlign = x > width - 130 ? "right" : "left";
      ctx.fillText(`${point.date} · ${money(point.value)}`, x + (x > width - 130 ? -12 : 12), Math.max(20, y - 16));
    };

    const step = () => {
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 1; i < NODES - 1; i++) speed[i] = (speed[i] + (shift[i - 1] + shift[i + 1] - 2 * shift[i]) * 0.24 - shift[i] * 0.002) * 0.992;
        for (let i = 1; i < NODES - 1; i++) shift[i] += speed[i];
      }
      if (pointer.held) {
        // Оттягиваем струну: у пальца смещение полное, к соседним узлам плавно сходит на нет.
        const center = (pointer.x / width) * (NODES - 1);
        const pull = clamp(pointer.y - base[Math.round(center)], -height * 0.5, height * 0.5);
        for (let i = 1; i < NODES - 1; i++) {
          const k = Math.exp(-(((i - center) / 16) ** 2));
          shift[i] = shift[i] * (1 - k) + pull * k;
          speed[i] *= 1 - k;
        }
      }
      paint();
      frame = requestAnimationFrame(step);
    };

    const place = (event: globalThis.PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      pointer.lastY = pointer.y;
      pointer.x = clamp(event.clientX - box.left, 0, width);
      pointer.y = event.clientY - box.top;
    };
    const onMove = (event: globalThis.PointerEvent) => {
      place(event);
      if (still) return paint();
      if (pointer.held) return;
      // Курсор пересёк струну на ходу — лёгкий щипок.
      const node = Math.round((pointer.x / (width || 1)) * (NODES - 1));
      const line = base[node] + shift[node];
      if ((pointer.lastY - line) * (pointer.y - line) < 0 && node > 0 && node < NODES - 1) speed[node] += clamp(pointer.y - pointer.lastY, -14, 14);
    };
    const onDown = (event: globalThis.PointerEvent) => {
      if (still) return;
      place(event);
      pointer.held = true;
      canvas.setPointerCapture(event.pointerId);
    };
    const onUp = () => {
      pointer.held = false;
    };
    const onLeave = () => {
      if (pointer.held) return;
      pointer.x = -1;
      if (still) paint();
    };

    const sizes = new ResizeObserver(() => {
      layout();
      paint();
    });
    const watch = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (entry.isIntersecting && !still) frame = requestAnimationFrame(step);
    });
    sizes.observe(canvas);
    watch.observe(canvas);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);

    return () => {
      sizes.disconnect();
      watch.disconnect();
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [points]);

  const last = points.at(-1);

  return <canvas ref={canvasRef} className={css.string} role="img" aria-label={last ? `График индекса KSE, последнее значение ${money(last.value)}` : "График индекса KSE"} />;
}

/* ---------- 11. Текст от прокрутки ---------- */

/** Абзац проявляется слово за словом по мере прокрутки — читатель сам ведёт текст. */
export function ScrollText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const count = words.length;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = ref.current?.getBoundingClientRect();
        if (!box) return;
        setLit(calm() ? count : Math.round(clamp((innerHeight * 0.82 - box.top) / (box.height + innerHeight * 0.3)) * count));
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", onScroll);
    };
  }, [words.length]);

  return (
    <p ref={ref} className={css.reading}>
      {words.map((word, i) => (
        <span key={i} data-lit={i < lit || undefined}>
          {word}{" "}
        </span>
      ))}
    </p>
  );
}

/* ---------- 12. Пузыри рынка ---------- */

type Body = { x: number; y: number; vx: number; vy: number; r: number };

const kinds: Record<string, string> = { stock: "Акции", bond: "Облигации", gcb: "ГЦБ", metal: "Металлы" };

/** Шаг физики: тяжесть, стенки и упругие столкновения шаров. */
function settle(bodies: Body[], width: number, height: number, held: Body | null) {
  for (const body of bodies) {
    if (body === held) continue;
    body.vy += 0.34;
    body.vx *= 0.995;
    body.x += body.vx;
    body.y += body.vy;
    if (body.x < body.r) [body.x, body.vx] = [body.r, Math.abs(body.vx) * 0.5];
    if (body.x > width - body.r) [body.x, body.vx] = [width - body.r, -Math.abs(body.vx) * 0.5];
    if (body.y > height - body.r) [body.y, body.vy, body.vx] = [height - body.r, -Math.abs(body.vy) * 0.35, body.vx * 0.9];
  }
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i];
      const b = bodies[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 1;
      const overlap = a.r + b.r - dist;
      if (overlap <= 0) continue;
      const nx = dx / dist;
      const ny = dy / dist;
      const hit = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (a !== held) {
        a.x -= nx * overlap * (b === held ? 1 : 0.5);
        a.y -= ny * overlap * (b === held ? 1 : 0.5);
        if (hit < 0) [a.vx, a.vy] = [a.vx + nx * hit * 0.7, a.vy + ny * hit * 0.7];
      }
      if (b !== held) {
        b.x += nx * overlap * (a === held ? 1 : 0.5);
        b.y += ny * overlap * (a === held ? 1 : 0.5);
        if (hit < 0) [b.vx, b.vy] = [b.vx - nx * hit * 0.7, b.vy - ny * hit * 0.7];
      }
    }
  }
}

/** Бумаги падают в «стакан» и толкаются. Размер шара — цена бумаги, цвет — вид бумаги. Шары можно хватать и бросать. */
export function MarketBubbles({ papers }: { papers: Paper[] }) {
  const stage = useRef<HTMLDivElement>(null);
  const [ref, inView] = useInView<HTMLDivElement>(0.35);
  const [ready, setReady] = useState(false);
  const types = [...new Set(papers.map((paper) => paper.type))];

  useEffect(() => {
    const root = stage.current;
    if (!root || !inView) return;
    const els = [...root.querySelectorAll<HTMLElement>("[data-bubble]")];
    const width = root.clientWidth;
    const height = root.clientHeight;
    const top = Math.sqrt(Math.max(...papers.map((paper) => paper.price)) || 1);
    const scale = clamp(width / 900, 0.62, 1);
    const bodies: Body[] = papers.map((paper, i) => ({
      x: 60 + ((i * 197) % Math.max(1, width - 120)),
      y: -80 - i * 70,
      vx: 0,
      vy: 0,
      r: (30 + (Math.sqrt(paper.price) / top) * 62) * scale + 8,
    }));
    const pointer = { body: null as Body | null, x: 0, y: 0, lastX: 0, lastY: 0 };
    let frame = 0;

    const paint = () => {
      bodies.forEach((body, i) => {
        els[i].style.width = `${body.r * 2}px`;
        els[i].style.height = `${body.r * 2}px`;
        // Цена помещается только в крупный шар; в мелком остаётся тикер.
        els[i].toggleAttribute("data-small", body.r < 44);
        els[i].style.transform = `translate(${(body.x - body.r).toFixed(1)}px, ${(body.y - body.r).toFixed(1)}px)`;
      });
    };

    const tick = () => {
      const held = pointer.body;
      if (held) {
        held.vx = pointer.x - pointer.lastX;
        held.vy = pointer.y - pointer.lastY;
        held.x = pointer.x;
        held.y = pointer.y;
        pointer.lastX = pointer.x;
        pointer.lastY = pointer.y;
      }
      settle(bodies, width, height, held);
      paint();
      frame = requestAnimationFrame(tick);
    };

    const local = (event: globalThis.PointerEvent) => {
      const box = root.getBoundingClientRect();
      return [event.clientX - box.left, event.clientY - box.top];
    };
    const onDown = (event: globalThis.PointerEvent) => {
      const at = els.indexOf((event.target as Element).closest<HTMLElement>("[data-bubble]") as HTMLElement);
      if (at < 0) return;
      pointer.body = bodies[at];
      [pointer.x, pointer.y] = local(event);
      pointer.lastX = pointer.x;
      pointer.lastY = pointer.y;
      root.setPointerCapture(event.pointerId);
    };
    const onMove = (event: globalThis.PointerEvent) => {
      if (pointer.body) [pointer.x, pointer.y] = local(event);
    };
    const onUp = () => {
      pointer.body = null;
    };

    if (calm()) {
      // Без анимации: считаем падение заранее и сразу показываем, как шары улеглись.
      for (let i = 0; i < 900; i++) settle(bodies, width, height, null);
      paint();
    } else {
      frame = requestAnimationFrame(tick);
      root.addEventListener("pointerdown", onDown);
      root.addEventListener("pointermove", onMove);
      root.addEventListener("pointerup", onUp);
      root.addEventListener("pointercancel", onUp);
    }
    const shown = requestAnimationFrame(() => setReady(true));

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(shown);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
    };
  }, [inView, papers]);

  return (
    <div ref={ref} className={css.bubbles}>
      <div className={css.bubbleKeys} aria-hidden="true">
        {types.map((type) => (
          <span key={type} data-type={type}>
            {kinds[type] ?? type}
          </span>
        ))}
      </div>
      <div ref={stage} className={css.bubbleStage} data-ready={ready || undefined}>
        <p className={css.sr}>{papers.map((paper) => `${paper.ticker}: ${money(paper.price)} сом`).join("; ")}</p>
        {papers.map((paper) => (
          <div key={paper.ticker} data-bubble data-type={paper.type} className={css.bubble} aria-hidden="true">
            <b>{paper.ticker}</b>
            <small>{money(paper.price)}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 13. Колода новостей ---------- */

export type NewsCard = { slug: string; title: string; tag: string; date: string; photo: string };

/** Новости как колода: верхнюю карточку смахивают в сторону, следующая поднимается на её место. */
export function NewsDeck({ news }: { news: NewsCard[] }) {
  const [top, setTop] = useState(0);
  const [thrown, setThrown] = useState(0);
  const drag = useRef({ on: false, x: 0, dx: 0 });
  const card = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!thrown) return;
    const timer = window.setTimeout(() => {
      setTop((value) => (value + 1) % news.length);
      setThrown(0);
    }, calm() ? 0 : 340);
    return () => window.clearTimeout(timer);
  }, [thrown, news.length]);

  const place = (dx: number) => {
    if (!card.current) return;
    card.current.style.transition = "none";
    card.current.style.translate = `${dx}px 0`;
    card.current.style.rotate = `${(dx / 22).toFixed(2)}deg`;
  };
  const release = () => {
    if (card.current) {
      card.current.style.removeProperty("transition");
      card.current.style.removeProperty("translate");
      card.current.style.removeProperty("rotate");
    }
  };

  const onDown = (event: PointerEvent<HTMLElement>) => {
    if ((event.target as Element).closest("a")) return;
    drag.current = { on: true, x: event.clientX, dx: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent<HTMLElement>) => {
    if (!drag.current.on) return;
    drag.current.dx = event.clientX - drag.current.x;
    place(drag.current.dx);
  };
  const onUp = () => {
    if (!drag.current.on) return;
    drag.current.on = false;
    const { dx } = drag.current;
    release();
    if (Math.abs(dx) > 90) setThrown(Math.sign(dx));
  };

  if (!news.length) return null;

  return (
    <div className={css.deck}>
      <div className={css.deckStack}>
        {news.map((item, i) => {
          const depth = (i - top + news.length) % news.length;
          const isTop = depth === 0;
          return (
            <article
              key={item.slug}
              ref={isTop ? card : undefined}
              className={css.deckCard}
              data-depth={Math.min(depth, 3)}
              data-thrown={(isTop && thrown) || undefined}
              aria-hidden={!isTop}
              onPointerDown={isTop ? onDown : undefined}
              onPointerMove={isTop ? onMove : undefined}
              onPointerUp={isTop ? onUp : undefined}
              onPointerCancel={isTop ? onUp : undefined}
            >
              <span className={css.deckPhoto}>
                <Image src={item.photo} alt="" fill sizes="(max-width: 600px) 90vw, 460px" draggable={false} />
              </span>
              <span className={css.deckTag}>
                {item.tag} · {item.date}
              </span>
              <h3>{item.title}</h3>
              <Link href={`/news/${item.slug}`} tabIndex={isTop ? undefined : -1}>
                Читать
              </Link>
            </article>
          );
        })}
      </div>
      <div className={css.deckNav}>
        <button type="button" className={css.ghost} onClick={() => setThrown(-1)}>
          ← Смахнуть влево
        </button>
        <button type="button" className={css.ghost} onClick={() => setThrown(1)}>
          Смахнуть вправо →
        </button>
      </div>
    </div>
  );
}

/* ---------- 14. Мозаика ---------- */

const COLS = 12;
const LINES = 7;
const tiles = Array.from({ length: COLS * LINES }, (_, i) => ({ col: i % COLS, line: Math.floor(i / COLS) }));
const SPREAD = 1500;

/** Фото из войлочных плиток шырдака: плитки переворачиваются волной от места нажатия, с обратной стороны — новый кадр. */
export function Mosaic({ photos }: { photos: string[] }) {
  const urls = useMemo(() => photos.map((src) => getImageProps({ src, alt: "", width: 1200, height: 700 }).props.src), [photos]);
  const [flip, setFlip] = useState({ turn: 0, front: 0, back: 1, x: 0, y: 0 });
  const busy = useRef(false);

  const start = (x: number, y: number) => {
    if (busy.current || urls.length < 2) return;
    busy.current = true;
    setFlip((prev) => ({ ...prev, turn: prev.turn + 1, x, y }));
    window.setTimeout(() => {
      busy.current = false;
      // Скрытую сторону меняем только когда волна прошла, иначе плитки сменят картинку раньше времени.
      setFlip((prev) => {
        const next = (prev.turn + 1) % urls.length;
        return prev.turn % 2 ? { ...prev, front: next } : { ...prev, back: next };
      });
    }, calm() ? 0 : SPREAD);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    start(((event.clientX - box.left) / box.width) * COLS, ((event.clientY - box.top) / box.height) * LINES);
  };

  return (
    <div
      className={css.mosaic}
      role="button"
      tabIndex={0}
      aria-label="Сменить фото"
      onPointerUp={onPointerUp}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          start(COLS / 2, LINES / 2);
        }
      }}
      style={{ "--cols": COLS, "--lines": LINES } as CSSProperties}
    >
      {tiles.map(({ col, line }) => {
        const face = {
          backgroundSize: `${COLS * 100}% ${LINES * 100}%`,
          backgroundPosition: `${(col / (COLS - 1)) * 100}% ${(line / (LINES - 1)) * 100}%`,
        };
        const delay = Math.hypot(col + 0.5 - flip.x, line + 0.5 - flip.y) * 62;
        return (
          <span key={`${col}-${line}`} className={css.tile} style={{ transform: `rotateY(${flip.turn * 180}deg)`, transitionDelay: `${delay.toFixed(0)}ms` }}>
            <span style={{ ...face, backgroundImage: `url("${urls[flip.front]}")` }} />
            <span style={{ ...face, backgroundImage: `url("${urls[flip.back]}")` }} />
          </span>
        );
      })}
    </div>
  );
}

/* ---------- 15. Луч ---------- */

/** Тёмная гравюра города, а под лучом — цветное фото. Пока курсора нет, луч сам бродит по кадру. */
export function Torch({ photo, title }: { photo: string; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idle, setIdle] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || !idle || calm()) return;
    let frame = 0;
    const tick = (now: number) => {
      el.style.setProperty("--tx", `${(50 + Math.sin(now / 1900) * 34).toFixed(1)}%`);
      el.style.setProperty("--ty", `${(50 + Math.sin(now / 1300) * 26).toFixed(1)}%`);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [idle]);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--tx", `${(((event.clientX - box.left) / box.width) * 100).toFixed(1)}%`);
    event.currentTarget.style.setProperty("--ty", `${(((event.clientY - box.top) / box.height) * 100).toFixed(1)}%`);
  };

  return (
    <div ref={ref} className={css.torch} onPointerEnter={() => setIdle(false)} onPointerLeave={() => setIdle(true)} onPointerMove={onMove}>
      <Image className={css.torchDark} src={photo} alt="" fill sizes="(max-width: 900px) 100vw, 1100px" />
      <div className={css.torchLit}>
        <Image src={photo} alt="" fill sizes="(max-width: 900px) 100vw, 1100px" />
        <strong>{title}</strong>
      </div>
    </div>
  );
}
