import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/Forms";
import { PublicMain } from "@/components/PublicMain";
import { MembersView } from "@/components/live/LiveViews";
import { loadMembers } from "@/lib/kse-live";
import ui from "@/app/ui.module.css";
import css from "@/components/live/live.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Участники торгов" };

/** Брокеры и дилеры — из нашей базы (business_catalog, перенесено из бэкапа старого сайта). */
export default async function MembersPage() {
  const members = await loadMembers();
  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / Участники
          </>
        }
        title="Участники торгов"
        lead="Брокерские и дилерские компании с доступом к торгам ЗАО «Кыргызская фондовая биржа»: адреса и контакты."
      />
      <div className={ui.toolbar} style={{ marginTop: 0 }}>
        <Link href="/members/stdm">Участники СТДМ</Link>
        <Link href="/members/commodity">Товарно-сырьевой сектор</Link>
        <Link href="/members/gcb">Участники ГЦБ</Link>
        <Link href="/members/rating">Рейтинг участников</Link>
      </div>
      {members?.rows.length ? <MembersView rows={members.rows} /> : <p className={css.empty}>Список участников ещё не загружен.</p>}
    </PublicMain>
  );
}
