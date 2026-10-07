"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/components/AppProviders";
import { isExternal, mergeResults, searchStatic, type SearchItem, type SearchResult } from "@/lib/site-search";
import ui from "@/app/ui.module.css";

/** В выпадающем окне — по несколько результатов на группу; всё остальное — на странице /search. */
const PER_GROUP = 4;

function HitLink({ item, onPick }: { item: SearchItem; onPick: () => void }) {
  const body = (
    <>
      <b>{item.title}</b>
      {item.meta ? <small>{item.meta}</small> : null}
    </>
  );
  // Отчёты эмитентов — внешние PDF, открываем в новой вкладке.
  return isExternal(item.href) ? (
    <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={onPick}>
      {body}
    </a>
  ) : (
    <Link href={item.href} onClick={onPick}>
      {body}
    </Link>
  );
}

export function HeaderSearch() {
  const { label, tr } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Ответ бэкенда (всё, что в базе) и запрос, к которому он относится.
  const [remote, setRemote] = useState<SearchResult | null>(null);

  // Перешли на другую страницу — поиск закрываем (прямо в рендере, без эффекта).
  const [openedOn, setOpenedOn] = useState(pathname);
  if (openedOn !== pathname) {
    setOpenedOn(pathname);
    setOpen(false);
  }

  const q = query.trim();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Запрос к бэкенду — через 250 мс после последней буквы.
  useEffect(() => {
    if (!q) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetch(`/api/public/search?q=${encodeURIComponent(q)}&limit=${PER_GROUP}`)
        .then((response) => (response.ok ? (response.json() as Promise<SearchResult>) : null))
        .then((data) => {
          if (!cancelled && data) setRemote(data);
        })
        .catch(() => undefined);
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [q]);

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

  // Данные из кода показываем сразу, ответ базы подмешиваем, когда придёт (только если он для этого же запроса).
  const results = useMemo(() => {
    if (!q) return null;
    return mergeResults(remote?.query === q ? remote : null, searchStatic(q, PER_GROUP), PER_GROUP);
  }, [q, remote]);
  const waiting = Boolean(q) && remote?.query !== q;
  const close = () => setOpen(false);

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
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!q) return;
              close();
              router.push(`/search?q=${encodeURIComponent(q)}`);
            }}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tr("Эмитент, тикер, отчёт, новость или раздел")}
              aria-label={label("search")}
            />
          </form>
          <div className={ui.searchHits}>
            {!q ? <p>{tr("Введите запрос")}</p> : null}
            {results && results.total === 0 ? <p>{waiting ? tr("Ищем…") : tr("Ничего не найдено")}</p> : null}
            {results?.groups.map((group) => (
              <section key={group.kind}>
                <h3>
                  {tr(group.label)} · {group.total}
                </h3>
                {group.items.map((item) => (
                  <HitLink key={item.href + item.title} item={item} onPick={close} />
                ))}
              </section>
            ))}
            {results && results.total > 0 ? (
              <Link className={ui.searchAll} href={`/search?q=${encodeURIComponent(q)}`} onClick={close}>
                {tr("Все результаты")} ({results.total}) →
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
