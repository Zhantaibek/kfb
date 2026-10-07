import Link from "next/link";
import type { Metadata } from "next";
import { LivePage } from "@/components/live/LiveParts";
import { MembersView } from "@/components/live/LiveViews";
import { loadSnapshot, type Members } from "@/lib/kse-live";
import ui from "@/app/ui.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Участники торгов" };

/** Брокеры и дилеры — живой список с kse.kg/ru/Members (обновляется раз в 15 минут). */
export default async function MembersPage() {
  const snapshot = await loadSnapshot<Members>("members");
  return (
    <LivePage
      title="Участники торгов"
      crumb="Участники"
      lead="Брокерские и дилерские компании с доступом к торгам ЗАО «Кыргызская фондовая биржа»: адреса и контакты."
      snapshot={snapshot}
      sourceUrl="https://www.kse.kg/ru/Members"
    >
      <div className={ui.toolbar} style={{ marginTop: 0 }}>
        <Link href="/members/stdm">Участники СТДМ</Link>
        <Link href="/members/commodity">Товарно-сырьевой сектор</Link>
        <Link href="/members/gcb">Участники ГЦБ</Link>
        <Link href="/members/rating">Рейтинг участников</Link>
      </div>
      {snapshot ? <MembersView rows={snapshot.data.rows} /> : null}
    </LivePage>
  );
}
