"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { clampFigureOffset, figureLayoutStyle } from "@/lib/cms/figure-layout";
import css from "./rich-text.module.css";

const TEXT_COLORS = ["#1e293b", "#334155", "#475569", "#0f766e", "#15803d", "#b91c1c", "#c2410c"];
const BG_COLORS = ["#fef9c3", "#ecfeff", "#dcfce7", "#ffe4e6", "#ffedd5", "#ede9fe"];
const SIZES = [12, 14, 16, 18, 20, 24];
/** Документы, которые можно прикрепить к тексту (сервер сверяет и сигнатуру файла). */
const FILE_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.rtf,.txt,.csv,.zip";

type Align = "inline" | "left" | "right" | "below" | "center" | "full" | "block-right";
type Wrap = "inline" | "square" | "top";
type HandleId = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

type Props = {
  label?: string;
  hint?: string;
  value: string;
  onChange: (html: string) => void;
  onUpload?: (file: File) => Promise<string>;
  media?: { url: string; name: string }[];
};

const POSITIONS = [
  { id: "left" as const, label: "Влево" },
  { id: "center" as const, label: "По центру" },
  { id: "right" as const, label: "Вправо" },
  { id: "below" as const, label: "Вниз" },
];

const HANDLES: { id: HandleId; fromLeft: boolean; fromTop: boolean; axis: "x" | "y" | "both" }[] = [
  { id: "n", fromLeft: false, fromTop: true, axis: "y" },
  { id: "ne", fromLeft: false, fromTop: true, axis: "both" },
  { id: "e", fromLeft: false, fromTop: false, axis: "x" },
  { id: "se", fromLeft: false, fromTop: false, axis: "both" },
  { id: "s", fromLeft: false, fromTop: false, axis: "y" },
  { id: "sw", fromLeft: true, fromTop: false, axis: "both" },
  { id: "w", fromLeft: true, fromTop: false, axis: "x" },
  { id: "nw", fromLeft: true, fromTop: true, axis: "both" },
];

function isHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function plainToHtml(value: string) {
  if (!value.trim()) return "<p><br></p>";
  if (isHtml(value)) return value;
  return value
    .split(/\n+/)
    .filter(Boolean)
    .map((line) => `<p>${line.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    .join("");
}

function clampWidth(value: number) {
  return Math.max(12, Math.min(100, Math.round(value)));
}

function asAlign(value: string | undefined): Align {
  if (value === "left" || value === "right" || value === "below" || value === "center" || value === "full" || value === "inline" || value === "block-right") {
    return value;
  }
  return "inline";
}

function wrapOf(align: Align): Wrap {
  if (align === "inline") return "inline";
  if (align === "left" || align === "right") return "square";
  return "top";
}

function figureWidth(figure: HTMLElement) {
  const align = asAlign(figure.dataset.align);
  return align === "full" ? 100 : clampWidth(Number(figure.dataset.width ?? "40"));
}

function clampOffset(value: number) {
  return Math.max(-600, Math.min(1200, Math.round(value)));
}

function figureOffset(figure: HTMLElement) {
  return clampFigureOffset(
    asAlign(figure.dataset.align),
    clampOffset(Number(figure.dataset.ox ?? "0")),
    clampOffset(Number(figure.dataset.oy ?? "0")),
  );
}

function syncFigureWidth(figure: HTMLElement) {
  const img = figure.querySelector("img");
  if (!img) return;
  const width = figureWidth(figure);
  const { x, y } = figureOffset(figure);
  figure.dataset.width = String(width);
  figure.dataset.ox = String(x);
  figure.dataset.oy = String(y);
  // Сдвиг — отступами, а не transform: текст обтекает фото на новом месте и не прячется под ним.
  figure.style.cssText = figureLayoutStyle(asAlign(figure.dataset.align), width, x, y);
  img.style.width = "100%";
  img.style.height = "auto";
  img.draggable = false;
}

/** Ограничение сдвига рамкой редактора: картинка не уходит за край текста. */
function fitOffsetToSurface(figure: HTMLElement, x: number, y: number) {
  const surface = figure.closest("[data-rte-surface]");
  if (!surface) return { x, y };
  const current = figureOffset(figure);
  const box = figure.getBoundingClientRect();
  const frame = surface.getBoundingClientRect();
  if (!box.width || !frame.width) return { x, y };
  // Положение картинки без сдвига — от него и считаем допустимый диапазон.
  const left = box.left - current.x;
  const range = (value: number, min: number, max: number) => (max < min ? min : Math.max(min, Math.min(max, value)));
  // По вертикали не ограничиваем: сдвиг вниз — это отступ, рамка растёт вместе с фото, а вверх нельзя (clampFigureOffset).
  return {
    x: range(x, frame.left - left, frame.right - (left + box.width)),
    y: Math.max(0, y),
  };
}

function applyFigureOffset(figure: HTMLElement, x: number, y: number) {
  const fitted = fitOffsetToSurface(figure, x, y);
  figure.dataset.ox = String(clampOffset(fitted.x));
  figure.dataset.oy = String(clampOffset(fitted.y));
  syncFigureWidth(figure);
}

/** Тип и размер файла для подписи вложения: «PDF · 1,2 МБ». */
function fileMeta(name: string, bytes?: number) {
  const ext = name.includes(".") ? (name.split(".").pop() ?? "").toUpperCase() : "";
  if (!bytes) return ext;
  const size = bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} МБ` : `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return ext ? `${ext} · ${size}` : size;
}

function isImageUrl(url: string) {
  return /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(url);
}

/** Вложение в тексте: ссылка на файл со значком, именем, типом и размером. */
function createAttachment(url: string, name: string, bytes?: number) {
  const block = document.createElement("p");
  block.className = "rte-file";
  const link = document.createElement("a");
  link.className = "rte-file-link";
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  link.setAttribute("download", name);
  link.textContent = name;
  const meta = document.createElement("span");
  meta.className = "rte-file-meta";
  meta.textContent = fileMeta(name, bytes);
  block.append(link, " ", meta);
  return block;
}

/** «kse.kg» → https://kse.kg, «info@kse.kg» → mailto:, «/about» остаётся ссылкой на страницу сайта. */
function normalizeLink(input: string) {
  const value = input.trim();
  if (!value || value === "https://" || value === "http://") return "";
  if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(value)) return value;
  if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(value)) return `mailto:${value}`;
  return `https://${value}`;
}

/** Выделение годится для ссылки: внутри одного абзаца, без фото, вложений, подписей и других ссылок. */
function linkableRange(range: Range, surface: HTMLElement) {
  const elementOf = (node: Node) => (node instanceof HTMLElement ? node : node.parentElement);
  const block = (node: Node) => elementOf(node)?.closest("p, h2, h3, h4, li, td, th, blockquote, figcaption");
  const start = block(range.startContainer);
  if (!start || start !== block(range.endContainer) || !surface.contains(start)) return false;
  if (start.closest("figure, .rte-file, .rte-ui, a")) return false;
  if (elementOf(range.commonAncestorContainer)?.closest("a")) return false;
  return !range.cloneContents().querySelector("a, figure, img, .rte-ui, p, h2, h3, h4, li");
}

/** Внешние сайты открываются в новой вкладке, страницы сайта и почта — как обычно. */
function setLinkTarget(link: HTMLAnchorElement, href: string) {
  link.setAttribute("href", href);
  if (/^https?:\/\//i.test(href)) {
    link.target = "_blank";
    link.rel = "noopener";
  } else {
    link.removeAttribute("target");
    link.removeAttribute("rel");
  }
}

function stripEditorUi(root: HTMLElement) {
  root.querySelectorAll(".rte-ui").forEach((node) => node.remove());
  root.querySelectorAll("figure.rte-figure.is-selected, figure.rte-figure.is-dragging, figure.rte-figure.is-resizing").forEach((node) => {
    node.classList.remove("is-selected", "is-dragging", "is-resizing");
  });
}

function snapshotHtml(root: HTMLElement) {
  const clone = root.cloneNode(true) as HTMLElement;
  stripEditorUi(clone);
  return clone.innerHTML;
}

function applyFigureSize(figure: HTMLElement, next: number) {
  figure.dataset.width = String(clampWidth(next));
  if (figure.dataset.align === "full") figure.dataset.align = "center";
  syncFigureWidth(figure);
  const width = figure.dataset.width ?? "40";
  figure.querySelectorAll("[data-rte-size]").forEach((node) => {
    if (node instanceof HTMLInputElement) node.value = width;
    else node.textContent = `${width}%`;
  });
  const img = figure.querySelector("img");
  const box = figure.querySelector(".rte-img-box") as HTMLElement | null;
  if (img && box) {
    box.style.top = `${img.offsetTop}px`;
    box.style.height = `${Math.max(img.offsetHeight, 24)}px`;
  }
}

function createFigure(src: string, caption = "") {
  const figure = document.createElement("figure");
  figure.className = "rte-figure";
  figure.dataset.align = "left";
  figure.dataset.width = "50";
  figure.dataset.ox = "0";
  figure.dataset.oy = "0";
  figure.contentEditable = "false";
  figure.style.width = "50%";

  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.draggable = false;
  img.style.width = "100%";
  img.style.height = "auto";

  const cap = document.createElement("figcaption");
  cap.contentEditable = "true";
  cap.textContent = caption;

  figure.append(img, cap);
  return figure;
}

function moveFigure(figure: HTMLElement, dir: -1 | 1) {
  if (dir === 1) {
    const next = figure.nextElementSibling;
    if (next) next.after(figure);
  } else {
    const prev = figure.previousElementSibling;
    if (prev) prev.before(figure);
  }
}

function nearestBlock(surface: HTMLElement, clientX: number, clientY: number, figure: HTMLElement) {
  figure.style.pointerEvents = "none";
  const el = document.elementFromPoint(clientX, clientY);
  figure.style.pointerEvents = "";
  if (!el || !surface.contains(el) || figure.contains(el)) return null;
  if (el === surface) return surface;
  return (el.closest("p, h2, h3, h4, figure, ul, ol, li") as HTMLElement | null) ?? surface;
}

function placeFigureAtPoint(figure: HTMLElement, surface: HTMLElement, clientX: number, clientY: number) {
  const block = nearestBlock(surface, clientX, clientY, figure);
  if (!block || block === figure) return;
  if (block === surface) {
    surface.append(figure);
    return;
  }
  const rect = block.getBoundingClientRect();
  if (clientY > rect.top + rect.height / 2) block.after(figure);
  else block.before(figure);
}

function applyDragPlacement(figure: HTMLElement, surface: HTMLElement, clientX: number, clientY: number, startX: number) {
  placeFigureAtPoint(figure, surface, clientX, clientY);
  const rect = surface.getBoundingClientRect();
  const x = clientX - rect.left;
  const wrap = wrapOf(asAlign(figure.dataset.align));
  if (wrap === "inline") {
    if (Math.abs(clientX - startX) > 56) {
      figure.dataset.align = x < rect.width / 2 ? "left" : "right";
    }
  } else if (wrap === "square") {
    figure.dataset.align = x < rect.width / 2 ? "left" : "right";
  } else {
    if (x < rect.width * 0.33) figure.dataset.align = "below";
    else if (x > rect.width * 0.66) figure.dataset.align = "block-right";
    else figure.dataset.align = "center";
  }
  syncFigureWidth(figure);
}

function updateDropCaret(surface: HTMLElement, figure: HTMLElement, clientX: number, clientY: number, caretClass: string) {
  let caret = surface.querySelector(".rte-drop-caret") as HTMLElement | null;
  if (!caret) {
    caret = document.createElement("div");
    caret.className = `rte-ui rte-drop-caret ${caretClass}`;
    surface.append(caret);
  }
  const block = nearestBlock(surface, clientX, clientY, figure);
  const surfaceRect = surface.getBoundingClientRect();
  if (!block || block === surface) {
    caret.style.top = `${surface.scrollHeight - 2}px`;
    return;
  }
  const rect = block.getBoundingClientRect();
  const after = clientY > rect.top + rect.height / 2;
  caret.style.top = `${(after ? rect.bottom : rect.top) - surfaceRect.top + surface.scrollTop}px`;
}

function wrapSvg(kind: Wrap) {
  if (kind === "inline") {
    return `<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="4" y="5" width="20" height="3" fill="currentColor"/><rect x="8" y="11" width="12" height="7" fill="currentColor" opacity=".85"/><rect x="4" y="21" width="20" height="3" fill="currentColor"/></svg>`;
  }
  if (kind === "square") {
    return `<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="4" y="5" width="8" height="3" fill="currentColor"/><rect x="16" y="5" width="8" height="18" fill="currentColor" opacity=".85"/><rect x="4" y="10" width="8" height="3" fill="currentColor"/><rect x="4" y="15" width="8" height="3" fill="currentColor"/><rect x="4" y="20" width="8" height="3" fill="currentColor"/></svg>`;
  }
  return `<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="4" y="5" width="20" height="3" fill="currentColor"/><rect x="7" y="11" width="14" height="7" fill="currentColor" opacity=".85"/><rect x="4" y="21" width="20" height="3" fill="currentColor"/></svg>`;
}

export function RichTextEditor({ label = "Текст страницы", hint, value, onChange, onUpload, media }: Props) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLElement | null>(null);
  const [picked, setPicked] = useState<{ width: number; align: Align; x: number; y: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const resizeRef = useRef<{
    figure: HTMLElement;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    fromLeft: boolean;
    fromTop: boolean;
    axis: "x" | "y" | "both";
  } | null>(null);
  const dragRef = useRef<{ figure: HTMLElement; startX: number; startY: number; startOx: number; startOy: number; active: boolean } | null>(null);

  // Кнопки панели фото создаются вручную и живут дольше одного рендера — берём свежий onChange из ref,
  // иначе удаление фото могло вернуть старые значения других полей формы.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const emit = useCallback(() => {
    const node = surfaceRef.current;
    if (!node) return;
    stripEditorUi(node);
    onChangeRef.current(node.innerHTML);
    if (selectedRef.current && node.contains(selectedRef.current)) mountFigureUi(selectedRef.current);
  }, []);

  useEffect(() => {
    const node = surfaceRef.current;
    if (!node) return;
    if (resizeRef.current || dragRef.current?.active) return;
    const next = plainToHtml(value);
    let frame = 0;
    if (snapshotHtml(node) !== next) {
      const selectedSrc = selectedRef.current?.querySelector("img")?.src;
      stripEditorUi(node);
      node.innerHTML = next;
      selectedRef.current = null;
      if (selectedSrc) {
        const match = [...node.querySelectorAll("figure.rte-figure")].find((item) => item.querySelector("img")?.src === selectedSrc) as HTMLElement | undefined;
        if (match) mountFigureUi(match);
      }
      // Только когда текст пришёл извне (загрузка записи): старые сдвиги вписываем в рамку.
      // Во время набора не трогаем — иначе сдвиги менялись бы с каждой буквой.
      frame = requestAnimationFrame(() => {
        node.querySelectorAll("figure.rte-figure").forEach((item) => {
          const figure = item as HTMLElement;
          if (!figure.querySelector("img")?.complete) return;
          const { x, y } = figureOffset(figure);
          applyFigureOffset(figure, x, y);
        });
      });
    }
    node.querySelectorAll("figure.rte-figure").forEach((figure) => syncFigureWidth(figure as HTMLElement));
    return () => cancelAnimationFrame(frame);
  }, [value]);

  function rememberPick(figure: HTMLElement) {
    const { x, y } = figureOffset(figure);
    setPicked({ width: figureWidth(figure), align: asAlign(figure.dataset.align), x, y });
  }

  function setFigureWidth(figure: HTMLElement, next: number) {
    applyFigureSize(figure, next);
    rememberPick(figure);
  }

  function nudgeFigure(figure: HTMLElement, dx: number, dy: number) {
    const { x, y } = figureOffset(figure);
    // Выше своего места фото не сдвигается (иначе закроет текст) — вместо этого переносим его над предыдущим абзацем.
    if (dy < 0 && y === 0) {
      moveFigure(figure, -1);
      rememberPick(figure);
      return;
    }
    applyFigureOffset(figure, x + dx, y + dy);
    rememberPick(figure);
  }

  function setFigureAlign(figure: HTMLElement, align: Align) {
    figure.dataset.align = align;
    if (align === "full") figure.dataset.width = "100";
    syncFigureWidth(figure);
    mountFigureUi(figure);
    emit();
  }

  function setWrap(figure: HTMLElement, wrap: Wrap) {
    const current = asAlign(figure.dataset.align);
    if (wrap === "inline") {
      setFigureAlign(figure, "inline");
      return;
    }
    if (wrap === "square") {
      setFigureAlign(figure, current === "right" ? "right" : "left");
      return;
    }
    if (current === "center" || current === "full" || current === "block-right" || current === "below") {
      setFigureAlign(figure, current);
      return;
    }
    setFigureAlign(figure, "below");
  }

  function setPosition(figure: HTMLElement, position: "left" | "center" | "right" | "full") {
    const wrap = wrapOf(asAlign(figure.dataset.align));
    if (position === "full") {
      setFigureAlign(figure, "full");
      return;
    }
    if (wrap === "square") {
      if (position === "left") setFigureAlign(figure, "left");
      else if (position === "right") setFigureAlign(figure, "right");
      else setFigureAlign(figure, "center");
      return;
    }
    if (wrap === "inline") {
      if (position === "left") setFigureAlign(figure, "left");
      else if (position === "right") setFigureAlign(figure, "right");
      else setFigureAlign(figure, "center");
      return;
    }
    if (position === "left") setFigureAlign(figure, "below");
    else if (position === "right") setFigureAlign(figure, "block-right");
    else setFigureAlign(figure, "center");
  }

  function mountFigureUi(figure: HTMLElement) {
    stripEditorUi(surfaceRef.current!);
    figure.classList.add("is-selected");
    selectedRef.current = figure;
    syncFigureWidth(figure);

    const found = figure.querySelector("img");
    if (!found) return;
    // Отдельная константа — чтобы сужение типа сохранилось внутри вложенных функций.
    const img = found;

    const box = document.createElement("div");
    box.className = `rte-ui rte-img-box ${css.imgBox}`;
    box.contentEditable = "false";

    function fitBox() {
      box.style.top = `${img.offsetTop}px`;
      box.style.height = `${Math.max(img.offsetHeight, 24)}px`;
    }
    fitBox();
    if (!img.complete) img.addEventListener("load", fitBox, { once: true });
    requestAnimationFrame(fitBox);

    function startResize(event: MouseEvent, item: (typeof HANDLES)[number]) {
      event.preventDefault();
      event.stopPropagation();
      dragRef.current = null;
      resizeRef.current = {
        figure,
        startX: event.clientX,
        startY: event.clientY,
        startWidth: figureWidth(figure),
        startHeight: img.getBoundingClientRect().height || 1,
        fromLeft: item.fromLeft,
        fromTop: item.fromTop,
        axis: item.axis,
      };
      figure.classList.add("is-resizing");
    }

    HANDLES.forEach((item) => {
      const handle = document.createElement("span");
      handle.className = `rte-ui ${css.handle}`;
      handle.dataset.pos = item.id;
      handle.title = "Изменить размер";
      handle.onpointerdown = (event) => {
        handle.setPointerCapture(event.pointerId);
        startResize(event, item);
      };
      box.append(handle);
    });

    const sizeBar = document.createElement("div");
    sizeBar.className = `rte-ui ${css.sizeBar}`;
    sizeBar.onmousedown = (event) => event.stopPropagation();

    const smaller = document.createElement("button");
    smaller.type = "button";
    smaller.textContent = "−";
    smaller.onmousedown = (event) => event.preventDefault();
    smaller.onclick = (event) => {
      event.stopPropagation();
      setFigureWidth(figure, figureWidth(figure) - 10);
      emit();
    };

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "15";
    slider.max = "100";
    slider.step = "1";
    slider.value = String(figureWidth(figure));
    slider.dataset.rteSize = "true";
    slider.oninput = () => setFigureWidth(figure, Number(slider.value));
    slider.onchange = () => emit();

    const larger = document.createElement("button");
    larger.type = "button";
    larger.textContent = "+";
    larger.onmousedown = (event) => event.preventDefault();
    larger.onclick = (event) => {
      event.stopPropagation();
      setFigureWidth(figure, figureWidth(figure) + 10);
      emit();
    };

    const label = document.createElement("span");
    label.dataset.rteSize = "true";
    label.textContent = `${figureWidth(figure)}%`;

    sizeBar.append(smaller, slider, larger, label);
    box.append(sizeBar);

    const layoutBtn = document.createElement("button");
    layoutBtn.type = "button";
    layoutBtn.className = css.layoutBtn;
    layoutBtn.title = "Параметры разметки";
    layoutBtn.innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3" width="8" height="10" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M13 5h4M13 8h4M13 11h4M3 16h14" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>`;
    layoutBtn.onmousedown = (event) => event.preventDefault();
    layoutBtn.onclick = (event) => {
      event.stopPropagation();
      const open = box.querySelector(`.${css.layoutPanel}`);
      if (open) {
        open.remove();
        return;
      }
      box.append(buildLayoutPanel(figure));
    };
    if (asAlign(figure.dataset.align) === "right" || asAlign(figure.dataset.align) === "block-right") {
      layoutBtn.classList.add(css.layoutBtnStart);
    }
    box.append(layoutBtn);

    box.onmousedown = (event) => {
      if (event.button !== 0) return;
      if ((event.target as HTMLElement).closest(`.${css.handle}, .${css.sizeBar}, .${css.layoutBtn}, .${css.layoutPanel}`)) return;
      event.preventDefault();
      event.stopPropagation();
      const rect = box.getBoundingClientRect();
      const edge = 18;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const nearL = x <= edge;
      const nearR = x >= rect.width - edge;
      const nearT = y <= edge;
      const nearB = y >= rect.height - edge;
      if (nearL || nearR || nearT || nearB) {
        startResize(event, {
          id: nearT && nearL ? "nw" : nearT && nearR ? "ne" : nearB && nearL ? "sw" : nearB && nearR ? "se" : nearL ? "w" : nearR ? "e" : nearT ? "n" : "s",
          fromLeft: nearL,
          fromTop: nearT,
          axis: nearL || nearR ? (nearT || nearB ? "both" : "x") : "y",
        });
        return;
      }
      dragRef.current = {
        figure,
        startX: event.clientX,
        startY: event.clientY,
        startOx: figureOffset(figure).x,
        startOy: figureOffset(figure).y,
        active: false,
      };
    };

    img.ondragstart = (event) => event.preventDefault();
    figure.append(box);
    selectedRef.current = figure;
    rememberPick(figure);
  }

  function buildLayoutPanel(figure: HTMLElement) {
    const panel = document.createElement("div");
    panel.className = css.layoutPanel;
    panel.onmousedown = (event) => event.preventDefault();

    const wrapLabel = document.createElement("div");
    wrapLabel.className = css.layoutLabel;
    wrapLabel.textContent = "Обтекание текстом";
    panel.append(wrapLabel);

    const wrapRow = document.createElement("div");
    wrapRow.className = css.layoutIcons;
    const currentWrap = wrapOf(asAlign(figure.dataset.align));
    (
      [
        ["inline", "В тексте"],
        ["square", "Вокруг рамки"],
        ["top", "Сверху и снизу"],
      ] as const
    ).forEach(([id, title]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = css.layoutIcon;
      btn.dataset.on = String(currentWrap === id);
      btn.title = title;
      btn.innerHTML = `${wrapSvg(id)}<span>${title}</span>`;
      btn.onclick = () => setWrap(figure, id);
      wrapRow.append(btn);
    });
    panel.append(wrapRow);

    const posLabel = document.createElement("div");
    posLabel.className = css.layoutLabel;
    posLabel.textContent = "Положение";
    panel.append(posLabel);

    const posRow = document.createElement("div");
    posRow.className = css.layoutPos;
    const align = asAlign(figure.dataset.align);
    (
      [
        ["left", "Слева"],
        ["center", "По центру"],
        ["right", "Справа"],
        ["full", "По ширине"],
      ] as const
    ).forEach(([id, title]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = title;
      const on =
        (id === "left" && (align === "left" || align === "below")) ||
        (id === "center" && align === "center") ||
        (id === "right" && (align === "right" || align === "block-right")) ||
        (id === "full" && align === "full");
      btn.dataset.on = String(on);
      btn.onclick = () => setPosition(figure, id);
      posRow.append(btn);
    });
    panel.append(posRow);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = css.layoutRemove;
    remove.textContent = "Удалить фото";
    remove.onclick = () => removeFigure(figure);
    panel.append(remove);
    return panel;
  }

  function applyBlock(tag: "h2" | "h3" | "h4" | "p") {
    document.execCommand("formatBlock", false, tag);
    emit();
  }

  function applyStyle(style: Record<string, string>) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement("span");
    Object.assign(span.style, style);
    try {
      range.surroundContents(span);
    } catch {
      document.execCommand(
        "insertHTML",
        false,
        `<span style="${Object.entries(style)
          .map(([k, v]) => `${k}:${v}`)
          .join(";")}">${range.toString()}</span>`,
      );
    }
    emit();
  }

  /** Ссылка в выделенном тексте (или правка/снятие ссылки под курсором). */
  function editLink() {
    const surface = surfaceRef.current;
    const sel = window.getSelection();
    if (!surface || !sel || sel.rangeCount === 0 || !surface.contains(sel.anchorNode)) {
      window.alert("Сначала выделите в тексте слова, которые должны стать ссылкой.");
      return;
    }
    const node = sel.anchorNode instanceof HTMLElement ? sel.anchorNode : sel.anchorNode?.parentElement;
    const existing = node?.closest("a:not(.rte-file-link)") as HTMLAnchorElement | null;
    const current = existing && surface.contains(existing) ? existing : null;
    if (!current && sel.isCollapsed) {
      window.alert("Сначала выделите в тексте слова, которые должны стать ссылкой.");
      return;
    }
    const range = sel.getRangeAt(0).cloneRange();
    if (!current && !linkableRange(range, surface)) {
      window.alert("Ссылку можно сделать из слов внутри одного абзаца — без фото, вложений и других ссылок в выделении.");
      return;
    }
    const input = window.prompt(
      current ? "Адрес ссылки (очистите поле, чтобы убрать ссылку):" : "Адрес ссылки — сайт, страница или почта:",
      current?.getAttribute("href") ?? "https://",
    );
    if (input === null) return;
    const href = normalizeLink(input);
    if (current) {
      if (!href) current.replaceWith(...current.childNodes);
      else setLinkTarget(current, href);
      emit();
      return;
    }
    if (!href) return;
    const link = document.createElement("a");
    setLinkTarget(link, href);
    link.append(range.extractContents());
    range.insertNode(link);
    sel.removeAllRanges();
    emit();
  }

  function clearFormat() {
    document.execCommand("removeFormat");
    document.execCommand("formatBlock", false, "p");
    emit();
  }

  /** Убрать картинку из текста (сам файл остаётся в «Медиа»). */
  function removeFigure(figure: HTMLElement) {
    if (!window.confirm("Удалить фото из текста? Файл останется в разделе «Медиа / фото».")) return;
    const gap = figure.nextElementSibling;
    figure.remove();
    // Пустой абзац, который добавлялся вместе с картинкой, тоже убираем.
    if (gap instanceof HTMLParagraphElement && !gap.textContent?.trim() && gap.querySelectorAll("img, a").length === 0) gap.remove();
    selectedRef.current = null;
    setPicked(null);
    emit();
  }

  function clearFigureSelection() {
    if (surfaceRef.current) stripEditorUi(surfaceRef.current);
    selectedRef.current = null;
    setPicked(null);
  }

  function activeFigure() {
    if (selectedRef.current && surfaceRef.current?.contains(selectedRef.current)) return selectedRef.current;
    const nodes = surfaceRef.current?.querySelectorAll("figure.rte-figure");
    return (nodes?.[nodes.length - 1] as HTMLElement | undefined) ?? null;
  }

  function placeFigure(figure: HTMLElement) {
    const surface = surfaceRef.current;
    if (!surface) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && surface.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.collapse(false);
      range.insertNode(figure);
    } else {
      surface.append(figure);
    }
    const gap = document.createElement("p");
    gap.innerHTML = "<br>";
    figure.after(gap);
    mountFigureUi(figure);
    emit();
  }

  function insertImageFromUrl(url: string) {
    placeFigure(createFigure(url));
  }

  function placeBlock(block: HTMLElement) {
    const surface = surfaceRef.current;
    if (!surface) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && surface.contains(sel.anchorNode)) {
      // Вложение — отдельный абзац после того, где стоит курсор.
      const anchor = sel.anchorNode instanceof HTMLElement ? sel.anchorNode : sel.anchorNode?.parentElement;
      // Из пункта списка вставляем после всего списка — абзац не может стоять прямо внутри <ul>.
      const host = anchor?.closest("ul, ol") ?? anchor?.closest("p, h2, h3, h4, figure, div");
      if (host && host !== surface && surface.contains(host)) host.after(block);
      else surface.append(block);
    } else {
      surface.append(block);
    }
    emit();
  }

  /** Из «загруженных»: картинка — вставляется картинкой, остальное — вложением-ссылкой. */
  function insertFromMedia(url: string) {
    if (isImageUrl(url)) {
      insertImageFromUrl(url);
      return;
    }
    const name = media?.find((item) => item.url === url)?.name ?? url.split("/").pop() ?? "Файл";
    placeBlock(createAttachment(url, name));
  }

  /** Загрузка файла с понятным сообщением, если сервер его не принял. */
  async function upload(file: File) {
    if (!onUpload || !surfaceRef.current) return null;
    try {
      return await onUpload(file);
    } catch (error) {
      window.alert(error instanceof Error && error.message ? error.message : "Не удалось загрузить файл. Попробуйте ещё раз.");
      return null;
    }
  }

  async function attachFile(file: File) {
    const url = await upload(file);
    if (!url) return;
    if (file.type.startsWith("image/") && isImageUrl(url)) insertImageFromUrl(url);
    else placeBlock(createAttachment(url, file.name, file.size));
  }

  async function insertImage(file: File) {
    const url = await upload(file);
    if (url) insertImageFromUrl(url);
  }

  function onSurfaceClick(event: ReactMouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest(".rte-ui")) return;
    const figure = target.closest("figure.rte-figure") as HTMLElement | null;
    if (figure) {
      mountFigureUi(figure);
      return;
    }
    clearFigureSelection();
  }

  useEffect(() => {
    function onMove(event: MouseEvent) {
      const resize = resizeRef.current;
      const surface = surfaceRef.current;
      if (resize && surface) {
        const editorWidth = surface.clientWidth || 1;
        let next = resize.startWidth;
        if (resize.axis === "y") {
          const delta = resize.fromTop ? resize.startY - event.clientY : event.clientY - resize.startY;
          next = resize.startWidth * ((resize.startHeight + delta) / resize.startHeight);
        } else {
          const delta = resize.fromLeft ? resize.startX - event.clientX : event.clientX - resize.startX;
          next = resize.startWidth + (delta / editorWidth) * 100;
        }
        applyFigureSize(resize.figure, next);
        rememberPick(resize.figure);
        return;
      }

      const drag = dragRef.current;
      if (!drag || !surface) return;
      if (!drag.active && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4) {
        drag.active = true;
        drag.figure.classList.add("is-dragging");
      }
      if (!drag.active) return;
      applyFigureOffset(drag.figure, drag.startOx + (event.clientX - drag.startX), drag.startOy + (event.clientY - drag.startY));
      rememberPick(drag.figure);
    }

    function onUp() {
      if (resizeRef.current) {
        resizeRef.current.figure.classList.remove("is-resizing");
        resizeRef.current = null;
        emit();
      }
      if (dragRef.current) {
        dragRef.current.figure.classList.remove("is-dragging");
        const moved = dragRef.current.active;
        dragRef.current = null;
        if (moved) emit();
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [emit]);

  return (
    <div className={css.wrap}>
      <div className={css.labelRow}>
        <span>{label} *</span>
        {hint ? <small className={css.hint}>{hint}</small> : null}
      </div>
      <div className={css.toolbar}>
        <div className={css.group}>
          {(["h2", "h3", "h4", "p"] as const).map((tag) => (
            <button key={tag} className={css.btn} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyBlock(tag)}>
              {tag.toUpperCase()}
            </button>
          ))}
          {[
            ["B", "bold"],
            ["I", "italic"],
            ["U", "underline"],
          ].map(([label, cmd]) => (
            <button
              key={cmd}
              className={css.btn}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                document.execCommand(cmd);
                emit();
              }}
            >
              {label}
            </button>
          ))}
          <button
            className={css.btn}
            type="button"
            title="Выделите слова и нажмите — появится поле для адреса. Чтобы изменить или убрать ссылку, поставьте курсор на неё и нажмите снова."
            onMouseDown={(event) => event.preventDefault()}
            onClick={editLink}
          >
            Ссылка
          </button>
        </div>
        <div className={css.group}>
          <span className={css.groupLabel}>PX</span>
          {SIZES.map((size) => (
            <button key={size} className={css.sizeBtn} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyStyle({ fontSize: `${size}px` })}>
              {size}
            </button>
          ))}
        </div>
        <div className={css.group}>
          <span className={css.groupLabel}>AA</span>
          {TEXT_COLORS.map((color) => (
            <button key={color} className={css.swatch} type="button" style={{ background: color }} onMouseDown={(event) => event.preventDefault()} onClick={() => applyStyle({ color })} title={color} />
          ))}
        </div>
        <div className={css.group}>
          <span className={css.groupLabel}>ФОН</span>
          {BG_COLORS.map((color) => (
            <button key={color} className={css.swatch} data-bg="true" type="button" style={{ background: color }} onMouseDown={(event) => event.preventDefault()} onClick={() => applyStyle({ backgroundColor: color })} title={color} />
          ))}
        </div>
        <div className={css.group}>
          <span className={css.groupLabel}>ШР</span>
          {[
            ["Sans", "Inter, system-ui, sans-serif"],
            ["Serif", "Georgia, 'Times New Roman', serif"],
            ["Mono", "ui-monospace, SFMono-Regular, Menlo, monospace"],
          ].map(([name, family]) => (
            <button key={name} className={css.fontBtn} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyStyle({ fontFamily: family })}>
              {name}
            </button>
          ))}
          <button className={css.btn} type="button" onMouseDown={(event) => event.preventDefault()} onClick={clearFormat} title="Сбросить формат">
            A−
          </button>
        </div>
      </div>
      <div className={css.insertBar}>
        {onUpload ? (
          <>
            <button className={css.insertPhoto} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => fileRef.current?.click()}>
              Вставить фото в текст
            </button>
            <input
              ref={fileRef}
              className={css.hiddenInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void insertImage(file);
                event.target.value = "";
              }}
            />
            <button className={css.insertFile} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => docRef.current?.click()}>
              Прикрепить файл
            </button>
            <input
              ref={docRef}
              className={css.hiddenInput}
              type="file"
              accept={FILE_ACCEPT}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void attachFile(file);
                event.target.value = "";
              }}
            />
          </>
        ) : null}
        {media?.length ? (
          <select
            className={css.mediaPick}
            defaultValue=""
            onChange={(event) => {
              const url = event.target.value;
              if (url) insertFromMedia(url);
              event.target.value = "";
            }}
          >
            <option value="">Из загруженных…</option>
            {media.map((item) => (
              <option key={item.url} value={item.url}>
                {item.name}
              </option>
            ))}
          </select>
        ) : null}
        <span className={css.barLabel}>Расположение</span>
        {POSITIONS.map((item) => (
          <button
            key={item.id}
            className={css.btn}
            type="button"
            data-on={String(picked?.align === item.id)}
            disabled={!picked}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              const figure = activeFigure();
              if (!figure) return;
              if (item.id === "below") setFigureAlign(figure, "below");
              else setPosition(figure, item.id);
            }}
          >
            {item.label}
          </button>
        ))}
        <span className={css.barLabel}>Размер</span>
        <button
          className={css.btn}
          type="button"
          disabled={!picked}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            const figure = activeFigure();
            if (!figure) return;
            setFigureWidth(figure, figureWidth(figure) - 10);
            emit();
          }}
        >
          −
        </button>
        <input
          className={css.sizeRange}
          type="range"
          min={15}
          max={100}
          value={picked?.width ?? 50}
          disabled={!picked}
          onInput={(event) => {
            const figure = activeFigure();
            if (!figure) return;
            setFigureWidth(figure, Number((event.target as HTMLInputElement).value));
          }}
          onChange={() => emit()}
        />
        <button
          className={css.btn}
          type="button"
          disabled={!picked}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            const figure = activeFigure();
            if (!figure) return;
            setFigureWidth(figure, figureWidth(figure) + 10);
            emit();
          }}
        >
          +
        </button>
        <b className={css.sizeValue}>{picked?.width ?? 50}%</b>
        <span className={css.barLabel}>Сдвиг, px</span>
        {(
          [
            ["←", -1, 0],
            ["→", 1, 0],
            ["↑", 0, -1],
            ["↓", 0, 1],
          ] as const
        ).map(([label, dx, dy]) => (
          <button
            key={label}
            className={css.btn}
            type="button"
            disabled={!picked}
            title="Shift — по 10 px"
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              const figure = activeFigure();
              if (!figure) return;
              const step = event.shiftKey ? 10 : 1;
              nudgeFigure(figure, dx * step, dy * step);
              emit();
            }}
          >
            {label}
          </button>
        ))}
        <label className={css.pxField}>
          X
          <input
            type="number"
            step={1}
            value={picked?.x ?? 0}
            disabled={!picked}
            onChange={(event) => {
              const figure = activeFigure();
              if (!figure) return;
              applyFigureOffset(figure, Number(event.target.value), figureOffset(figure).y);
              rememberPick(figure);
            }}
            onBlur={() => emit()}
          />
        </label>
        <label className={css.pxField}>
          Y
          <input
            type="number"
            step={1}
            value={picked?.y ?? 0}
            disabled={!picked}
            onChange={(event) => {
              const figure = activeFigure();
              if (!figure) return;
              applyFigureOffset(figure, figureOffset(figure).x, Number(event.target.value));
              rememberPick(figure);
            }}
            onBlur={() => emit()}
          />
        </label>
        <button
          className={css.removeBtn}
          type="button"
          disabled={!picked}
          title="Или выделите фото и нажмите Delete"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            const figure = activeFigure();
            if (figure) removeFigure(figure);
          }}
        >
          Удалить фото
        </button>
      </div>
      <div
        className={css.editorFrame}
        data-over={String(dragOver)}
        onDragOver={(event) => {
          if (!onUpload) return;
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          const file = event.dataTransfer.files[0];
          if (file?.type.startsWith("image/") && onUpload) void insertImage(file);
        }}
      >
      <div
        ref={surfaceRef}
        className={css.surface}
        data-rte-surface="true"
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          if (selectedRef.current && !surfaceRef.current?.contains(selectedRef.current)) {
            clearFigureSelection();
          }
          emit();
        }}
        onClick={onSurfaceClick}
        onMouseDown={(event) => {
          const target = event.target as HTMLElement;
          if (event.button !== 0) return;
          if (target.closest(".rte-ui") || target.closest("figcaption")) return;
          const figure = target.closest("figure.rte-figure") as HTMLElement | null;
          if (!figure) return;
          event.preventDefault();
          mountFigureUi(figure);
          dragRef.current = {
            figure,
            startX: event.clientX,
            startY: event.clientY,
            startOx: figureOffset(figure).x,
            startOy: figureOffset(figure).y,
            active: false,
          };
        }}
        onKeyDown={(event) => {
          const figure = selectedRef.current;
          if ((event.target as HTMLElement).closest("figcaption")) return;
          if (!figure) return;
          if (event.key === "Backspace" || event.key === "Delete") {
            event.preventDefault();
            removeFigure(figure);
            return;
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            nudgeFigure(figure, event.shiftKey ? -10 : -1, 0);
            emit();
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            nudgeFigure(figure, event.shiftKey ? 10 : 1, 0);
            emit();
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            nudgeFigure(figure, 0, event.shiftKey ? 10 : 1);
            emit();
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            nudgeFigure(figure, 0, event.shiftKey ? -10 : -1);
            emit();
          } else if (event.key === "-" || event.key === "_") {
            event.preventDefault();
            setFigureWidth(figure, figureWidth(figure) - 5);
            emit();
          } else if (event.key === "=" || event.key === "+") {
            event.preventDefault();
            setFigureWidth(figure, figureWidth(figure) + 5);
            emit();
          }
        }}
        onBlur={(event) => {
          if ((event.relatedTarget as HTMLElement | null)?.closest(`.${css.toolbar}, .${css.insertBar}`)) return;
          if (!event.currentTarget.contains(event.relatedTarget as Node)) clearFigureSelection();
        }}
      />
      </div>
    </div>
  );
}
