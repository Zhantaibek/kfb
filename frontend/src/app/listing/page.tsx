import Link from "next/link";
import type { Metadata } from "next";
import { CmsPageView } from "@/components/CmsPageView";
import { PageIntro } from "@/components/Forms";
import { ListingTable } from "@/components/ListingTable";
import { PublicMain } from "@/components/PublicMain";
import { findPageByPath, loadPublicContent } from "@/lib/cms/public";

const path = "/listing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Листинг" };

export default async function ListingPage() {
  const page = findPageByPath(await loadPublicContent(), path);
  if (page) return <CmsPageView page={page} />;

  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / Листинг
          </>
        }
        title="Листинг"
        lead="Официальный список ценных бумаг, допущенных к торгам на Кыргызской фондовой бирже."
      />
      <ListingTable />
    </PublicMain>
  );
}
