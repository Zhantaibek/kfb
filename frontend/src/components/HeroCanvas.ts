import { useEffect, useRef } from "react";

/** Общий цикл отрисовки canvas-сцены баннера: размер и DPR, цвета темы, курсор, пауза на заставке и вне экрана. */

export type Colors = { up: string; down: string; wick: string };
/** Курсор над сценой: координаты в пикселях слоя и сила влияния 0…1 (плавно нарастает и гаснет). */
export type Pointer = { x: number; y: number; s: number };
export type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, c: Colors, p: Pointer) => void;

/** Цикл canvas: DPR, размер, тема; пауза на заставке, вне экрана и при «меньше движения». */
export function useHeroCanvas(draw: Draw) {
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
      pointer.s += ((target.on ? 1 : 0) - pointer.s) * 0.06;
      pointer.x += (target.x - pointer.x) * 0.1;
      pointer.y += (target.y - pointer.y) * 0.1;
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
