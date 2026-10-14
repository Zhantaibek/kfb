import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { NewsArticle } from "@/components/NewsArticle";
import { findIssuer, findNews, loadIssuerData, loadPublicContent } from "@/lib/cms/public";
import { applyLocale } from "@/lib/cms/locale";
import { localizedPath, metaDescription, SITE_URL } from "@/lib/seo";
import { contentMetadata, isoDate, requestLocale, siteText } from "@/lib/seo-server";

export const dynamic = "force-dynamic";

async function loadItem(slug: string) {
  return findNews(await loadPublicContent(), slug);
}

/** Новость на языке адреса: перевод, если он есть, иначе русский текст. */
async function localizedItem(slug: string) {
  const item = await loadItem(slug);
  if (!item) return { item, text: undefined };
  const { lang } = await requestLocale();
  return { item, text: applyLocale(item, lang, ["title", "excerpt", "body"]) };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { item, text } = await localizedItem(slug);
  if (!item || !text) return { title: "Новость", robots: { index: false } };
  return contentMetadata({
    title: text.title,
    description: text.excerpt || text.body,
    image: item.photo || undefined,
    article: { publishedTime: isoDate(item.date), modifiedTime: isoDate(item.updatedAt), section: item.tag },
  });
}

export default async function NewsItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { item, text } = await localizedItem(slug);
  if (!item || !text) notFound();
  const issuer =
    item.kind === "company" && item.issuerSlug ? findIssuer(await loadIssuerData(), item.issuerSlug) : undefined;
  const { lang, path } = await requestLocale();
  // Разметка «новостная статья» — для Google News и расширенных сниппетов.
  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: text.title.slice(0, 110),
    description: metaDescription(text.excerpt || text.body),
    datePublished: isoDate(item.date),
    dateModified: isoDate(item.updatedAt) ?? isoDate(item.date),
    inLanguage: lang,
    mainEntityOfPage: `${SITE_URL}${localizedPath(path, lang)}`,
    ...(item.photo ? { image: [new URL(item.photo, SITE_URL).toString()] } : {}),
    author: { "@type": "Organization", name: siteText.ru.name, url: SITE_URL },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <NewsArticle item={item} issuer={issuer ? { slug: issuer.slug, name: issuer.name } : undefined} />
    </>
  );
}
