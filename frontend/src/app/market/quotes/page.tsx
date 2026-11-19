import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/Forms";
import { PublicMain } from "@/components/PublicMain";
import { loadOracleQuotes } from "@/lib/kse-live";
import { QuotesView, MarketLinks } from "@/components/live/LiveViews";
import css from "@/components/live/live.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Котировки по ценным бумагам" };

/** Котировки из торговой системы (Oracle): лучшие заявки на покупку и продажу, разделы по виду бумаги. */
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const quotes = await loadOracleQuotes();
  const updated = quotes ? new Date(quotes.fetchedAt).toLocaleString("ru-RU", { timeZone: "Asia/Bishkek", dateStyle: "short", timeStyle: "short" }) : "";
  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / Статистика торгов
          </>
        }
        title="Котировки по ценным бумагам"
        lead={`Лучшие заявки на покупку и продажу по каждой бумаге${updated ? ` · обновлено ${updated}` : ""}.`}
      />
      {quotes ? (
        <QuotesView data={quotes.data} initialQuery={q} />
      ) : (
        <p className={css.empty}>Котировки из торговой системы ещё не загружены.</p>
      )}
      <MarketLinks current="/market/quotes" />
    </PublicMain>
  );
}
