import type { MetadataRoute } from "next";
import { loadPublicContent } from "@/lib/cms/public";
import { sectionPages, siteNav } from "@/data/site-nav";

export const dynamic = "force-dynamic";

const staticPages = [
  "",
  "/market",
  "/gcb",
  "/listing",
  "/disclosure",
  "/investors",
  "/members",
  "/news",
  "/about",
  "/contacts",
  "/login",
  "/islamic",
  "/commodity",
  "/documents",
  "/search",
  "/tariffs",
  "/analytics",
  "/finmarket",
  ...Object.keys(sectionPages),
  ...siteNav.map((group) => group.href),
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const news = (await loadPublicContent()).news;
  const uniquePages = [...new Set(staticPages)];
  return [
    ...uniquePages.map((path) => ({
      url: `https://kse.kg${path}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    // Карточки /market/<тикер> из демо-каталога в карту сайта не включаем: на живых данных они ведут на котировки.
    ...news.map((item) => ({
      url: `https://kse.kg/news/${item.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
