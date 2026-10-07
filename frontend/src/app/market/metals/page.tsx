import type { Metadata } from "next";
import { LivePage } from "@/components/live/LiveParts";
import { loadSnapshot, type TablesPage } from "@/lib/kse-live";
import { DataTable } from "@/components/live/LiveParts";
import { MarketLinks } from "@/components/live/LiveViews";
import css from "@/components/live/live.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Котировки по драгоценным металлам" };

/** Живые данные с kse.kg/ru/QuotesGold (обновляются раз в 15 минут). */
export default async function Page() {
  const snapshot = await loadSnapshot<TablesPage>("quotes-metals");
  return (
    <LivePage
      title="Котировки по драгоценным металлам"
      crumb="Статистика торгов"
      lead="Заявки на покупку и продажу в секторе драгоценных металлов."
      snapshot={snapshot}
      sourceUrl="https://www.kse.kg/ru/QuotesGold"
    >
      <div className={css.stack}>
        {snapshot ? <h2 style={{ margin: 0, fontSize: 20 }}>{snapshot.data.title}</h2> : null}
        {snapshot?.data.tables.map((table, i) => <DataTable key={i} table={table} />)}
      </div>
      <MarketLinks current="/market/metals" />
    </LivePage>
  );
}
