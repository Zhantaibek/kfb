"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { TableKit } from "@tiptap/extension-table";
import { TextAlign } from "@tiptap/extension-text-align";
import { BackgroundColor, Color, FontFamily, FontSize, TextStyle } from "@tiptap/extension-text-style";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { closeHistory } from "@tiptap/pm/history";
import { NodeSelection } from "@tiptap/pm/state";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cleanPastedHtml, normalizeLinkUrl, plainTextToHtml, videoEmbedUrl } from "@/lib/news-content";
import type { CmsMedia } from "@/lib/cms/types";
import rt from "./rich-text.module.css";
import styles from "./news-editor.module.css";

/**
 * Редактор текста новости (Tiptap/ProseMirror) в прежнем оформлении панели CMS:
 * H2–P, B/I/U, размер, цвет и фон текста, шрифт; строка фото — вставка, расположение, размер и сдвиг.
 * Дополнительно: списки, цитата, выравнивание, ссылки, таблицы, видео YouTube/Vimeo, отмена и повтор.
 * Хранит HTML; сервер его дополнительно очищает (sanitize-html).
 */

const TEXT_COLORS = ["#1e293b", "#334155", "#475569", "#0f766e", "#15803d", "#b91c1c", "#c2410c"];
const BG_COLORS = ["#fef9c3", "#ecfeff", "#dcfce7", "#ffe4e6", "#ffedd5", "#ede9fe"];
const SIZES = [12, 14, 16, 18, 20, 24];
const FONTS = [
  ["Sans", "Inter, system-ui, sans-serif"],
  ["Serif", "Georgia, 'Times New Roman', serif"],
  ["Mono", "ui-monospace, SFMono-Regular, Menlo, monospace"],
] as const;

type Align = "left" | "center" | "right" | "below";
const POSITIONS: { id: Align; label: string }[] = [
  { id: "left", label: "Влево" },
  { id: "center", label: "По центру" },
  { id: "right", label: "Вправо" },
  { id: "below", label: "Вниз" },
];

const clampWidth = (value: number) => Math.min(100, Math.max(15, Math.round(value)));
const clampOffset = (value: number) => Math.min(800, Math.max(-800, Math.round(value) || 0));

type FigureAttrs = { src: string; alt: string; caption: string; align: string; width: number; ox: number; oy: number };

/**
 * Изображение — та же разметка <figure class="rte-figure" data-align data-width data-ox data-oy>, что у прежнего редактора
 * и у страницы новости: расположение, ширина в % и сдвиг в px сохраняются и показываются на сайте.
 */
const Figure = Node.create({
  name: "figure",
  group: "block",
  atom: true,
  // Фото двигают мышью по X и Y (сдвиг ox/oy), поэтому стандартное перетаскивание блока выключено.
  draggable: false,
  selectable: true,
  addAttributes() {
    return {
      src: { default: "" },
      alt: { default: "" },
      caption: { default: "" },
      align: { default: "left" },
      width: { default: 50 },
      ox: { default: 0 },
      oy: { default: 0 },
    };
  },
  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (element) => {
          const figure = element as HTMLElement;
          const img = figure.querySelector("img");
          if (!img?.getAttribute("src")) return false;
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") ?? "",
            caption: figure.querySelector("figcaption")?.textContent?.trim() ?? "",
            align: figure.dataset.align || "below",
            width: clampWidth(Number(figure.dataset.width) || 100),
            ox: clampOffset(Number(figure.dataset.ox)),
            oy: clampOffset(Number(figure.dataset.oy)),
          };
        },
      },
      {
        tag: "img[src]",
        getAttrs: (element) => ({ src: (element as HTMLElement).getAttribute("src"), alt: (element as HTMLElement).getAttribute("alt") ?? "", align: "below", width: 100 }),
      },
    ];
  },
  renderHTML({ node }) {
    const { src, alt, caption, align, width, ox, oy } = node.attrs as FigureAttrs;
    const children: [string, Record<string, string>, ...unknown[]][] = [["img", { src, alt, draggable: "false" }]];
    if (caption) children.push(["figcaption", {}, caption]);
    return [
      "figure",
      {
        class: "rte-figure",
        "data-align": align,
        "data-width": String(width),
        "data-ox": String(ox),
        "data-oy": String(oy),
        style: `width:${width}%;transform:translate(${ox}px, ${oy}px)`,
      },
      ...children,
    ];
  },
});

