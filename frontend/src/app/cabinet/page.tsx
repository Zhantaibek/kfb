import Link from "next/link";
import type { Metadata } from "next";
import { CabinetView } from "@/components/CabinetView";
import { PageIntro } from "@/components/Forms";
import { PublicMain } from "@/components/PublicMain";

export const metadata: Metadata = { title: "Кабинет" };

export default function CabinetPage() {
  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / Кабинет
          </>
        }
        title="Личный кабинет"
        lead="Избранные бумаги, роль пользователя и заявки эмитента."
      />
      <CabinetView />
    </PublicMain>
  );
}
