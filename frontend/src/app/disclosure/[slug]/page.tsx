import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IssuerView } from "../IssuerView";
import { findIssuer, findListingBySlug, loadIssuerData, loadIssuerDisclosures, loadPublicContent } from "@/lib/cms/public";
import { newsForIssuer } from "@/lib/cms/types";
import { contentMetadata } from "@/lib/seo-server";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const issuer = findIssuer(await loadIssuerData(), slug);
  if (!issuer) return { title: "Эмитент", robots: { index: false } };
  return contentMetadata({
    title: issuer.name,
    description: `${issuer.name}: отчёты, существенные факты и документы эмитента в центре раскрытия информации Кыргызской фондовой биржи.`,
  });
}

export default async function IssuerPage({ params }: Props) {
  const { slug } = await params;
  const [data, content, disclosures] = await Promise.all([loadIssuerData(), loadPublicContent(), loadIssuerDisclosures(slug)]);
  const issuer = findIssuer(data, slug);
  if (!issuer) notFound();
  const news = newsForIssuer(content.news, issuer.slug);
  // Списки эмитентов и листинга большие — в браузер уходит только нужный эмитент.
  return (
    <IssuerView
      issuer={issuer}
      news={news}
      listing={findListingBySlug(data, issuer.slug)}
      disclosures={disclosures}
    />
  );
}
