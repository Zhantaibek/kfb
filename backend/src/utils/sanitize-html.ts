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
  ],
  allowedAttributes: {
    "*": ["style", "class"],
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height", "style"],
    figure: ["data-align", "data-width", "data-ox", "data-oy", "class", "style"],
    figcaption: ["class"],
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
  allowedSchemes: ["http", "https", "mailto", "data"],
  allowedSchemesByTag: {
    img: ["http", "https", "data"],
  },
  transformTags: {
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
