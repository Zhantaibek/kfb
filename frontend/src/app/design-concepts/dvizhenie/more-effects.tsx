"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent, type ReactNode } from "react";
import { cityPoints, mapHeight, mapWidth, regionShapes, type RegionId } from "../karta/kgz-map";
import { Odometer } from "./effects";
import css from "./more-effects.module.css";

/* Третий набор анимаций КФБ (16–23). Правила те же, что в effects.tsx: без зависимостей, с учётом prefers-reduced-motion. */

const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 16. Шторы ---------- */

export type Curtain = { label: string; path: string; title: string; photo: string };

const STRIPS = 7;

/** Переход между страницами: цветные полосы закрывают экран по очереди и уезжают, открывая новый раздел. */
export function Curtains({ pages }: { pages: Curtain[] }) {
  const [page, setPage] = useState(0);
  const [phase, setPhase] = useState<"idle" | "in" | "out">("idle");
  const [target, setTarget] = useState(0);

  useEffect(() => {
    if (phase === "idle") return;
    const timer = window.setTimeout(() => {
      if (phase === "in") {
        setPage(target);
        setPhase("out");
      } else {
        setPhase("idle");
      }
    }, 640);
    return () => window.clearTimeout(timer);
  }, [phase, target]);

  const go = (next: number) => {
    if (phase !== "idle" || next === page) return;
    if (calm()) return setPage(next);
    setTarget(next);
    setPhase("in");
  };

  const current = pages[page];

  return (
    <div className={css.window}>
      <div className={css.windowBar}>
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <code>kse.kg{pages[phase === "idle" ? page : target].path}</code>
      </div>
      <div className={css.windowNav}>
        {pages.map((item, i) => (
          <button key={item.path} type="button" aria-pressed={i === (phase === "idle" ? page : target)} onClick={() => go(i)}>
            {item.label}
          </button>
        ))}
      </div>
      <div className={css.windowBody}>
        <Image key={current.photo} src={current.photo} alt="" fill sizes="(max-width: 900px) 100vw, 1100px" />
        <h3 key={current.title} data-phase={phase}>
          {current.title}
        </h3>
        <div className={css.strips} data-phase={phase} aria-hidden="true">
          {Array.from({ length: STRIPS }, (_, i) => (
            <span key={i} style={{ "--i": i } as CSSProperties} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- 17. Живые иконки ---------- */

const icons: { label: string; href: string; art: ReactNode }[] = [
  {
    label: "Акции",
    href: "/market/quotes",
    art: (
      <>
        <path d="M6 42h36" />
        <rect className={css.bar} x="10" y="26" width="7" height="16" style={{ "--i": 0 } as CSSProperties} />
        <rect className={css.bar} x="21" y="17" width="7" height="25" style={{ "--i": 1 } as CSSProperties} />
        <rect className={css.bar} x="32" y="8" width="7" height="34" style={{ "--i": 2 } as CSSProperties} />
      </>
    ),
  },
  {
    label: "Листинг",
    href: "/listing",
    art: (
      <>
        <path d="M12 5h17l8 8v30H12z" />
        <path d="M29 5v8h8" />
        <path className={css.line} d="M18 21h13" pathLength={1} style={{ "--i": 0 } as CSSProperties} />
        <path className={css.line} d="M18 28h13" pathLength={1} style={{ "--i": 1 } as CSSProperties} />
        <path className={css.tick} d="M18 36l3 3 6-7" pathLength={1} />
      </>
    ),
  },
  {
    label: "ГЦБ",
    href: "/gcb",
    art: (
      <>
        <path className={css.roof} d="M5 18 24 6l19 12z" />
        <path d="M7 43h34" />
        <path className={css.column} d="M12 22v17" style={{ "--i": 0 } as CSSProperties} />
        <path className={css.column} d="M20 22v17" style={{ "--i": 1 } as CSSProperties} />
        <path className={css.column} d="M28 22v17" style={{ "--i": 2 } as CSSProperties} />
        <path className={css.column} d="M36 22v17" style={{ "--i": 3 } as CSSProperties} />
      </>
    ),
  },
  {
    label: "Металлы",
    href: "/market/quotes",
    art: (
      <>
        <path d="M13 16h22l7 22H6z" />
        <path className={css.shine} d="M19 16 13 38" />
      </>
    ),
  },
  {
    label: "Новости",
    href: "/news",
    art: (
      <>
        <path d="M6 9h30v30a4 4 0 0 0 4 4H10a4 4 0 0 1-4-4z" />
        <path d="M36 17h6v22a3 3 0 0 1-6 0" />
        <path className={css.line} d="M12 17h18" pathLength={1} style={{ "--i": 0 } as CSSProperties} />
        <path className={css.line} d="M12 24h18" pathLength={1} style={{ "--i": 1 } as CSSProperties} />
        <path className={css.line} d="M12 31h11" pathLength={1} style={{ "--i": 2 } as CSSProperties} />
      </>
    ),
  },
  {
    label: "Эмитенты",
    href: "/disclosure",
    art: (
      <>
        <path d="M9 43V10h18v33M27 22h12v21M5 43h38" />
        <rect className={css.light} x="14" y="16" width="3" height="4" style={{ "--i": 0 } as CSSProperties} />
        <rect className={css.light} x="20" y="16" width="3" height="4" style={{ "--i": 2 } as CSSProperties} />
        <rect className={css.light} x="14" y="25" width="3" height="4" style={{ "--i": 3 } as CSSProperties} />
        <rect className={css.light} x="20" y="25" width="3" height="4" style={{ "--i": 1 } as CSSProperties} />
        <rect className={css.light} x="32" y="29" width="3" height="4" style={{ "--i": 4 } as CSSProperties} />
      </>
    ),
  },
];

/** Значки разделов оживают при наведении: столбики растут, галочка рисуется, окна загораются. */
export function LiveIcons() {
  return (
    <div className={css.icons}>
      {icons.map((icon) => (
        <Link key={icon.label} href={icon.href} className={css.icon}>
          <svg viewBox="0 0 48 48" aria-hidden="true">
            {icon.art}
          </svg>
          <span>{icon.label}</span>
        </Link>
      ))}
    </div>
  );
}

/* ---------- 18. Часы сессии ---------- */

const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const OPEN = 9 * 3600;
const CLOSE = 17 * 3600;

/** Время Бишкека и сколько секунд до открытия или закрытия. Торги — по будням 9:00–17:00. */
function sessionNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bishkek", weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  const seconds = Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second);
  const day = week.indexOf(parts.weekday);
  const workday = day < 5;
  const open = workday && seconds >= OPEN && seconds < CLOSE;
  const daysAhead = workday && seconds < OPEN ? 0 : day >= 4 ? 7 - day : 1;
  return { seconds, open, left: open ? CLOSE - seconds : daysAhead * 86400 + OPEN - seconds, clock: `${parts.hour}:${parts.minute}:${parts.second}` };
}

function countdown(total: number) {
  const pad = (value: number) => String(value).padStart(2, "0");
  const days = Math.floor(total / 86400);
  const rest = `${pad(Math.floor((total % 86400) / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  return days ? `${days} д ${rest}` : rest;
}

/** Циферблат суток по Бишкеку: дуга — часы торгов, стрелка — сейчас, цифры обратного отсчёта катятся на барабанах. */
export function SessionClock() {
  // Время есть только в браузере: иначе сервер и браузер отрисуют разные секунды.
  const [now, setNow] = useState<ReturnType<typeof sessionNow> | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setNow(sessionNow()));
    const timer = window.setInterval(() => setNow(sessionNow()), 1000);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  const angle = now ? (now.seconds / 86400) * 360 : 0;

  return (
    <div className={css.clock} data-open={now?.open || undefined}>
      <svg className={css.dial} viewBox="-120 -120 240 240" aria-hidden="true">
        <circle className={css.dialTrack} r="96" />
        <circle className={css.dialSession} r="96" pathLength={24} strokeDasharray="8 16" transform="rotate(45)" />
        {Array.from({ length: 24 }, (_, hour) => (
          <line key={hour} className={css.dialTick} x1="0" y1={hour % 6 ? -108 : -112} x2="0" y2="-103" transform={`rotate(${hour * 15})`} />
        ))}
        {now ? (
          <g style={{ transform: `rotate(${angle}deg)` }} className={css.dialHand}>
            <line x1="0" y1="0" x2="0" y2="-82" />
            <circle className={css.dialSun} cy="-96" r="9" />
          </g>
        ) : null}
        <circle className={css.dialHub} r="5" />
      </svg>
      <div className={css.clockText}>
        <p className={css.clockStatus}>{now ? (now.open ? "Сессия открыта" : "Сессия закрыта") : "Время Бишкека"}</p>
        <p className={css.clockLabel}>{now?.open ? "До закрытия" : "До открытия"}</p>
        <strong>{now ? <Odometer text={countdown(now.left)} /> : "—"}</strong>
        <p className={css.clockLabel}>В Бишкеке {now?.clock ?? "—"} · торги по будням 9:00–17:00</p>
      </div>
    </div>
  );
}

/* ---------- 19. Карта из точек ---------- */

export type RegionCount = { id: RegionId; count: number };

type MapDot = { x: number; y: number; region: RegionId; heat: number; delay: number };

const GAP = 9;

/** Кыргызстан из точек: яркость области — число эмитентов. Карта разворачивается от Бишкека, клик пускает волну. */
export function DotMap({ regions }: { regions: RegionCount[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const total = regions.reduce((sum, region) => sum + region.count, 0);
  const [hover, setHover] = useState<RegionId | null>(null);
  const hovered = regionShapes.find((shape) => shape.id === hover);
  const count = regions.find((region) => region.id === hover)?.count ?? 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const ratio = Math.min(devicePixelRatio || 1, 2);
    const still = calm();
    const shapes = regionShapes.map((shape) => ({ id: shape.id, path: new Path2D(shape.d) }));
    const top = Math.sqrt(Math.max(1, ...regions.map((region) => region.count)));
    const home = cityPoints[0];
    const dots: MapDot[] = [];
    for (let y = 0; y < mapHeight; y += GAP) {
      for (let x = (y / GAP) % 2 ? GAP / 2 : 0; x < mapWidth; x += GAP) {
        const shape = shapes.find((item) => ctx.isPointInPath(item.path, x, y));
        if (!shape) continue;
        const heat = Math.sqrt(regions.find((region) => region.id === shape.id)?.count ?? 0) / top;
        dots.push({ x, y, region: shape.id, heat, delay: Math.hypot(x - home.x, y - home.y) * 1.5 });
      }
    }

    const waves: { x: number; y: number; start: number }[] = [];
    let scale = 1;
    let frame = 0;
    let begin = 0;
    let active: RegionId | null = null;

    const paint = (now: number) => {
      ctx.setTransform(ratio * scale, 0, 0, ratio * scale, 0, 0);
      ctx.clearRect(0, 0, mapWidth, mapHeight);
      const clock = now - begin;
      while (waves.length && now - waves[0].start > 1800) waves.shift();
      for (const dot of dots) {
        const shown = still ? 1 : Math.min(1, Math.max(0, (clock - dot.delay) / 320));
        if (!shown) continue;
        let lift = 0;
        for (const wave of waves) {
          const front = (now - wave.start) * 0.62;
          const gap = Math.abs(Math.hypot(dot.x - wave.x, dot.y - wave.y) - front);
          if (gap < 34) lift = Math.max(lift, (1 - gap / 34) * (1 - (now - wave.start) / 1800));
        }
        const picked = dot.region === active;
        ctx.globalAlpha = Math.min(1, (0.28 + dot.heat * 0.72 + lift + (picked ? 0.25 : 0)) * shown);
        ctx.fillStyle = lift > 0.25 ? "#ffd9a0" : picked ? "#ffffff" : "#8fe0e6";
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, (2.1 + dot.heat * 1.2 + lift * 2.4) * shown, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      const pulse = still ? 0.4 : (now % 2000) / 2000;
      ctx.strokeStyle = `rgba(242, 179, 94, ${1 - pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(home.x, home.y, 6 + pulse * 22, 0, Math.PI * 2);
      ctx.stroke();
    };

    const loop = (now: number) => {
      begin ||= now;
      paint(now);
      frame = requestAnimationFrame(loop);
    };

    const toMap = (event: globalThis.PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      return [((event.clientX - box.left) / box.width) * mapWidth, ((event.clientY - box.top) / box.height) * mapHeight];
    };
    const regionAt = (x: number, y: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      return shapes.find((item) => ctx.isPointInPath(item.path, x, y))?.id ?? null;
    };
    const onMove = (event: globalThis.PointerEvent) => {
      const [x, y] = toMap(event);
      active = regionAt(x, y);
      setHover(active);
      if (still) paint(0);
    };
    const onLeave = () => {
      active = null;
      setHover(null);
      if (still) paint(0);
    };
    const onDown = (event: globalThis.PointerEvent) => {
      const [x, y] = toMap(event);
      if (!still) waves.push({ x, y, start: performance.now() });
    };

    const sizes = new ResizeObserver(() => {
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      scale = canvas.clientWidth / mapWidth;
      if (still) paint(0);
    });
    const watch = new IntersectionObserver(
      ([entry]) => {
        cancelAnimationFrame(frame);
        if (entry.isIntersecting && !still) frame = requestAnimationFrame(loop);
      },
      { threshold: 0.25 },
    );
    sizes.observe(canvas);
    watch.observe(canvas);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);

    return () => {
      sizes.disconnect();
      watch.disconnect();
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
    };
  }, [regions]);

  return (
    <div className={css.map}>
      <p className={css.mapLabel}>{hovered ? `${hovered.name}: ${count}` : `Эмитентов на карте: ${total}`}</p>
      <canvas ref={canvasRef} role="img" aria-label={`Карта Кыргызстана из точек, эмитентов на карте: ${total}`} style={{ aspectRatio: `${mapWidth} / ${mapHeight}` }} />
    </div>
  );
}

/* ---------- 20. Гармошка ---------- */

export type Fold = { title: string; text: string; href: string; photo: string };

/** Фото-полосы разделов: та, что под курсором, раскрывается, остальные сжимаются. */
export function PhotoFolds({ items }: { items: Fold[] }) {
  return (
    <div className={css.folds}>
      {items.map((item) => (
        <Link key={item.title} href={item.href} className={css.fold}>
          <Image src={item.photo} alt="" fill sizes="(max-width: 820px) 100vw, 640px" />
          <span className={css.foldBody}>
            <strong>{item.title}</strong>
            <span>{item.text}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ---------- 21. Живой заголовок ---------- */

/** Буквы набухают и приподнимаются рядом с курсором, как будто под ними проходит волна. */
export function LiveTitle({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const centers = useRef<{ el: HTMLElement; x: number; y: number }[]>([]);

  const measure = () => {
    const letters = ref.current?.querySelectorAll<HTMLElement>("[data-letter]") ?? [];
    centers.current = [...letters].map((el) => {
      el.style.transform = "";
      const box = el.getBoundingClientRect();
      return { el, x: box.left + box.width / 2, y: box.top + box.height / 2 };
    });
  };

  const onMove = (event: PointerEvent<HTMLParagraphElement>) => {
    if (event.pointerType !== "mouse" || calm()) return;
    const top = scrollY;
    for (const { el, x, y } of centers.current) {
      const near = Math.max(0, 1 - Math.hypot(event.clientX - x, event.clientY + top - y) / 170);
      const k = near * near;
      el.style.transform = k ? `translateY(${(-k * 16).toFixed(1)}px) scale(${(1 + k * 0.28).toFixed(3)})` : "";
      el.style.color = k > 0.05 ? `color-mix(in oklab, #fff, #f2b35e ${Math.round(k * 100)}%)` : "";
    }
  };

  const onEnter = () => {
    measure();
    for (const item of centers.current) item.y += scrollY;
  };

  const onLeave = () => {
    for (const { el } of centers.current) {
      el.style.transform = "";
      el.style.color = "";
    }
  };

  return (
    <p ref={ref} className={css.title} onPointerEnter={onEnter} onPointerMove={onMove} onPointerLeave={onLeave} aria-label={text}>
      {text.split(" ").map((word, w) => (
        <span key={w} className={css.titleWord} aria-hidden="true">
          {[...word].map((letter, i) => (
            <span key={i} data-letter>
              {letter}
            </span>
          ))}
        </span>
      ))}
    </p>
  );
}

/* ---------- 22. След из фото ---------- */

/** Курсор оставляет за собой цепочку фото, которые появляются и тают. Без курсора след рисуется сам. */
export function PhotoTrail({ photos, hint }: { photos: string[]; hint: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const spot = useRef({ last: { x: -999, y: -999 }, next: 0 });
  const [idle, setIdle] = useState(true);

  const drop = (x: number, y: number) => {
    const root = stage.current;
    const { last, next } = spot.current;
    if (!root || Math.hypot(x - last.x, y - last.y) < 110) return;
    spot.current = { last: { x, y }, next: next + 1 };
    const cards = root.querySelectorAll<HTMLElement>("[data-card]");
    const card = cards[next % cards.length];
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
    card.style.zIndex = String(next + 1);
    const turn = ((next * 37) % 17) - 8;
    card.animate(
      [
        { opacity: 0, transform: `translate(-50%, -50%) scale(0.6) rotate(${turn * 2}deg)` },
        { opacity: 1, transform: `translate(-50%, -50%) scale(1) rotate(${turn}deg)`, offset: 0.16 },
        { opacity: 1, transform: `translate(-50%, -50%) scale(1) rotate(${turn}deg)`, offset: 0.6 },
        { opacity: 0, transform: `translate(-50%, -62%) scale(0.92) rotate(${turn}deg)` },
      ],
      { duration: 1500, easing: "ease-out" },
    );
  };

  useEffect(() => {
    const root = stage.current;
    if (!root || !idle || calm()) return;
    let frame = 0;
    let on = false;
    const tick = (now: number) => {
      if (on) drop(root.clientWidth * (0.5 + Math.sin(now / 900) * 0.38), root.clientHeight * (0.5 + Math.sin(now / 560) * 0.3));
      frame = requestAnimationFrame(tick);
    };
    const watch = new IntersectionObserver(([entry]) => {
      on = entry.isIntersecting;
    });
    watch.observe(root);
    frame = requestAnimationFrame(tick);
    return () => {
      watch.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [idle]);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (calm()) return;
    const box = event.currentTarget.getBoundingClientRect();
    drop(event.clientX - box.left, event.clientY - box.top);
  };

  return (
    <div ref={stage} className={css.trail} onPointerEnter={() => setIdle(false)} onPointerLeave={() => setIdle(true)} onPointerMove={onMove}>
      <p>{hint}</p>
      {[...photos, ...photos].map((photo, i) => (
        <span key={i} data-card className={css.trailCard} aria-hidden="true">
          <Image src={photo} alt="" fill sizes="240px" />
        </span>
      ))}
    </div>
  );
}

/* ---------- 23. Живая форма ---------- */

/** Форма с характером: подпись всплывает, ошибка встряхивает поле, кнопка превращается в индикатор и галочку. Это демо, ничего не отправляется. */
export function LiveForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "wrong" | "sending" | "done">("idle");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (state !== "sending" && state !== "done") return;
    const timer = window.setTimeout(
      () => {
        setState(state === "sending" ? "done" : "idle");
        if (state === "done") setEmail("");
      },
      state === "sending" ? 1400 : 2600,
    );
    return () => window.clearTimeout(timer);
  }, [state]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (state === "sending" || state === "done") return;
    if (/^\S+@\S+\.\S+$/.test(email)) return setState("sending");
    setAttempt((value) => value + 1);
    setState("wrong");
  };

  return (
    <form className={css.form} onSubmit={submit} noValidate data-state={state}>
      {/* Новый key перезапускает встряску при повторной ошибке. */}
      <div key={attempt} className={css.field} data-wrong={state === "wrong" || undefined}>
        <input
          id="dv-email"
          type="email"
          value={email}
          placeholder=" "
          autoComplete="off"
          aria-invalid={state === "wrong"}
          aria-describedby="dv-email-note"
          onChange={(event) => {
            setEmail(event.target.value);
            if (state === "wrong") setState("idle");
          }}
        />
        <label htmlFor="dv-email">Электронная почта</label>
      </div>
      <p id="dv-email-note" className={css.formNote} role="status">
        {state === "wrong" ? "Проверьте адрес: в нём должны быть @ и домен" : state === "done" ? "Готово. Это демо, письмо не отправлено" : "Демо: адрес никуда не отправляется"}
      </p>
      <button type="submit" className={css.send} aria-label={state === "sending" ? "Отправка" : state === "done" ? "Готово" : "Подписаться на новости"}>
        <span className={css.sendText}>Подписаться</span>
        <span className={css.sendSpin} aria-hidden="true" />
        <svg className={css.sendTick} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 13l4.5 4.5L19 7" pathLength={1} />
        </svg>
      </button>
    </form>
  );
}