/** Видео: только плеер YouTube или Vimeo (адрес проверяет videoEmbedUrl, на сервере — список разрешённых хостов). */
const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return { src: { default: "" } };
  },
  parseHTML() {
    const read = (element: HTMLElement) => {
      const iframe = element.tagName === "IFRAME" ? element : element.querySelector("iframe");
      const src = videoEmbedUrl(iframe?.getAttribute("src") ?? "");
      return src ? { src } : false;
    };
    return [
      { tag: "div[data-video]", getAttrs: (element) => read(element as HTMLElement) },
      { tag: "iframe[src]", getAttrs: (element) => read(element as HTMLElement) },
    ];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { class: "rte-video", "data-video": "" }),
      ["iframe", { src: node.attrs.src as string, title: "Видео", allowfullscreen: "true", loading: "lazy" }],
    ];
  },
});

type Props = {
  label: string;
  hint?: string;
  value: string;
  onChange: (html: string) => void;
  onUpload?: (file: File) => Promise<string>;
  media?: CmsMedia[];
  /** Ошибка поля (показывается под редактором). */
  error?: string | null;
};

type Panel = "link" | "video" | null;

const IDLE = {
  block: "p",
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  bullet: false,
  ordered: false,
  quote: false,
  align: "left",
  link: false,
  table: false,
  fontSize: "",
  fontFamily: "",
  figure: null as FigureAttrs | null,
  canUndo: false,
  canRedo: false,
};

function blockOf(editor: Editor) {
  for (const level of [2, 3, 4] as const) if (editor.isActive("heading", { level })) return `h${level}`;
  return "p";
}

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

