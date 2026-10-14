import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResourceDetail } from "@/components/ResourcePages";
import { partnersOrFallback } from "@/lib/cms/partners";
import { loadPublicContent } from "@/lib/cms/public";
import { contentMetadata } from "@/lib/seo-server";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const partners = partnersOrFallback((await loadPublicContent()).partners);
  return { partners, item: partners.find((entry) => entry.slug === slug) };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { item } = await load(slug);
  if (!item) return { title: "Наши партнеры", robots: { index: false } };
  return contentMetadata({
    title: item.caption,
    description: `${item.caption} — партнёр Кыргызской фондовой биржи.`,
  });
}

/** Партнёр из админки (раздел «Партнёры»). */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { item, partners } = await load(slug);
  if (!item) notFound();
  return <ResourceDetail item={item} partners={partners} />;
}
