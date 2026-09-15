import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CmsPageView } from "@/components/CmsPageView";
import { findPageByPath, loadPublicContent } from "@/lib/cms/public";

export const dynamic = "force-dynamic";

function hrefFrom(path: string[]) {
  return `/${path.join("/")}`;
}

export async function generateMetadata({ params }: { params: Promise<{ path: string[] }> }): Promise<Metadata> {
  const { path } = await params;
  const page = findPageByPath(await loadPublicContent(), hrefFrom(path));
  return { title: page?.title ?? "Страница" };
}

export default async function CmsCatchAllPage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const page = findPageByPath(await loadPublicContent(), hrefFrom(path));
  if (!page) notFound();
  return <CmsPageView page={page} />;
}
