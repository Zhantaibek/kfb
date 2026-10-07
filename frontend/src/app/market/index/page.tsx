import type { Metadata } from "next";
import { LivePage } from "@/components/live/LiveParts";
import { loadSnapshot, type IndexData } from "@/lib/kse-live";
import { IndexView, MarketLinks } from "@/components/live/LiveViews";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Индекс и капитализация" };

/** Живые данные с kse.kg/ru/IndexAndCapitalization (обновляются раз в 15 минут). */
export default async function Page() {
  const snapshot = await loadSnapshot<IndexData>("index");
  return (
    <LivePage
      title="Индекс и капитализация"
      crumb="Статистика торгов"
      lead="Индекс KSE и рыночная капитализация листинговых компаний."
      snapshot={snapshot}
      sourceUrl="https://www.kse.kg/ru/IndexAndCapitalization"
    >
      {snapshot ? <IndexView data={snapshot.data} /> : null}
      <MarketLinks current="/market/index" />
    </LivePage>
  );
}
