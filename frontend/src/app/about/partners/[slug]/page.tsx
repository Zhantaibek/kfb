import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResourceDetail } from "@/components/ResourcePages";
import { resourceBySlug, resourceProfiles } from "@/data/resources";

export function generateStaticParams() {
  return resourceProfiles.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = resourceBySlug(slug);
  return { title: item?.caption ?? "Наши партнеры" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = resourceBySlug(slug);
  if (!item) notFound();
  return <ResourceDetail item={item} />;
}
