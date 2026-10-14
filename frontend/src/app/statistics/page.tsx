import Link from "next/link";
import { PageIntro } from "@/components/Forms";
import { HubCards } from "@/components/landing/HubCards";
import { PublicMain } from "@/components/PublicMain";
import { loadPublicContent } from "@/lib/cms/public";
import { pageMetadata } from "@/lib/seo-server";

export const dynamic = "force-dynamic";
export const generateMetadata = pageMetadata("Статистика торгов");

/** «Статистика торгов» как на kse.kg/ru/Statistics: раздел из карточек. */
export default async function StatisticsPage() {
  const { menu } = await loadPublicContent();
  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / Статистика торгов
          </>
        }
        title="Статистика торгов"
      />
      <HubCards items={menu} page="/statistics" />
    </PublicMain>
  );
}
