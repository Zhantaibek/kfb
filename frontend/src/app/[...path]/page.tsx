import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CmsPageView } from "@/components/CmsPageView";
import { findPageByPath, loadPublicContent } from "@/lib/cms/public";
import { applyLocale } from "@/lib/cms/locale";
import { contentMetadata, requestLocale } from "@/lib/seo-server";

export const dynamic = "force-dynamic";

function hrefFrom(path: string[]) {
  return `/${path.join("/")}`;
}

export async function generateMetadata({ params }: { params: Promise<{ path: string[] }> }): Promise<Metadata> {
  const { path } = await params;
  const page = findPageByPath(await loadPublicContent(), hrefFrom(path));
  if (!page) return { title: "Страница", robots: { index: false } };
  const text = applyLocale(page, (await requestLocale()).lang, ["title", "lead", "body"]);
  return contentMetadata({ title: text.title, description: text.lead || text.body });
}

export default async function CmsCatchAllPage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const page = findPageByPath(await loadPublicContent(), hrefFrom(path));
  if (!page) notFound();
  return <CmsPageView page={page} />;
}
