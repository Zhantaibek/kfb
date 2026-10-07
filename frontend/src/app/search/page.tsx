import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/Forms";
import { PublicMain } from "@/components/PublicMain";
import { isExternal, mergeResults, searchStatic, type SearchResult } from "@/lib/site-search";
import ui from "@/app/ui.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Поиск" };

const apiUrl = process.env.API_URL ?? "http://localhost:4000";
/** На странице поиска — до 50 результатов в каждой группе. */
const PER_GROUP = 50;

async function searchDatabase(query: string): Promise<SearchResult | null> {
  try {
    const response = await fetch(`${apiUrl}/api/public/search?q=${encodeURIComponent(query)}&limit=${PER_GROUP}`, {
      cache: "no-store",
    });
    return response.ok ? ((await response.json()) as SearchResult) : null;
  } catch {
    return null;
  }
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const result = query ? mergeResults(await searchDatabase(query), searchStatic(query, PER_GROUP), PER_GROUP) : null;

  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / Поиск
          </>
        }
        title="Поиск по сайту"
        lead="Разделы и тексты страниц, эмитенты и их отчёты, листинг, котировки, новости, руководство, участники торгов, партнёры и курсы учебного центра."
      />
      <form className={ui.toolbar} action="/search">
        <input className={ui.search} name="q" defaultValue={q} placeholder="Например: аэропорт, MAIR4, аудиторский отчёт, ГЦБ" />
        <button className={ui.primary} type="submit">
          Найти
        </button>
      </form>

      {!query ? <p className={ui.muted}>Введите запрос.</p> : null}
      {result ? (
        <p className={ui.muted}>
          {result.total ? `Найдено: ${result.total}` : "Ничего не найдено. Попробуйте другое слово или часть названия."}
        </p>
      ) : null}

      {result?.groups.map((group) => (
        <section className={ui.list} key={group.kind}>
          <h2>
            {group.label} <small>{group.total}</small>
          </h2>
          {group.items.map((item) => {
            const body = (
              <>
                <b>{item.title}</b>
                {item.meta ? <small>{item.meta}</small> : null}
                {item.snippet ? <span>{item.snippet}</span> : null}
              </>
            );
            return isExternal(item.href) ? (
              <a className={`${ui.row} ${ui.searchRow}`} href={item.href} target="_blank" rel="noopener noreferrer" key={item.href + item.title}>
                {body}
              </a>
            ) : (
              <Link className={`${ui.row} ${ui.searchRow}`} href={item.href} key={item.href + item.title}>
                {body}
              </Link>
            );
          })}
          {group.total > group.items.length ? (
            <p className={ui.muted}>
              Показаны первые {group.items.length} из {group.total} — уточните запрос.
            </p>
          ) : null}
        </section>
      ))}
    </PublicMain>
  );
}
