import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/Forms";
import ui from "@/app/ui.module.css";
import { PublicMain } from "@/components/PublicMain";

export const metadata: Metadata = { title: "Исламские финансы" };

export default function IslamicPage() {
  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / Исламские финансы
          </>
        }
        title="Биржевая исламская экосистема"
        lead="КФБ развивает инструменты, соответствующие принципам шариата, совместно с международными партнёрами."
      />
      <article className={ui.card}>
        <p>
          Стратегическое соглашение с Международным институтом NAHDA предусматривает обучение участников, цифровую
          инфраструктуру размещения и отдельные правила листинга исламских инструментов.
        </p>
        <Link className={ui.primary} href="/news/nahda-islamic-ecosystem" style={{ marginTop: 16, display: "inline-flex" }}>
          Читать новость
        </Link>
      </article>
    </PublicMain>
  );
}
