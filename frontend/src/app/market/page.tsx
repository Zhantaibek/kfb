import Link from "next/link";
import type { Metadata } from "next";
import { QuotesTable } from "@/components/QuotesTable";
import { MarketDashboard } from "@/components/MarketDashboard";
import { SessionMovers } from "@/components/SessionMovers";
import { PageIntro } from "@/components/Forms";
import { sessionDate, sessionHours } from "@/data/catalog";
import ui from "@/app/ui.module.css";
import { PublicMain } from "@/components/PublicMain";

export const metadata: Metadata = { title: "Торги и котировки" };

export default function MarketPage() {
  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / Торги
          </>
        }
        title="Котировки и итоги торгов"
        lead={`Сессия ${sessionHours}. Данные на ${sessionDate}.`}
      />
      <MarketDashboard compact />
      <SessionMovers />
      <QuotesTable />
    </PublicMain>
  );
}
