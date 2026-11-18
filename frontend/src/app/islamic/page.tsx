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
        {/* Новость о соглашении — в архиве старого сайта kse.kg. */}
        <a
          className={ui.primary}
          href="https://www.kse.kg/ru/RussianNewsBlog/9426"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginTop: 16, display: "inline-flex" }}
        >
          Читать новость ↗
        </a>
      </article>
    </PublicMain>
  );
}
