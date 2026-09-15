"use client";

import { translateHtml } from "@/lib/i18n";
import { useLang } from "@/lib/use-tr";
import styles from "./rich-html.module.css";

type Props = {
  html: string;
  className?: string;
};

function isHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function plainToHtml(value: string) {
  if (!value.trim()) return "";
  if (isHtml(value)) return value;
  return value
    .split(/\n+/)
    .filter(Boolean)
    .map((line) => `<p>${line.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    .join("");
}

function applyFigureLayout(html: string) {
  const withFigures = html.replace(/<figure\b([^>]*)>/gi, (full, attrs: string) => {
    if (!/rte-figure/.test(attrs) && !/data-align|data-width/.test(attrs)) return full;
    const align = /data-align="([^"]*)"/.exec(attrs)?.[1] ?? "inline";
    const rawWidth = /data-width="(\d+)"/.exec(attrs)?.[1] ?? "100";
    const width = align === "full" ? "100" : rawWidth;
    const ox = /data-ox="(-?\d+)"/.exec(attrs)?.[1] ?? "0";
    const oy = /data-oy="(-?\d+)"/.exec(attrs)?.[1] ?? "0";
    const layout = `width:${width}%;transform:translate(${ox}px, ${oy}px)`;
    if (/\bstyle=/.test(attrs)) {
      return full.replace(/style="([^"]*)"/i, (_m, style: string) => {
        const cleaned = style
          .replace(/width\s*:\s*[^;]+;?/gi, "")
          .replace(/transform\s*:\s*[^;]+;?/gi, "")
          .replace(/;+$/g, "")
          .trim();
        const next = [cleaned, layout].filter(Boolean).join(";");
        return `style="${next}"`;
      });
    }
    return `<figure${attrs} style="${layout}">`;
  });
  return withFigures.replace(/<img\b([^>]*)>/gi, (_full, attrs: string) => {
    if (/\bstyle=/i.test(attrs)) {
      const next = attrs.replace(/style="([^"]*)"/i, (_m: string, style: string) => {
        const cleaned = style
          .replace(/width\s*:\s*[^;]+;?/gi, "")
          .replace(/height\s*:\s*[^;]+;?/gi, "")
          .replace(/;+$/g, "")
          .trim();
        return `style="${[cleaned, "width:100%", "height:auto"].filter(Boolean).join(";")}"`;
      });
      return `<img${next}>`;
    }
    return `<img${attrs} style="width:100%;height:auto">`;
  });
}

export function RichHtml({ html, className }: Props) {
  const lang = useLang();
  const content = applyFigureLayout(translateHtml(lang, plainToHtml(html)));
  if (!content) return null;
  return <div className={[styles.prose, className].filter(Boolean).join(" ")} dangerouslySetInnerHTML={{ __html: content }} />;
}
