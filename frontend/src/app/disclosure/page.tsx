import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/Forms";
import { PublicMain } from "@/components/PublicMain";
import { loadIssuerData } from "@/lib/cms/public";
import ui from "@/app/ui.module.css";
import css from "./disclosure.module.css";

function Pager({ page, pages, q }: { page: number; pages: number; q: string }) {
  const href = (n: number) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (n > 1) query.set("page", String(n));
    return query.size ? `/disclosure?${query}` : "/disclosure";
  };
  return (
    <nav className={css.pager} aria-label="Страницы">
      {Array.from({ length: pages }, (_, index) => {
        const n = index + 1;
        return (
          <Link key={n} href={href(n)} data-on={String(n === page)}>
            {n}
          </Link>
        );
      })}
    </nav>
  );
}

const perPage = 15;

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Центр раскрытия информации" };

type Props = { searchParams: Promise<{ page?: string; q?: string }> };

export default async function DisclosurePage({ searchParams }: Props) {
  const { issuers: all } = await loadIssuerData();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  // Поиск по эмитенту, как на kse.kg: без учёта регистра, кавычек и формы собственности в любом месте названия.
  const plain = (text: string) => text.toLowerCase().replace(/[«»"“”]/g, "");
  const issuers = q ? all.filter((item) => plain(item.name).includes(plain(q))) : all;
  const pages = Math.max(1, Math.ceil(issuers.length / perPage));
  const page = Math.min(Math.max(1, Number(params.page || "1") || 1), pages);
  const rows = issuers.slice((page - 1) * perPage, page * perPage);

  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / <Link href="/listing">Листинг</Link> / Центр раскрытия информации
          </>
        }
        title="Центр раскрытия информации"
      />
      <p className={css.note}>
        Для публикации периодической отчетности и информации о существенных фактах эмитенты могут воспользоваться электронной системой ЗАО «Кыргызская фондовая биржа» по ссылке{" "}
        <a href="https://oi.kse.kg/" target="_blank" rel="noreferrer">
          oi.kse.kg
        </a>
        .
        <br />
        Получить доступ (Логин, Пароль) к личному кабинету эмитента можно в Департаменте раскрытия информации ЗАО «Кыргызская фондовая биржа» по телефону: (0312) 45-40-53
      </p>
      <form className={css.search} action="/disclosure" role="search">
        <input name="q" type="search" defaultValue={q} placeholder="Поиск по эмитенту" aria-label="Поиск по эмитенту" />
        <button type="submit" aria-label="Найти">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>
      </form>
      {q && !issuers.length ? <p className={css.note}>По запросу «{q}» эмитентов не найдено.</p> : null}
      <div className={`${ui.tableWrap} ${css.kv}`}>
        <table>
          <thead>
            <tr>
              <th>Наименование</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.slug}>
                <td>
                  <Link href={`/disclosure/${item.slug}`}>{item.name}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={pages} q={q} />
    </PublicMain>
  );
}
