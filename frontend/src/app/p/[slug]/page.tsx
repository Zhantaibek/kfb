import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CmsPageView } from "@/components/CmsPageView";
import { findPage, loadPublicContent } from "@/lib/cms/public";

export const dynamic = "force-dynamic";

async function loadPage(slug: string) {
  return findPage(await loadPublicContent(), slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  return { title: page?.title ?? "Страница" };
}

export default async function CmsPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) notFound();
  return <CmsPageView page={page} />;
}
