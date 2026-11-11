"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { isExternal, mergeResults, normalizeQuery, searchStatic, type SearchItem, type SearchResult } from "@/lib/site-search";
import css from "./poisk.module.css";

/** Короткие ярлыки групп выдачи настоящего поиска сайта (lib/site-search + /api/public/search): длинные названия («Разделы и страницы») не помещаются в метку строки. */
const kindLabel: Record<string, string> = {
  pages: "Раздел",
  instruments: "Бумага",
  listing: "Листинг",
  issuers: "Эмитент",
  news: "Новость",
  documents: "Документ",
  people: "Руководство",
  members: "Участник",
  partners: "Партнёр",
  courses: "Курс",
};
type Row = SearchItem & { kind: string; group: string };

export type Paper = { ticker: string; name: string; price: number; change: number; volume: number; href: string };
export type Market = {
  papers: Paper[];
  index: { value: number; change: number; spark: string };
  session: { open: boolean; label: string; hours: string; date: string };
  auction: { date: string; type: string; volume: string; status: string } | null;
};

/** Мгновенный ответ над выдачей: карточка бумаги, индекс, ближайший аукцион или статус сессии. */
type Answer =
  | { kind: "paper"; href: string; paper: Paper }
  | { kind: "index"; href: string }
  | { kind: "auction"; href: string }
  | { kind: "session"; href: string };

/** В подсказках — по три результата на группу; полная выдача — на странице /search. */
const PER_GROUP = 3;
const LIMIT = 8;
const RECENT_KEY = "kse-poisk-recent";

