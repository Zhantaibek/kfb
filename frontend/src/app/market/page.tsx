import type { Metadata } from "next";
import { LivePage } from "@/components/live/LiveParts";
import { loadSnapshot, type TradeResults } from "@/lib/kse-live";
import { TradeResultsView, MarketLinks } from "@/components/live/LiveViews";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Итоги торгов" };

/** Живые данные с kse.kg/ru/TradeResults (обновляются раз в 15 минут). */
export default async function Page() {
  const snapshot = await loadSnapshot<TradeResults>("trade-results");
  return (
    <LivePage
      title="Итоги торгов"
      crumb="Статистика торгов"
      lead="Объём торгов по рынкам и сделки по ценным бумагам: последний торговый день, неделя, месяц и год."
      snapshot={snapshot}
      sourceUrl="https://www.kse.kg/ru/TradeResults"
    >
      {snapshot ? <TradeResultsView data={snapshot.data} /> : null}
      <MarketLinks current="/market" />
    </LivePage>
  );
}