/** Кнопка панели в прежнем стиле; не забирает фокус у текста, чтобы выделение не пропадало. */
function Btn({
  children,
  title,
  on,
  disabled,
  className,
  style,
  onClick,
}: {
  children?: ReactNode;
  title?: string;
  on?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className={className ?? rt.btn}
      title={title}
      aria-label={title}
      aria-pressed={on === undefined ? undefined : on}
      data-on={on ? "true" : undefined}
      disabled={disabled}
      style={style}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function NewsEditor({ label, hint, value, onChange, onUpload, media, error }: Props) {
  const fieldId = useId();
  const lastEmitted = useRef(value);
  const fileRef = useRef<HTMLInputElement>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        code: false,
        codeBlock: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          isAllowedUri: (url) => normalizeLinkUrl(url) !== null,
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      TextStyle,
      Color,
      BackgroundColor,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder: "Начните писать текст новости. Текст из Word и Google Docs можно вставлять как есть." }),
      Figure,
      Video,
    ],
    content: plainTextToHtml(value),
    editorProps: {
      transformPastedHTML: cleanPastedHtml,
      attributes: { class: `${rt.surface} ${styles.content}`, id: fieldId, "aria-label": label, "aria-multiline": "true", role: "textbox" },
      // Выделенное фото: «−» и «+» меняют размер, как в прежнем редакторе.
      handleKeyDown: (view, event) => {
        const { selection } = view.state;
        if (!(selection instanceof NodeSelection) || selection.node.type.name !== "figure") return false;
        const step = event.key === "-" || event.key === "_" ? -5 : event.key === "=" || event.key === "+" ? 5 : 0;
        if (!step) return false;
        const width = clampWidth((selection.node.attrs.width as number) + step);
        view.dispatch(view.state.tr.setNodeMarkup(selection.from, undefined, { ...selection.node.attrs, width }));
        return true;
      },
    },
    onUpdate: ({ editor: current }) => {
      const html = current.isEmpty ? "" : current.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
  });

  // Текст пришёл снаружи (другая новость или вкладка языка) — подменяем содержимое, не считая это правкой.
  useEffect(() => {
    if (!editor || value === lastEmitted.current) return;
    lastEmitted.current = value;
    editor.commands.setContent(plainTextToHtml(value), { emitUpdate: false });
    setPanel(null);
  }, [editor, value]);

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current
        ? {
            block: blockOf(current),
            bold: current.isActive("bold"),
            italic: current.isActive("italic"),
            underline: current.isActive("underline"),
            strike: current.isActive("strike"),
            bullet: current.isActive("bulletList"),
            ordered: current.isActive("orderedList"),
            quote: current.isActive("blockquote"),
            align: current.isActive({ textAlign: "center" }) ? "center" : current.isActive({ textAlign: "right" }) ? "right" : "left",
            link: current.isActive("link"),
            table: current.isActive("table"),
            fontSize: (current.getAttributes("textStyle").fontSize as string | undefined) ?? "",
            fontFamily: (current.getAttributes("textStyle").fontFamily as string | undefined) ?? "",
            figure:
              current.state.selection instanceof NodeSelection && current.state.selection.node.type.name === "figure"
                ? (current.state.selection.node.attrs as FigureAttrs)
                : null,
            canUndo: current.can().undo(),
            canRedo: current.can().redo(),
          }
        : null,
  });

  if (!editor) {
    return (
      <div className={rt.wrap}>
        <div className={rt.labelRow}>
          <span>{label} *</span>
        </div>
        <div className={styles.loading}>Загрузка редактора…</div>
      </div>
    );
  }

  // useEditorState обновляется с первой транзакцией; до неё (сразу после создания редактора) — состояние по умолчанию.
  const ui = state ?? IDLE;
  const picked = ui.figure;
  const run = (fn: (chain: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) => fn(editor.chain().focus()).run();
  // Изменить выделенное фото, не уводя фокус с ползунка или поля.
  const setFigure = (attrs: Partial<FigureAttrs>) => editor.commands.updateAttributes("figure", attrs);

  function setBlock(tag: string) {
    const chain = editor!.chain().focus();
    if (tag === "p") chain.setParagraph().run();
    else chain.setHeading({ level: Number(tag.slice(1)) as 2 | 3 | 4 }).run();
  }

  /** Вставить фото и сразу выделить его — чтобы можно было менять расположение и размер. */
  function insertFigure(src: string) {
    const ed = editor!;
    ed.chain().focus().insertContent({ type: "figure", attrs: { src, align: "left", width: 50 } }).run();
    let found = -1;
    ed.state.doc.descendants((node, pos) => {
      if (node.type.name === "figure" && node.attrs.src === src) found = pos;
    });
    if (found >= 0) ed.chain().setNodeSelection(found).run();
  }

  async function uploadImage(file: File) {
    if (!onUpload) return;
    setUploadError(null);
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      setUploadError("Фото должно быть JPG, PNG, WEBP или GIF.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setUploadError("Фото больше 4 МБ — уменьшите его и загрузите снова.");
      return;
    }
    setUploading(true);
    try {
      insertFigure(await onUpload(file));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Не удалось загрузить фото.");
    } finally {
      setUploading(false);
    }
  }

  const images = (media ?? []).filter((item) => IMAGE_EXT.test(item.url));

  /**
   * Перетаскивание фото мышью: нажали на фото и тянем — меняется сдвиг по X и Y (как стрелки в строке фото).
   * Короткий клик без движения просто выделяет фото.
   */
  function startFigureDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const figureEl = (event.target as HTMLElement).closest("figure.rte-figure");
    if (!(figureEl instanceof HTMLElement)) return;
    const ed = editor!;
    // posAtDOM у блока-фото указывает на позицию перед ним или внутри него — проверяем обе.
    const at = ed.view.posAtDOM(figureEl, 0);
    const pos = [at, at - 1].find((candidate) => candidate >= 0 && ed.state.doc.nodeAt(candidate)?.type.name === "figure");
    if (pos === undefined) return;
    const node = ed.state.doc.nodeAt(pos)!;
    event.preventDefault();
    ed.chain().focus().setNodeSelection(pos).run();
    const start = { x: event.clientX, y: event.clientY, ox: node.attrs.ox as number, oy: node.attrs.oy as number };
    let frame = 0;
    let moved = false;
    let firstStep = true;

    const onMove = (move: PointerEvent) => {
      const dx = move.clientX - start.x;
      const dy = move.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      moved = true;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const current = ed.state.doc.nodeAt(pos);
        if (!current || current.type.name !== "figure") return;
        const attrs = { ...current.attrs, ox: clampOffset(start.ox + dx), oy: clampOffset(start.oy + dy) };
        const tr = ed.state.tr.setNodeMarkup(pos, undefined, attrs);
        // Всё перетаскивание — один шаг истории: Ctrl+Z возвращает фото на прежнее место, а не убирает его.
        ed.view.dispatch(firstStep ? closeHistory(tr) : tr);
        firstStep = false;
        ed.commands.setNodeSelection(pos);
      });
    };
    const onUp = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.body.style.removeProperty("user-select");
    };
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  return (
    <div className={rt.wrap}>
      <div className={rt.labelRow}>
        <label htmlFor={fieldId}>
          <span>{label} *</span>
        </label>
        {hint ? <small className={rt.hint}>{hint}</small> : null}
      </div>

      <div className={rt.toolbar} role="toolbar" aria-label="Форматирование текста">
        <div className={rt.group}>
          {(["h2", "h3", "h4", "p"] as const).map((tag) => (
            <Btn key={tag} title={tag === "p" ? "Обычный текст" : `Заголовок ${tag.toUpperCase()}`} on={ui.block === tag && !ui.quote} onClick={() => setBlock(tag)}>
              {tag.toUpperCase()}
            </Btn>
          ))}
          <Btn title="Жирный (Ctrl+B)" on={ui.bold} onClick={() => run((c) => c.toggleBold())}>
            <b>B</b>
          </Btn>
          <Btn title="Курсив (Ctrl+I)" on={ui.italic} onClick={() => run((c) => c.toggleItalic())}>
            <i>I</i>
          </Btn>
          <Btn title="Подчёркнутый (Ctrl+U)" on={ui.underline} onClick={() => run((c) => c.toggleUnderline())}>
            <u>U</u>
          </Btn>
          <Btn title="Зачёркнутый" on={ui.strike} onClick={() => run((c) => c.toggleStrike())}>
            <s>S</s>
          </Btn>
        </div>
        <div className={rt.group}>
          <span className={rt.groupLabel}>PX</span>
          {SIZES.map((size) => (
            <Btn key={size} className={rt.sizeBtn} title={`Размер ${size} px`} on={ui.fontSize === `${size}px`} onClick={() => run((c) => c.setFontSize(`${size}px`))}>
              {size}
            </Btn>
          ))}
        </div>
        <div className={rt.group}>
          <span className={rt.groupLabel}>AA</span>
          {TEXT_COLORS.map((color) => (
            <Btn key={color} className={rt.swatch} title={`Цвет текста ${color}`} style={{ background: color }} onClick={() => run((c) => c.setColor(color))} />
          ))}
        </div>
        <div className={rt.group}>
          <span className={rt.groupLabel}>ФОН</span>
          {BG_COLORS.map((color) => (
            <Btn key={color} className={rt.swatch} title={`Фон текста ${color}`} style={{ background: color }} onClick={() => run((c) => c.setBackgroundColor(color))} />
          ))}
        </div>
        <div className={rt.group}>
          <span className={rt.groupLabel}>ШР</span>
          {FONTS.map(([name, family]) => (
            <Btn key={name} className={rt.fontBtn} title={`Шрифт ${name}`} on={ui.fontFamily === family} onClick={() => run((c) => c.setFontFamily(family))}>
              {name}
            </Btn>
          ))}
          <Btn title="Сбросить формат" onClick={() => run((c) => c.unsetAllMarks().clearNodes().unsetTextAlign())}>
            A−
          </Btn>
        </div>
        <div className={rt.group}>
          <span className={rt.groupLabel}>АБЗ</span>
          <Btn title="Маркированный список" on={ui.bullet} onClick={() => run((c) => c.toggleBulletList())}>
            • —
          </Btn>
          <Btn title="Нумерованный список" on={ui.ordered} onClick={() => run((c) => c.toggleOrderedList())}>
            1. —
          </Btn>
          <Btn title="Цитата" on={ui.quote} onClick={() => run((c) => c.toggleBlockquote())}>
            «»
          </Btn>
          <Btn title="По левому краю" on={ui.align === "left"} onClick={() => run((c) => c.setTextAlign("left"))}>
            ⇤
          </Btn>
          <Btn title="По центру" on={ui.align === "center"} onClick={() => run((c) => c.setTextAlign("center"))}>
            ≡
          </Btn>
          <Btn title="По правому краю" on={ui.align === "right"} onClick={() => run((c) => c.setTextAlign("right"))}>
            ⇥
          </Btn>
        </div>
        <div className={rt.group}>
          <span className={rt.groupLabel}>ВСТ</span>
          <Btn title="Ссылка (Ctrl+K)" on={ui.link || panel === "link"} onClick={() => setPanel(panel === "link" ? null : "link")}>
            Ссылка
          </Btn>
          <Btn title="Видео YouTube или Vimeo" on={panel === "video"} onClick={() => setPanel(panel === "video" ? null : "video")}>
            Видео
          </Btn>
          <Btn title="Таблица 3×3" on={ui.table} onClick={() => run((c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }))}>
            Таблица
          </Btn>
          <Btn title="Разделитель между блоками" onClick={() => run((c) => c.setHorizontalRule())}>
            ―
          </Btn>
          <Btn title="Отменить (Ctrl+Z)" disabled={!ui.canUndo} onClick={() => run((c) => c.undo())}>
            ↶
          </Btn>
          <Btn title="Повторить (Ctrl+Y)" disabled={!ui.canRedo} onClick={() => run((c) => c.redo())}>
            ↷
          </Btn>
        </div>
      </div>

      <div className={rt.insertBar}>
        {onUpload ? (
          <>
            <button className={rt.insertPhoto} type="button" disabled={uploading} onMouseDown={(event) => event.preventDefault()} onClick={() => fileRef.current?.click()}>
              {uploading ? "Загрузка…" : "Вставить фото в текст"}
            </button>
            <input
              ref={fileRef}
              className={rt.hiddenInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadImage(file);
                event.target.value = "";
              }}
            />
          </>
        ) : null}
        {images.length ? (
          <select
            className={rt.mediaPick}
            aria-label="Фото из загруженных"
            value=""
            onChange={(event) => {
              if (event.target.value) insertFigure(event.target.value);
            }}
          >
            <option value="">Из загруженных…</option>
            {images.map((item) => (
              <option key={item.id} value={item.url}>
                {item.name}
              </option>
            ))}
          </select>
        ) : null}
        <span className={rt.barLabel}>Расположение</span>
        {POSITIONS.map((item) => (
          <Btn key={item.id} on={picked?.align === item.id} disabled={!picked} title={picked ? undefined : "Сначала выделите фото кликом"} onClick={() => setFigure({ align: item.id })}>
            {item.label}
          </Btn>
        ))}
        <span className={rt.barLabel}>Размер</span>
        <Btn title="Уменьшить фото" disabled={!picked} onClick={() => picked && setFigure({ width: clampWidth(picked.width - 10) })}>
          −
        </Btn>
        <input
          className={rt.sizeRange}
          type="range"
          min={15}
          max={100}
          aria-label="Ширина фото, %"
          value={picked?.width ?? 50}
          disabled={!picked}
          onChange={(event) => setFigure({ width: clampWidth(Number(event.target.value)) })}
        />
        <Btn title="Увеличить фото" disabled={!picked} onClick={() => picked && setFigure({ width: clampWidth(picked.width + 10) })}>
          +
        </Btn>
        <b className={rt.sizeValue}>{picked?.width ?? 50}%</b>
        <span className={rt.barLabel}>Сдвиг, px</span>
        {(
          [
            ["←", -1, 0],
            ["→", 1, 0],
            ["↑", 0, -1],
            ["↓", 0, 1],
          ] as const
        ).map(([arrow, dx, dy]) => (
          <Btn
            key={arrow}
            title="Сдвиг на 1 px, с Shift — на 10 px"
            disabled={!picked}
            onClick={(event) => {
              if (!picked) return;
              const step = event.shiftKey ? 10 : 1;
              setFigure({ ox: clampOffset(picked.ox + dx * step), oy: clampOffset(picked.oy + dy * step) });
            }}
          >
            {arrow}
          </Btn>
        ))}
        <label className={rt.pxField}>
          X
          <input type="number" step={1} value={picked?.ox ?? 0} disabled={!picked} onChange={(event) => setFigure({ ox: clampOffset(Number(event.target.value)) })} />
        </label>
        <label className={rt.pxField}>
          Y
          <input type="number" step={1} value={picked?.oy ?? 0} disabled={!picked} onChange={(event) => setFigure({ oy: clampOffset(Number(event.target.value)) })} />
        </label>
        <label className={styles.figureField}>
          Подпись
          <input value={picked?.caption ?? ""} disabled={!picked} placeholder="под фото" onChange={(event) => setFigure({ caption: event.target.value })} />
        </label>
        <label className={styles.figureField}>
          Описание
          <input value={picked?.alt ?? ""} disabled={!picked} placeholder="что на фото (для незрячих)" onChange={(event) => setFigure({ alt: event.target.value })} />
        </label>
      </div>
      {uploadError ? (
        <p className={styles.panelError} role="alert">
          {uploadError}
        </p>
      ) : null}

      {ui.table ? (
        <div className={styles.subbar} role="toolbar" aria-label="Таблица">
          <span>Таблица:</span>
          <button type="button" onClick={() => run((c) => c.addRowAfter())}>+ строка</button>
          <button type="button" onClick={() => run((c) => c.addColumnAfter())}>+ столбец</button>
          <button type="button" onClick={() => run((c) => c.deleteRow())}>− строка</button>
          <button type="button" onClick={() => run((c) => c.deleteColumn())}>− столбец</button>
          <button type="button" onClick={() => run((c) => c.toggleHeaderRow())}>Строка заголовков</button>
          <button type="button" className={styles.danger} onClick={() => run((c) => c.deleteTable())}>Удалить таблицу</button>
        </div>
      ) : null}

      {panel === "link" ? <LinkPanel editor={editor} onClose={() => setPanel(null)} /> : null}
      {panel === "video" ? <VideoPanel editor={editor} onClose={() => setPanel(null)} /> : null}

      <div className={rt.editorFrame} data-invalid={error ? "true" : undefined} onPointerDown={startFigureDrag}>
        <EditorContent
          editor={editor}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
              event.preventDefault();
              setPanel("link");
            }
          }}
        />
      </div>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Ссылка: выделите текст и укажите адрес; на существующей ссылке — изменить или убрать. */
