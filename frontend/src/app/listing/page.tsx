import Link from "next/link";
import type { Metadata } from "next";
import { CmsPageView } from "@/components/CmsPageView";
import { PageIntro } from "@/components/Forms";
import { ListingTable, type ListingTableRow } from "@/components/ListingTable";
import { PublicMain } from "@/components/PublicMain";
import { findPageByPath, loadIssuerData, loadPublicContent } from "@/lib/cms/public";

const path = "/listing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Листинг" };

export default async function ListingPage() {
  const page = findPageByPath(await loadPublicContent(), path);
  if (page) return <CmsPageView page={page} />;
  const { issuers, listing } = await loadIssuerData();
  // Ссылку на карточку даём только тем бумагам, чей эмитент есть в Центре раскрытия информации.
  const known = new Set(issuers.map((item) => item.slug.toLowerCase()));
  // В браузер уходят только поля таблицы, без документов и карточки листинга.
  const entries: ListingTableRow[] = listing.map((row) => ({
    id: row.id,
    code: row.code,
    category: row.category,
    order: row.order,
    name: row.name,
    issuerSlug: known.has(row.issuerSlug.toLowerCase()) ? row.issuerSlug : "",
    security: row.security,
    price: row.price,
    cap: row.cap,
    count: row.count,
    doc: row.doc,
  }));

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
      <ListingTable entries={entries} />
    </PublicMain>
  );
}
