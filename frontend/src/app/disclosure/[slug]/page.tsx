import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IssuerView } from "../IssuerView";
import { getDisclosureNews } from "@/data/disclosure-news";
import { getIssuer, issuers } from "@/data/issuers";
import { getListingDetailBySlug } from "@/data/listing-details";
import { loadPublicContent } from "@/lib/cms/public";
import { newsForIssuer } from "@/lib/cms/types";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return issuers.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const issuer = getIssuer(slug);
  return { title: issuer?.name ?? "Эмитент" };
}

export default async function IssuerPage({ params }: Props) {
  const { slug } = await params;
  if (!getIssuer(slug)) notFound();
  const news = newsForIssuer((await loadPublicContent()).news, slug);
  // Данные листинга и раскрытия лежат в больших статических таблицах — в браузер уходит только нужный эмитент.
  return <IssuerView slug={slug} news={news} listing={getListingDetailBySlug(slug)} disclosures={getDisclosureNews(slug)} />;
}
