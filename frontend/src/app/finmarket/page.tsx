import { LivePage } from "@/components/live/LiveParts";
import { loadSnapshot, type TablesPage } from "@/lib/kse-live";
import css from "@/components/live/live.module.css";
import { pageMetadata } from "@/lib/seo-server";

export const dynamic = "force-dynamic";
export const generateMetadata = pageMetadata("Финансовый рынок KG");

/** Выпуски журнала «Финансовый рынок.KG» — живой список с kse.kg/ru/FinMarket: новые выпуски появляются сами. */
export default async function FinMarketPage() {
  const snapshot = await loadSnapshot<TablesPage>("finmarket");
  const issues = (snapshot?.data.tables[0]?.rows ?? [])
    .map((row) => ({ title: row.find((cell) => cell.text && !cell.href)?.text ?? "", href: row.find((cell) => cell.href)?.href ?? "" }))
    .filter((item) => item.title && item.href);
  return (
    <LivePage
      title="Финансовый рынок KG"
      crumb="Направления"
      lead="Информационно-аналитический журнал о рынке ценных бумаг Кыргызстана — все выпуски в PDF."
      snapshot={snapshot}
      sourceUrl="https://www.kse.kg/ru/FinMarket"
    >
      <div className={css.files}>
        {issues.map((item) => (
          <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
            {item.title}
            <span>PDF ↗</span>
          </a>
        ))}
      </div>
    </LivePage>
  );
}
