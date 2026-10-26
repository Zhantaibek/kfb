import sanitizeHtml from "sanitize-html";

const options: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "h2",
    "h3",
    "h4",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "span",
    "a",
    "figure",
    "figcaption",
    "img",
    "ul",
    "ol",
    "li",
    // Таблицы и блоки — для разделов, перенесённых с kse.kg (тарифы, участники торгов, комитеты).
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "caption",
    "div",
    "hr",
    "sup",
    "sub",
    "blockquote",
    // Видео в тексте новости — только плеер YouTube или Vimeo (см. allowedIframeHostnames).
    "iframe",
  ],
  allowedAttributes: {
    "*": ["style", "class"],
    a: ["href", "target", "rel"],
    td: ["colspan", "rowspan", "style", "class"],
    th: ["colspan", "rowspan", "style", "class"],
    img: ["src", "alt", "width", "height", "style"],
    figure: ["data-align", "data-width", "data-ox", "data-oy", "class", "style"],
    figcaption: ["class"],
    iframe: ["src", "title", "allow", "allowfullscreen", "loading", "referrerpolicy"],
    div: ["class", "data-video"],
    span: ["style"],
    p: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
  },
  allowedStyles: {
    "*": {
      color: [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/, /^rgba\(/],
      "background-color": [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/, /^rgba\(/],
      "font-size": [/^\d+(?:px|em|rem|%)$/],
      "font-family": [/.+/],
      "font-weight": [/^\d+$/, /^bold$/, /^normal$/],
      "font-style": [/^italic$/, /^normal$/],
      "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
      width: [/^\d+(?:px|em|rem|%)$/],
      height: [/^\d+(?:px|em|rem|%)$/, /^auto$/],
      transform: [/^translate\(\s*-?\d+(?:\.\d+)?px\s*,\s*-?\d+(?:\.\d+)?px\s*\)$/],
    },
  },
  // data: — только у картинок: в ссылке он позволил бы открыть произвольный HTML.
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: {
    img: ["http", "https", "data"],
    iframe: ["https"],
  },
  allowedIframeHostnames: ["www.youtube-nocookie.com", "www.youtube.com", "player.vimeo.com"],
  allowIframeRelativeUrls: false,
  transformTags: {
    // Внешние ссылки открываются в новой вкладке без доступа к нашей странице (window.opener).
    a: (_tagName, attribs) => {
      const href = attribs.href ?? "";
      const external = /^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?kse\.kg(\/|$)/i.test(href);
      const linkAttribs: Record<string, string> = external ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };
      return { tagName: "a", attribs: linkAttribs };
    },
    // Плеер видео: только адрес встраивания; атрибуты задаём сами.
    iframe: (_tagName, attribs) => ({
      tagName: "iframe",
      attribs: {
        src: attribs.src ?? "",
        title: attribs.title || "Видео",
        allow: "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen",
        allowfullscreen: "",
        loading: "lazy",
        referrerpolicy: "strict-origin-when-cross-origin",
      },
    }),
    figure: (_tagName, attribs) => {
      const align = attribs["data-align"] ?? "inline";
      const width = align === "full" ? "100" : (attribs["data-width"] ?? "100");
      const ox = attribs["data-ox"] ?? "0";
      const oy = attribs["data-oy"] ?? "0";
      return {
        tagName: "figure",
        attribs: {
          class: "rte-figure",
          "data-align": align,
          "data-width": width,
          "data-ox": ox,
          "data-oy": oy,
          style: `width:${width}%;transform:translate(${ox}px, ${oy}px)`,
        },
      };
    },
    img: (_tagName, attribs) => ({
      tagName: "img",
      attribs: {
        src: attribs.src ?? "",
        alt: attribs.alt ?? "",
        style: "width:100%;height:auto",
      },
    }),
  },
};

export function sanitizeRichHtml(input: string) {
  if (!input.trim()) return "";
  if (!/<[a-z][\s\S]*>/i.test(input)) return input;
  return sanitizeHtml(input, options);
}
