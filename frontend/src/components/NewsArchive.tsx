"use client";

import { useEffect, useState } from "react";
import { useLang, useTr } from "@/lib/use-tr";
import css from "./NewsArchive.module.css";

type ArchiveItem = { slug: string; date: string; title: string; tag: string; url: string };
type ArchivePage = { items: ArchiveItem[]; total: number; page: number; pageSize: number };

/** «2026-11-09» → «09.11.2026». */
const dotDate = (iso: string) => iso.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3.$2.$1");

const locale = (lang: string) => (lang === "en" ? "en-GB" : lang === "ky" ? "ky-KG" : "ru-RU");

/** Новости страницы, сгруппированные по месяцам («2026-11»), в исходном порядке. */
function byMonth(items: ArchiveItem[]) {
  const groups: { key: string; items: ArchiveItem[] }[] = [];
  for (const item of items) {
    const key = item.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, items: [item] });
  }
  return groups;
}

/** «2026-11» → «Ноябрь 2026». */
function monthLabel(key: string, lang: string) {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  const text = new Intl.DateTimeFormat(locale(lang), { month: "long", year: "numeric", timeZone: "UTC" }).format(Date.UTC(year, month - 1, 1));
  return (text.charAt(0).toUpperCase() + text.slice(1)).replace(/\s*г\.$/, "");
}

/** «2026-11-09» → «пн». */
function weekday(iso: string, lang: string) {
  const time = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(time)) return "";
  return new Intl.DateTimeFormat(locale(lang), { weekday: "short", timeZone: "UTC" }).format(time).replace(".", "");
}

/**
 * Архив новостей старого сайта kse.kg: только дата, рубрика и заголовок; полный текст открывается на старом сайте.
 * Загружается постранично из /api/public/news/archive на языке сайта. issuerSlug — новости одной компании
 * (на её странице), без него — общий архив с поиском (страница «Новости»).
 */
export function NewsArchive({ issuerSlug }: { issuerSlug?: string }) {
  const tr = useTr();
  const lang = useLang();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<ArchivePage | null>(null);
  const [failed, setFailed] = useState(false);

  // Поиск — с паузой, чтобы не запрашивать на каждую букву.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams({ lang, page: String(page) });
    if (search && !issuerSlug) params.set("q", search);
    const path = issuerSlug ? `/api/public/news/archive/issuer/${encodeURIComponent(issuerSlug)}` : "/api/public/news/archive";
    const controller = new AbortController();
    fetch(`${path}?${params}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((next: ArchivePage) => {
        setData(next);
        setFailed(false);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setFailed(true);
      });
    return () => controller.abort();
  }, [lang, page, search, issuerSlug]);

  // У компании без архивных новостей блок не показываем вовсе.
  if (issuerSlug && data && data.total === 0) return null;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const headingId = issuerSlug ? `archive-${issuerSlug}` : "news-archive";

  return (
    <section className={css.archive} aria-labelledby={headingId}>
      <header className={css.head}>
        <div>
          <h2 id={headingId}>{tr("Архив новостей")}</h2>
          <p>{tr("Новости прежнего сайта биржи. Полный текст откроется на kse.kg.")}</p>
        </div>
        {issuerSlug ? null : (
          <input
            className={css.search}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tr("Поиск по заголовку")}
            aria-label={tr("Поиск по архиву новостей")}
          />
        )}
      </header>

      {failed ? <p className={css.note}>{tr("Архив сейчас недоступен. Попробуйте позже.")}</p> : null}
      {data && !data.items.length ? <p className={css.note}>{tr("Ничего не найдено.")}</p> : null}

      {data?.items.length ? (
        <div className={css.months}>
          {byMonth(data.items).map((group) => (
            <section className={css.month} key={group.key}>
              <h3 className={css.monthTitle}>{monthLabel(group.key, lang)}</h3>
              <ul className={css.list}>
                {group.items.map((item) => (
                  <li key={item.slug}>
                    <a className={css.item} href={item.url} target="_blank" rel="noopener noreferrer" title={tr("на старом сайте")}>
                      <time className={css.day} dateTime={item.date} aria-label={dotDate(item.date)}>
                        <b>{item.date.slice(8, 10)}</b>
                        <span>{weekday(item.date, lang)}</span>
                      </time>
                      <span className={css.body}>
                        <span className={css.tag}>{item.tag}</span>
                        <span className={css.title}>{item.title}</span>
                      </span>
                      <span className={css.external} aria-hidden="true">
                        ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}

      {data && pages > 1 ? (
        <nav className={css.pager} aria-label={tr("Страницы архива")}>
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            ← {tr("Новее")}
          </button>
          <span>
            {page} / {pages}
          </span>
          <button type="button" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>
            {tr("Старее")} →
          </button>
        </nav>
      ) : null}
    </section>
  );
}
