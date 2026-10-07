import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResourceDetail } from "@/components/ResourcePages";
import { partnersOrFallback } from "@/lib/cms/partners";
import { loadPublicContent } from "@/lib/cms/public";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const partners = partnersOrFallback((await loadPublicContent()).partners);
  return { partners, item: partners.find((entry) => entry.slug === slug) };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { item } = await load(slug);
  return { title: item?.caption ?? "Наши партнеры" };
}

/** Партнёр из админки (раздел «Партнёры»). */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { item, partners } = await load(slug);
  if (!item) notFound();
  return <ResourceDetail item={item} partners={partners} />;
}
