import { LivePage } from "@/components/live/LiveParts";
import { loadSnapshot, type VolumeGs } from "@/lib/kse-live";
import { VolumeView, MarketLinks } from "@/components/live/LiveViews";
import { pageMetadata } from "@/lib/seo-server";

export const dynamic = "force-dynamic";
export const generateMetadata = pageMetadata("Объём ГЦБ в обращении");

/** Живые данные с kse.kg/ru/VolumeGs (обновляются раз в 15 минут). */
export default async function Page() {
  const snapshot = await loadSnapshot<VolumeGs>("volume-gs");
  return (
    <LivePage
      title="Объём ГЦБ в обращении"
      crumb="ГЦБ"
      lead="Государственные казначейские векселя и облигации в обращении по неделям."
      snapshot={snapshot}
      sourceUrl="https://www.kse.kg/ru/VolumeGs"
    >
      {snapshot ? <VolumeView data={snapshot.data} /> : null}
      <MarketLinks current="/gcb/volume" />
    </LivePage>
  );
}
