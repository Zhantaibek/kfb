"use client";

import Link from "next/link";
import { applyLocale } from "@/lib/cms/locale";
import type { CmsMenuItem } from "@/lib/cms/types";
import { useLang } from "@/lib/use-tr";
import type { ReactNode } from "react";

// Порядок в iconByHref важен: более длинные адреса раньше коротких (/market/archive раньше /market).
import css from "./landing.module.css";

const icons: Record<string, ReactNode> = {
  people: <path d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 2c-2.7 0-8 1.3-8 4v3h10v-3c0-1 .4-1.9 1.1-2.6A13 13 0 0 0 8 13Zm8 0c-.4 0-.8 0-1.3.1A4.3 4.3 0 0 1 16.5 17v3H24v-3c0-2.7-5.3-4-8-4Z" />,
  doc: <path d="M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 5v2h8V8H8Zm0 4v2h8v-2H8Zm0 4v2h5v-2H8Z" />,
  results: <path d="M4 4h16v16H4V4Zm2 2v12h12V6H6Zm2 3h3v2H8V9Zm0 4h3v2H8v-2Zm5-3.5 1.4-1.4 1.1 1.1 2.1-2.1L18 7.5l-3.5 3.5-1.5-1.5Z" />,
  folder: <path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Zm2 4v8h14v-8H5Z" />,
  briefcase: <path d="M9 4h6a2 2 0 0 1 2 2v1h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h3V6a2 2 0 0 1 2-2Zm0 3h6V6H9v1Zm-4 5v6h14v-6h-5v2h-4v-2H5Z" />,
  quotes: <path d="M3 5h18v14H3V5Zm2 2v10h2V7H5Zm4 0v10h2V7H9Zm4 0v10h2V7h-2Zm4 0v10h2V7h-2Z" />,
  calendar: <path d="M4 6h16v2H4V6Zm0 5h12v2H4v-2Zm0 5h16v2H4v-2Z" />,
};

/** Значок карточки — по адресу подраздела; новые пункты из админки получают значок документа. */
const iconByHref: [string, keyof typeof icons][] = [
  ["/about/management", "people"],
  ["/market/archive", "folder"],
  ["/market/index", "briefcase"],
  ["/market/quotes", "quotes"],
  ["/market", "results"],
  ["/gcb", "calendar"],
];

function iconFor(href: string) {
  const path = href.replace(/\/$/, "");
  return icons[iconByHref.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))?.[1] ?? "doc"];
}

/**
 * Раздел-«хаб» как на kse.kg: карточки-ссылки на подразделы.
 * Карточки — пункты меню группы (hub-about, hub-statistics) из админки «Карточки разделов».
 */
export function HubCards({ items, group }: { items: CmsMenuItem[]; group: string }) {
  const lang = useLang();
  const cards = items
    .filter((item) => item.group === group)
    .sort((a, b) => a.order - b.order)
    .map((item) => applyLocale(item, lang, ["label"]));
  return (
    <div className={css.hubGrid}>
      {cards.map((item) => (
        <Link key={item.id} className={css.hubCard} href={item.href}>
          <span className={css.hubIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              {iconFor(item.href)}
            </svg>
          </span>
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
