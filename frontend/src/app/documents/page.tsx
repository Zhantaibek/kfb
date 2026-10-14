import { notFound } from "next/navigation";
import { CmsPageView } from "@/components/CmsPageView";
import { findPageByPath, loadPublicContent } from "@/lib/cms/public";
import { pageMetadata } from "@/lib/seo-server";

export const dynamic = "force-dynamic";
export const generateMetadata = pageMetadata("Корпоративные документы");

/** Устав, положения и т.д. — страница /documents в админке (перенесена с kse.kg). */
export default async function DocumentsPage() {
  const page = findPageByPath(await loadPublicContent(), "/documents");
  if (!page) notFound();
  return <CmsPageView page={page} />;
}
