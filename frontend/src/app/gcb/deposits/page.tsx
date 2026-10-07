import type { Metadata } from "next";
import { LivePage } from "@/components/live/LiveParts";
import { loadSnapshot, type DepositAuctions } from "@/lib/kse-live";
import { DepositsView, MarketLinks } from "@/components/live/LiveViews";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Результаты аукционов по депозитам" };

/** Живые данные с kse.kg/ru/MfaResult (обновляются раз в 15 минут). */
export default async function Page() {
  const snapshot = await loadSnapshot<DepositAuctions>("deposit-auctions");
  return (
    <LivePage
      title="Результаты аукционов по депозитам"
      crumb="ГЦБ"
      lead="Аукционы по размещению средств из счёта смягчения в депозиты — по срокам."
      snapshot={snapshot}
      sourceUrl="https://www.kse.kg/ru/MfaResult"
    >
      {snapshot ? <DepositsView data={snapshot.data} /> : null}
      <MarketLinks current="/gcb/deposits" />
    </LivePage>
  );
}
