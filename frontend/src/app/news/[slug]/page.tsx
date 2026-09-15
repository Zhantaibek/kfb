import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { NewsArticle } from "@/components/NewsArticle";
import { findNews, loadPublicContent } from "@/lib/cms/public";

export const dynamic = "force-dynamic";

async function loadItem(slug: string) {
  return findNews(await loadPublicContent(), slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await loadItem(slug);
  return { title: item?.title ?? "Новость" };
}

export default async function NewsItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await loadItem(slug);
  if (!item) notFound();
  return <NewsArticle item={item} />;
}
