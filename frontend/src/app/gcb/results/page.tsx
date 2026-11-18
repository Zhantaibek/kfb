import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/Forms";
import { PublicMain } from "@/components/PublicMain";
import { loadGcbAuctions } from "@/lib/kse-live";
import { AuctionResultsView, MarketLinks } from "@/components/live/LiveViews";
import css from "@/components/live/live.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Результаты аукционов ГЦБ" };

/** Результаты аукционов ГЦБ из нашей базы (gcb_auctions — из аукционной системы Oracle). */
export default async function Page() {
  const data = await loadGcbAuctions();
  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / ГЦБ
          </>
        }
        title="Результаты аукционов ГЦБ"
        lead="Объём предложения, спрос, продажи и доходность по аукционам государственных ценных бумаг."
      />
      {data?.rows.length ? (
        <AuctionResultsView data={data} />
      ) : (
        <p className={css.empty}>Результаты аукционов ещё не загружены.</p>
      )}
      <MarketLinks current="/gcb/results" />
    </PublicMain>
  );
}
