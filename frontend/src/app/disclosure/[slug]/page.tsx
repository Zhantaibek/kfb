import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IssuerView } from "../IssuerView";
import { getDisclosureNews } from "@/data/disclosure-news";
import { findIssuer, findListingBySlug, loadIssuerData, loadPublicContent } from "@/lib/cms/public";
import { newsForIssuer } from "@/lib/cms/types";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const issuer = findIssuer(await loadIssuerData(), slug);
  return { title: issuer?.name ?? "Эмитент" };
}

export default async function IssuerPage({ params }: Props) {
  const { slug } = await params;
  const [data, content] = await Promise.all([loadIssuerData(), loadPublicContent()]);
  const issuer = findIssuer(data, slug);
  if (!issuer) notFound();
  const news = newsForIssuer(content.news, issuer.slug);
  // Списки эмитентов и листинга большие — в браузер уходит только нужный эмитент.
  return (
    <IssuerView
      issuer={issuer}
      news={news}
      listing={findListingBySlug(data, issuer.slug)}
      disclosures={getDisclosureNews(issuer.slug)}
    />
  );
}
