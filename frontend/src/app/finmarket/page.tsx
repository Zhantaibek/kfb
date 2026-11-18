import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/Forms";
import { PublicMain } from "@/components/PublicMain";
import css from "@/components/live/live.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Финансовый рынок KG" };

const apiUrl = process.env.API_URL ?? "http://localhost:4000";

type Issue = { title: string; date: string; url: string; size: number | null };

/** Выпуски журнала из нашей базы (fin_market_issues, перенесено из бэкапа старого сайта); PDF — у нас в uploads. */
async function loadIssues(): Promise<Issue[] | null> {
  try {
    const response = await fetch(`${apiUrl}/api/public/finmarket`, { cache: "no-store" });
    return response.ok ? ((await response.json()) as { rows: Issue[] }).rows : null;
  } catch {
    return null;
  }
}

/** 1334550 → «1,3 МБ». */
function fileSize(bytes: number | null) {
  if (!bytes) return "";
  return `${(bytes / 1024 / 1024).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} МБ`;
}

export default async function FinMarketPage() {
  const issues = await loadIssues();
  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / Направления
          </>
        }
        title="Финансовый рынок KG"
        lead="Информационно-аналитический журнал о рынке ценных бумаг Кыргызстана — все выпуски в PDF."
      />
      {issues?.length ? (
        <div className={css.files}>
          {issues.map((item) => (
            <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer">
              {item.title}
              <span>PDF{item.size ? ` · ${fileSize(item.size)}` : ""} ↗</span>
            </a>
          ))}
        </div>
      ) : (
        <p className={css.empty}>Выпуски журнала ещё не загружены.</p>
      )}
    </PublicMain>
  );
}
