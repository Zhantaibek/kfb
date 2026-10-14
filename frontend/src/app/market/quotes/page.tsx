import { LivePage } from "@/components/live/LiveParts";
import { loadSnapshot, type Quotes } from "@/lib/kse-live";
import { QuotesView, MarketLinks } from "@/components/live/LiveViews";
import { pageMetadata } from "@/lib/seo-server";

export const dynamic = "force-dynamic";
export const generateMetadata = pageMetadata("Котировки по ценным бумагам");

/** Живые данные с kse.kg/ru/Quotes (обновляются раз в 15 минут). */
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  // ?q=a&q=b приходит массивом — берём первое значение.
  const q = (Array.isArray(params.q) ? params.q[0] : params.q) ?? "";
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
