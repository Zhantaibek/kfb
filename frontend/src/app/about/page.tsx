import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/Forms";
import { siteNav } from "@/data/site-nav";
import ui from "@/app/ui.module.css";
import { PublicMain } from "@/components/PublicMain";

export const metadata: Metadata = { title: "О бирже" };

const aboutLinks = siteNav.find((item) => item.key === "about")?.items ?? [];

export default function AboutPage() {
  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / О нас / Общая информация
          </>
        }
        title="Кыргызская фондовая биржа"
        lead="ЗАО «Кыргызская фондовая биржа» — организованный рынок ценных бумаг, ГЦБ, товарно-сырьевого сектора и драгоценных металлов."
      />
      <div className={ui.grid}>
        <article className={ui.card}>
          <h2>Миссия</h2>
          <p>Соединяем компании и инвесторов, обеспечиваем прозрачные торги, клиринг и раскрытие информации.</p>
        </article>
        <article className={ui.card}>
          <h2>Лицензия</h2>
          <p>№37 НКРЦБ от 30.11.2000. Биржа работает с 1994 года, сайт ведёт хронику с 2004 года.</p>
        </article>
        <article className={ui.card}>
          <h2>Разделы «О нас»</h2>
          <ul>
            {aboutLinks.map((item) => (
              <li key={item.href + item.label}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </PublicMain>
  );
}
