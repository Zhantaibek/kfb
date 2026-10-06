import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/Forms";
import { PublicMain } from "@/components/PublicMain";
import { loadIssuerData } from "@/lib/cms/public";
import ui from "@/app/ui.module.css";
import css from "./disclosure.module.css";

function Pager({ page, pages }: { page: number; pages: number }) {
  return (
    <nav className={css.pager} aria-label="Страницы">
      {Array.from({ length: pages }, (_, index) => {
        const n = index + 1;
        return (
          <Link key={n} href={n === 1 ? "/disclosure" : `/disclosure?page=${n}`} data-on={String(n === page)}>
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

type Props = { searchParams: Promise<{ page?: string }> };

export default async function DisclosurePage({ searchParams }: Props) {
  const { issuers } = await loadIssuerData();
  const pages = Math.max(1, Math.ceil(issuers.length / perPage));
  const page = Math.min(Math.max(1, Number((await searchParams).page || "1") || 1), pages);
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
      <Pager page={page} pages={pages} />
    </PublicMain>
  );
}