function LinkPanel({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const current = (editor.getAttributes("link").href as string | undefined) ?? "";
  const hasSelection = !editor.state.selection.empty || editor.isActive("link");
  const [url, setUrl] = useState(current);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function apply() {
    const href = normalizeLinkUrl(url);
    if (!href) {
      setError("Укажите адрес вида https://example.kg, kse.kg/news, /market или e-mail. Ссылки javascript: и data: не допускаются.");
      return;
    }
    if (hasSelection) editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    else editor.chain().focus().insertContent({ type: "text", text: text.trim() || href, marks: [{ type: "link", attrs: { href } }] }).run();
    // Как в Word: курсор — сразу за ссылкой, без выделения (иначе следующий Enter или буква заменят текст ссылки).
    editor.chain().focus(editor.state.selection.to).unsetMark("link").run();
    onClose();
  }

  return (
    <Panel title={current ? "Изменить ссылку" : "Добавить ссылку"} onClose={onClose} onSubmit={apply}>
      <label>
        <span>Адрес</span>
        <input autoFocus value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://… или /market" inputMode="url" />
      </label>
      {!hasSelection ? (
        <label>
          <span>Текст ссылки</span>
          <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Например: Правила листинга" />
        </label>
      ) : null}
      {error ? <p className={styles.panelError} role="alert">{error}</p> : null}
      <div className={styles.panelActions}>
        <button type="button" className={styles.primary} onClick={apply}>{current ? "Сохранить ссылку" : "Добавить"}</button>
        {current ? (
          <button
            type="button"
            className={styles.danger}
            onClick={() => {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              onClose();
            }}
          >
            Убрать ссылку
          </button>
        ) : null}
        <button type="button" onClick={onClose}>Отмена</button>
      </div>
    </Panel>
  );
}

/** Видео: ссылка на YouTube или Vimeo → встроенный плеер. Загрузка видеофайлов на сервер не поддерживается. */
function VideoPanel({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const embed = videoEmbedUrl(url);

  function apply() {
    if (!embed) {
      setError("Поддерживаются ссылки на YouTube (youtube.com, youtu.be) и Vimeo. Загрузить видеофайл на сайт нельзя — сначала опубликуйте его на одном из этих сервисов.");
      return;
    }
    editor.chain().focus().insertContent({ type: "video", attrs: { src: embed } }).run();
    onClose();
  }

  return (
    <Panel title="Вставить видео" onClose={onClose} onSubmit={apply}>
      <label>
        <span>Ссылка на видео YouTube или Vimeo</span>
        <input
          autoFocus
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setError(null);
          }}
          placeholder="https://www.youtube.com/watch?v=…"
          inputMode="url"
        />
      </label>
      {embed ? <p className={styles.panelNote}>Видео будет показано встроенным плеером.</p> : null}
      {error ? <p className={styles.panelError} role="alert">{error}</p> : null}
      <div className={styles.panelActions}>
        <button type="button" className={styles.primary} onClick={apply}>Вставить</button>
        <button type="button" onClick={onClose}>Отмена</button>
      </div>
    </Panel>
  );
}

/** Панель под инструментами (не модальное окно и не <form> — она внутри формы новости): Esc закрывает, Enter в поле применяет. */
function Panel({ title, children, onClose, onSubmit }: { title: string; children: ReactNode; onClose: () => void; onSubmit: () => void }) {
  return (
    <div
      className={styles.panel}
      role="dialog"
      aria-label={title}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
        if (event.key === "Enter" && (event.target as HTMLElement).tagName === "INPUT") {
          event.preventDefault();
          onSubmit();
        }
      }}
    >
      <b>{title}</b>
      <div className={styles.panelBody}>{children}</div>
    </div>
  );
}
