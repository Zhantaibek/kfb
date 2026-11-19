import type { Metadata } from "next";
import { LivePage } from "@/components/live/LiveParts";
import { loadSnapshot, type TradeArchive, type TradeResults } from "@/lib/kse-live";
import { DataTable } from "@/components/live/LiveParts";
import { MarketLinks, TradeResultsView } from "@/components/live/LiveViews";
import css from "@/components/live/live.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Архив торгов" };

/** Живые данные с kse.kg/ru/TradeArchive (обновляются раз в 15 минут). */
export default async function Page() {
  // Сначала — торги за сегодня (последний торговый день из итогов торгов), ниже — архив по месяцам и годам.
  const [snapshot, results] = await Promise.all([
    loadSnapshot<TradeArchive>("trade-archive"),
    loadSnapshot<TradeResults>("trade-results"),
  ]);
  return (
    <LivePage
      title="Архив торгов"
      crumb="Статистика торгов"
      lead="Торги за последний торговый день, объёмы по месяцам текущего и прошлого года и по годам с 2001."
      snapshot={snapshot}
      sourceUrl="https://www.kse.kg/ru/TradeArchive"
    >
      <div className={css.stack}>
        {results?.data.periods.some((item) => item.id === "last") ? <TradeResultsView data={results.data} only="last" /> : null}
        {snapshot?.data.sections.map((section) => (
          <section className={css.section} key={section.title}>
            <h2>{section.title}</h2>
            <DataTable table={section.table} />
          </section>
        ))}
      </div>
      <MarketLinks current="/market/archive" />
    </LivePage>
  );
}
