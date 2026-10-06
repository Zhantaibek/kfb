"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { instruments, members } from "@/data/catalog";
import { sectionPages, siteNav } from "@/data/site-nav";
import { useApp } from "@/components/AppProviders";
import ui from "@/app/ui.module.css";

type NewsHit = { slug: string; title: string; excerpt: string; status: string };

const sections = [
  ...siteNav.flatMap((group) =>
    group.items.flatMap((item) =>
      item.children?.length
        ? item.children.map((child) => ({ href: child.href, label: child.label }))
        : [{ href: item.href, label: item.label }],
    ),
  ),
  ...Object.entries(sectionPages).map(([href, item]) => ({ href, label: item.title })),
];

function takeUnique(items: { href: string; label: string }[], query: string, limit: number) {
  const seen = new Set<string>();
  const hits: { href: string; label: string }[] = [];
  for (const item of items) {
    if (!item.label.toLowerCase().includes(query) || seen.has(item.href)) continue;
    seen.add(item.href);
    hits.push(item);
    if (hits.length >= limit) break;
  }
  return hits;
}

export function HeaderSearch() {
  const { label, tr } = useApp();
  const pathname = usePathname();
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [news, setNews] = useState<NewsHit[]>([]);

  // Перешли на другую страницу — поиск закрываем (прямо в рендере, без эффекта).
  const [openedOn, setOpenedOn] = useState(pathname);
  if (openedOn !== pathname) {
    setOpenedOn(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    if (news.length) return;
    void fetch("/api/public/content")
      .then((response) => response.json())
      .then((data: { news?: NewsHit[] }) => {
        setNews((data.news ?? []).filter((item) => item.status === "published"));
      })
      .catch(() => undefined);
  }, [open, news.length]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return { pages: [], papers: [], stories: [], orgs: [] };
    return {
      pages: takeUnique(sections, q, 5),
      papers: instruments
        .filter((item) => `${item.ticker} ${item.name} ${item.issuer}`.toLowerCase().includes(q))
        .slice(0, 5),
      stories: news.filter((item) => `${item.title} ${item.excerpt}`.toLowerCase().includes(q)).slice(0, 5),
      orgs: members.filter((item) => item.name.toLowerCase().includes(q)).slice(0, 5),
    };
  }, [q, news]);
  const total = results.pages.length + results.papers.length + results.stories.length + results.orgs.length;

  return (
    <div className={ui.searchBox} ref={boxRef}>
      <button
        className="icon-ghost"
        type="button"
        aria-label={label("search")}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3-3" />
        </svg>
      </button>
      {open ? (
        <div className={ui.searchPop} role="search">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tr("Например: комитеты, KTEL или ГЦБ")}
            aria-label={label("search")}
          />
          <div className={ui.searchHits}>
            {!q ? <p>{tr("Введите запрос")}</p> : null}
            {q && total === 0 ? <p>{tr("Ничего не найдено")}</p> : null}
            {results.pages.length ? (
              <section>
                <h3>{tr("Разделы")}</h3>
                {results.pages.map((item) => (
                  <Link href={item.href} key={item.href} onClick={() => setOpen(false)}>
                    {tr(item.label)}
                  </Link>
                ))}
              </section>
            ) : null}
            {results.papers.length ? (
              <section>
                <h3>{tr("Инструменты")}</h3>
                {results.papers.map((item) => (
                  <Link href={`/market/${item.ticker}`} key={item.ticker} onClick={() => setOpen(false)}>
                    <b>{item.ticker}</b>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </section>
            ) : null}
            {results.stories.length ? (
              <section>
                <h3>{tr("Новости")}</h3>
                {results.stories.map((item) => (
                  <Link href={`/news/${item.slug}`} key={item.slug} onClick={() => setOpen(false)}>
                    {item.title}
                  </Link>
                ))}
              </section>
            ) : null}
            {results.orgs.length ? (
              <section>
                <h3>{tr("Участники")}</h3>
                {results.orgs.map((item) => (
                  <Link href="/members" key={item.name} onClick={() => setOpen(false)}>
                    {item.name}
                  </Link>
                ))}
              </section>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
