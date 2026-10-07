import type { Metadata } from "next";
import { LivePage } from "@/components/live/LiveParts";
import { loadSnapshot, type Quotes } from "@/lib/kse-live";
import { QuotesView, MarketLinks } from "@/components/live/LiveViews";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Котировки по ценным бумагам" };

/** Живые данные с kse.kg/ru/Quotes (обновляются раз в 15 минут). */
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const snapshot = await loadSnapshot<Quotes>("quotes");
  return (
    <LivePage
      title="Котировки по ценным бумагам"
      crumb="Статистика торгов"
      lead="Лучшие заявки на покупку и продажу по каждой бумаге."
      snapshot={snapshot}
      sourceUrl="https://www.kse.kg/ru/Quotes"
    >
      {snapshot ? <QuotesView data={snapshot.data} initialQuery={q} /> : null}
      <MarketLinks current="/market/quotes" />
    </LivePage>
  );
}
