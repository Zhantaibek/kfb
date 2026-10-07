import type { Metadata } from "next";
import { LivePage } from "@/components/live/LiveParts";
import { loadSnapshot, type AuctionResults } from "@/lib/kse-live";
import { AuctionResultsView, MarketLinks } from "@/components/live/LiveViews";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Результаты аукционов ГЦБ" };

/** Живые данные с kse.kg/ru/AuctionResult (обновляются раз в 15 минут). */
export default async function Page() {
  const snapshot = await loadSnapshot<AuctionResults>("auction-results");
  return (
    <LivePage
      title="Результаты аукционов ГЦБ"
      crumb="ГЦБ"
      lead="Объём предложения, спрос, продажи и доходность по аукционам государственных ценных бумаг."
      snapshot={snapshot}
      sourceUrl="https://www.kse.kg/ru/AuctionResult"
    >
      {snapshot ? <AuctionResultsView data={snapshot.data} /> : null}
      <MarketLinks current="/gcb/results" />
    </LivePage>
  );
}
