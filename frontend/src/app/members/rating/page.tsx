import type { Metadata } from "next";
import { DataTable, LivePage } from "@/components/live/LiveParts";
import { loadSnapshot, type MembersRating } from "@/lib/kse-live";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Рейтинг участников торгов" };

/** Рейтинг участников — с kse.kg/ru/MembersRating (последний год, за который он опубликован). */
export default async function MembersRatingPage() {
  const snapshot = await loadSnapshot<MembersRating>("members-rating");
  const rating = snapshot?.data;
  return (
    <LivePage
      title={rating ? `Рейтинг участников торгов за ${rating.year} год` : "Рейтинг участников торгов"}
      crumb="Участники"
      lead="Объём и количество сделок, число финансовых инструментов и итоговый балл каждого участника."
      snapshot={snapshot}
      sourceUrl="https://www.kse.kg/ru/MembersRating"
    >
      {rating ? <DataTable table={{ head: rating.head, rows: rating.rows }} wideFirst /> : null}
    </LivePage>
  );
}
