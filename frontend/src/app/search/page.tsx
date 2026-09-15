import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/Forms";
import { instruments, members } from "@/data/catalog";
import { loadPublicContent } from "@/lib/cms/public";
import { sectionPages, siteNav } from "@/data/site-nav";
import ui from "@/app/ui.module.css";
import { PublicMain } from "@/components/PublicMain";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Поиск" };

const sectionIndex = [
  ...siteNav.flatMap((group) =>
    group.items.flatMap((item) =>
      item.children?.length
        ? item.children.map((child) => ({ href: child.href, label: child.label }))
        : [{ href: item.href, label: item.label }],
    ),
  ),
  ...Object.entries(sectionPages).map(([href, item]) => ({ href, label: item.title })),
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();
  const news = (await loadPublicContent()).news;
  const papers = query
    ? instruments.filter((item) => `${item.ticker} ${item.name} ${item.issuer}`.toLowerCase().includes(query))
    : [];
  const stories = query ? news.filter((item) => `${item.title} ${item.excerpt}`.toLowerCase().includes(query)) : [];
  const orgs = query ? members.filter((item) => item.name.toLowerCase().includes(query)) : [];
  const sections = query
    ? [
        ...new Map(
          sectionIndex
            .filter((item) => item.label.toLowerCase().includes(query))
            .map((item) => [item.href, item]),
        ).values(),
      ]
    : [];
  const total = papers.length + stories.length + orgs.length + sections.length;

  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / Поиск
          </>
        }
        title="Поиск по сайту"
        lead="Ищите раздел, тикер, эмитента, новость или участника торгов."
      />
      <form className={ui.toolbar} action="/search">
        <input className={ui.search} name="q" defaultValue={q} placeholder="Например: комитеты, KTEL или ГЦБ" />
        <button className={ui.primary} type="submit">
          Найти
        </button>
      </form>
      {!query ? <p className={ui.muted}>Введите запрос.</p> : null}
      {query && total === 0 ? <p>Ничего не найдено.</p> : null}
      {sections.length ? (
        <section className={ui.list}>
          <h2>Разделы</h2>
          {sections.map((item) => (
            <Link className={ui.row} href={item.href} key={item.href + item.label}>
              {item.label}
            </Link>
          ))}
        </section>
      ) : null}
      {papers.length ? (
        <section className={ui.list}>
          <h2>Инструменты</h2>
          {papers.map((item) => (
            <Link className={ui.row} href={`/market/${item.ticker}`} key={item.ticker}>
              <b>{item.ticker}</b>
              <span>{item.name}</span>
            </Link>
          ))}
        </section>
      ) : null}
      {stories.length ? (
        <section className={ui.list}>
          <h2>Новости</h2>
          {stories.map((item) => (
            <Link className={ui.row} href={`/news/${item.slug}`} key={item.slug}>
              {item.title}
            </Link>
          ))}
        </section>
      ) : null}
      {orgs.length ? (
        <section className={ui.list}>
          <h2>Участники</h2>
          {orgs.map((item) => (
            <Link className={ui.row} href="/members" key={item.name}>
              {item.name}
            </Link>
          ))}
        </section>
      ) : null}
    </PublicMain>
  );
}