const nf = (digits: number) => new Intl.NumberFormat("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const pct = (value: number) => `${value > 0 ? "+" : ""}${nf(2).format(value)}%`;

function findAnswer(q: string, market: Market): Answer | null {
  const n = normalizeQuery(q);
  if (!n) return null;
  const paper =
    market.papers.find((item) => item.ticker.toLowerCase() === n) ??
    (n.length >= 3 ? market.papers.find((item) => item.ticker.toLowerCase().startsWith(n)) : undefined);
  if (paper) return { kind: "paper", href: paper.href, paper };
  if (/^(индекс|kse|ксе)/.test(n)) return { kind: "index", href: "/market/index" };
  if (market.auction && /^(гцб|аукцион|гкв|гко|казнач)/.test(n)) return { kind: "auction", href: "/gcb" };
  if (/^(сесси|торги|когда торг|время торг|часы)/.test(n)) return { kind: "session", href: "/market" };
  return null;
}

/** Подсвечивает слова запроса в тексте (регистр и «ё» не важны). */
function highlight(text: string, q: string): ReactNode {
  const words = normalizeQuery(q).split(" ").filter((word) => word.length > 1);
  if (!words.length) return text;
  const plain = text.toLowerCase().replace(/ё/g, "е");
  const marks: [number, number][] = [];
  for (const word of words) {
    for (let at = plain.indexOf(word); at !== -1; at = plain.indexOf(word, at + word.length)) marks.push([at, at + word.length]);
  }
  if (!marks.length) return text;
  marks.sort((a, b) => a[0] - b[0]);
  const parts: ReactNode[] = [];
  let pos = 0;
  for (const [start, end] of marks) {
    if (start < pos) continue;
    if (start > pos) parts.push(text.slice(pos, start));
    parts.push(<mark key={start}>{text.slice(start, end)}</mark>);
    pos = end;
  }
  parts.push(text.slice(pos));
  return parts.map((part, i) => <Fragment key={i}>{part}</Fragment>);
}

function readRecent(): string[] {
  try {
    const saved = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === "string").slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecent(list: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // Хранилище недоступно (приватный режим) — просто не запоминаем.
  }
}

/**
 * Строка поиска первого экрана. Данные из кода показываются сразу, ответ базы подмешивается, когда придёт.
 * Над выдачей — мгновенный ответ по данным рынка. Стрелки выбирают строку, Enter открывает, Esc очищает,
 * «/» ставит курсор в поле. Пустое поле показывает недавние запросы этого посетителя.
 */
export function SearchBox({ hints, market }: { hints: string[]; market: Market }) {
  const router = useRouter();
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<SearchResult | null>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const q = query.trim();

  useEffect(() => setRecent(readRecent()), []);

  // Запрос к бэкенду — через 250 мс после последней буквы, как в поиске шапки сайта.
  useEffect(() => {
    if (!q) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetch(`/api/public/search?q=${encodeURIComponent(q)}&limit=${PER_GROUP * 2}`)
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
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) && !target.isContentEditable) {
        event.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const answer = useMemo(() => findAnswer(q, market), [q, market]);

  const rows = useMemo<Row[]>(() => {
    if (!q) return [];
    const result = mergeResults(remote?.query === q ? remote : null, searchStatic(q, PER_GROUP * 2), PER_GROUP * 2);
    return result.groups
      .flatMap((group) => group.items.slice(0, PER_GROUP).map((item) => ({ ...item, kind: group.kind, group: kindLabel[group.kind] ?? group.label })))
      .filter((row) => row.href !== answer?.href)
      .slice(0, LIMIT);
  }, [q, remote, answer]);

  // Строки для клавиатуры: мгновенный ответ (если есть) идёт первым.
  const hrefs = [...(answer ? [answer.href] : []), ...rows.map((row) => row.href)];
  const waiting = Boolean(q) && remote?.query !== q;
  const shown = open && (Boolean(q) || recent.length > 0);
  const all = `/search?q=${encodeURIComponent(q)}`;
  const optionId = (i: number) => `${listId}-${i}`;

  const go = (href: string, text = q) => {
    setOpen(false);
    if (text) {
      const next = [text, ...recent.filter((item) => item.toLowerCase() !== text.toLowerCase())].slice(0, 5);
      setRecent(next);
      saveRecent(next);
    }
    if (isExternal(href)) window.open(href, "_blank", "noopener,noreferrer");
    else router.push(href);
  };

  const pick = (text: string) => {
    setQuery(text);
    setActive(0);
    setOpen(true);
    input.current?.focus();
  };

  return (
    <div className={css.search}>
      <form
        className={css.field}
        role="search"
        action="/search"
        onSubmit={(event) => {
          event.preventDefault();
          if (!q) return;
          go(hrefs[active] ?? all);
        }}
      >
        <svg className={css.fieldIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4" />
        </svg>
        <input
          ref={input}
          name="q"
          type="search"
          role="combobox"
          aria-label="Поиск по бирже"
          aria-expanded={shown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={shown && q && hrefs[active] ? optionId(active) : undefined}
          placeholder="Найти бумагу, компанию или раздел"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((i) => Math.min(i + 1, hrefs.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (event.key === "Escape") {
              if (query) setQuery("");
              else setOpen(false);
            }
          }}
        />
        {waiting ? <span className={css.spinner} aria-hidden="true" /> : null}
        <kbd className={css.slash} aria-hidden="true">
          /
        </kbd>

        {shown ? (
          <div className={css.results}>
            {!q ? (
              <div className={css.recent}>
                <p>
                  Недавние запросы
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setRecent([]);
                      saveRecent([]);
                    }}
                  >
                    Очистить
                  </button>
                </p>
                <ul>
                  {recent.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          pick(item);
                        }}
                      >
                        <span aria-hidden="true">↺</span>
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <>
                <ul id={listId} role="listbox" aria-label="Результаты поиска" aria-busy={waiting}>
                  {answer ? (
                    <li
                      id={optionId(0)}
                      role="option"
                      aria-selected={active === 0}
                      className={css.answerRow}
                      onMouseEnter={() => setActive(0)}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        go(answer.href);
                      }}
                    >
                      <AnswerCard answer={answer} market={market} />
                    </li>
                  ) : null}
                  {rows.map((row, i) => {
                    const n = i + (answer ? 1 : 0);
                    return (
                      <li
                        key={`${row.kind}-${row.href}-${row.title}`}
                        id={optionId(n)}
                        role="option"
                        aria-selected={n === active}
                        onMouseEnter={() => setActive(n)}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          go(row.href);
                        }}
                      >
                        <span className={css.kind} data-kind={row.kind}>
                          {row.group}
                        </span>
                        <span className={css.resultText}>
                          <b>{highlight(row.title, q)}</b>
                          {row.meta ? <small>{row.meta}</small> : null}
                        </span>
                        <span className={css.enter} aria-hidden="true">
                          ↵
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {!answer && !rows.length ? (
                  <div className={css.empty}>
                    <p>{waiting ? "Ищем по базе биржи…" : `По запросу «${q}» ничего не нашлось.`}</p>
                    {!waiting ? (
                      <p className={css.emptyHints}>
                        Попробуйте:
                        {hints.slice(0, 3).map((hint) => (
                          <button
                            key={hint}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              pick(hint);
                            }}
                          >
                            {hint}
                          </button>
                        ))}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <div className={css.resultsFoot}>
                  <a
                    href={all}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      go(all);
                    }}
                  >
                    Все результаты по запросу «{q}» →
                  </a>
                  <span aria-hidden="true">
                    <kbd>↑</kbd>
                    <kbd>↓</kbd> выбрать · <kbd>Enter</kbd> открыть · <kbd>Esc</kbd> очистить
                  </span>
                </div>
              </>
            )}
          </div>
        ) : null}
      </form>

      <p className={css.hints}>
        <span>Например:</span>
        {hints.map((hint) => (
          <button key={hint} type="button" onClick={() => pick(hint)}>
            {hint}
          </button>
        ))}
      </p>
    </div>
  );
}

function AnswerCard({ answer, market }: { answer: Answer; market: Market }) {
  if (answer.kind === "paper") {
    const { paper } = answer;
    return (
      <span className={css.answerCard}>
        <span className={css.answerBadge}>{paper.ticker.slice(0, 2)}</span>
        <span className={css.answerMain}>
          <small>Бумага · последняя сессия</small>
          <b>
            {paper.ticker} <span>{paper.name}</span>
          </b>
        </span>
        <span className={css.answerFigures}>
          <b>{nf(2).format(paper.price)} сом</b>
          <small className={paper.change > 0 ? css.up : paper.change < 0 ? css.down : undefined}>
            {paper.change ? pct(paper.change) : "без изменений"} · объём {nf(1).format(paper.volume)}
          </small>
        </span>
      </span>
    );
  }
  if (answer.kind === "index") {
    return (
      <span className={css.answerCard}>
        <span className={css.answerBadge}>KSE</span>
        <span className={css.answerMain}>
          <small>Индекс KSE · {market.session.date}</small>
          <b>{nf(2).format(market.index.value)}</b>
        </span>
        <span className={css.answerFigures}>
          {market.index.spark ? (
            <svg viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true">
              <path d={market.index.spark} />
            </svg>
          ) : null}
          <small className={market.index.change >= 0 ? css.up : css.down}>{pct(market.index.change)} за сессию</small>
        </span>
      </span>
    );
  }
  if (answer.kind === "auction" && market.auction) {
    return (
      <span className={css.answerCard}>
        <span className={css.answerBadge}>ГЦБ</span>
        <span className={css.answerMain}>
          <small>Ближайший аукцион ГЦБ</small>
          <b>
            {market.auction.date} <span>{market.auction.type}</span>
          </b>
        </span>
        <span className={css.answerFigures}>
          <b>{market.auction.volume}</b>
          <small>{market.auction.status}</small>
        </span>
      </span>
    );
  }
  return (
    <span className={css.answerCard}>
      <span className={css.answerBadge} data-open={market.session.open || undefined}>
        ●
      </span>
      <span className={css.answerMain}>
        <small>Торговая сессия</small>
        <b>{market.session.label}</b>
      </span>
      <span className={css.answerFigures}>
        <b>{market.session.hours}</b>
        <small>по будням, время Бишкека</small>
      </span>
    </span>
  );
}
