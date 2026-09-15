"use client";

import { cloneElement, isValidElement, type ReactNode } from "react";
import { useApp } from "@/components/AppProviders";
import { tr, type Lang } from "@/lib/i18n";

export function useTr() {
  const { lang } = useApp();
  return (text: string) => tr(lang, text);
}

export function useLang(): Lang {
  return useApp().lang;
}

const textProps = ["placeholder", "aria-label", "title", "alt"] as const;

export function localizeNode(node: ReactNode, translate: (text: string) => string): ReactNode {
  if (node == null || typeof node === "boolean") return node;
  if (typeof node === "number") return node;
  if (typeof node === "string") return translate(node);
  if (Array.isArray(node)) {
    return node.map((item, index) => {
      const next = localizeNode(item, translate);
      return isValidElement(next) && next.key == null ? cloneElement(next, { key: index }) : next;
    });
  }
  if (!isValidElement(node)) return node;

  const props = { ...(node.props as Record<string, unknown>) };
  if ("children" in props) props.children = localizeNode(props.children as ReactNode, translate);
  for (const key of textProps) {
    if (typeof props[key] === "string") props[key] = translate(props[key] as string);
  }
  return cloneElement(node, props);
}

export function Localized({ children }: { children: ReactNode }) {
  const translate = useTr();
  return localizeNode(children, translate);
}
