import type { MetadataRoute } from "next";
import { loadIssuerData, loadPublicContent } from "@/lib/cms/public";
import { partnersOrFallback } from "@/lib/cms/partners";
import { sectionPages, siteNav } from "@/data/site-nav";
import { languageAlternates, localizedPath, SEO_LANGS, SITE_URL } from "@/lib/seo";
import { isoDate } from "@/lib/seo-server";

export const dynamic = "force-dynamic";

/** Разделы сайта. Поиск, вход и демо-карточки инструментов в карту не входят — им нечего делать в выдаче. */
const staticPages = [
  "/",
  "/market",
  "/market/quotes",
  "/market/index",
  "/market/archive",
  "/market/metals",
  "/gcb",
  "/gcb/invest",
  "/gcb/results",
  "/gcb/volume",
  "/gcb/deposits",
  "/listing",
  "/disclosure",
  "/investors",
  "/members",
  "/members/rating",
  "/news",
  "/about",
  "/about/management",
  "/about/partners",
  "/contacts",
  "/islamic",
  "/commodity",
  "/sustainable",
  "/statistics",
  "/documents",
  "/tariffs",
  "/analytics",
  "/finmarket",
  ...Object.keys(sectionPages),
  ...siteNav.map((group) => group.href),
];

const priority = (path: string) => (path === "/" ? 1 : path.split("/").length <= 2 ? 0.8 : 0.6);

/** Одна страница — три адреса (ru, /ky, /en), каждый со ссылками на остальные языковые версии. */
function localized(path: string, extra: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">) {
  const languages = Object.fromEntries(
    Object.entries(languageAlternates(path)).map(([lang, href]) => [lang, `${SITE_URL}${href}`]),
  );
  return SEO_LANGS.map((lang) => ({
    url: `${SITE_URL}${localizedPath(path, lang)}`,
    alternates: { languages },
    ...extra,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [content, issuerData] = await Promise.all([loadPublicContent(), loadIssuerData()]);
  const pages = [...new Set(staticPages.filter((path) => path.startsWith("/") && !path.startsWith("//")))];
  const latestNews = content.news.map((item) => isoDate(item.updatedAt) ?? isoDate(item.date)).filter(Boolean).sort().pop();

  return [
    ...pages.flatMap((path) =>
      localized(path, {
        // Главная и новости меняются вместе с новостями, торговые разделы — каждый торговый день.
        lastModified: path === "/" || path === "/news" ? latestNews : undefined,
        changeFrequency: path.startsWith("/market") || path.startsWith("/gcb") || path === "/" ? "daily" : "weekly",
        priority: priority(path),
      }),
    ),
    // Страницы, созданные в админке (кроме тех, что уже есть выше).
    ...content.pages
      .filter((page) => page.status === "published" && page.path?.startsWith("/") && !pages.includes(page.path))
      .flatMap((page) => localized(page.path, { lastModified: isoDate(page.updatedAt), changeFrequency: "monthly", priority: 0.5 })),
    ...content.news
      .filter((item) => item.status === "published")
      .flatMap((item) =>
        localized(`/news/${item.slug}`, {
          lastModified: isoDate(item.updatedAt) ?? isoDate(item.date),
          changeFrequency: "monthly",
          priority: 0.5,
        }),
      ),
    ...issuerData.issuers.flatMap((item) =>
      localized(`/disclosure/${item.slug}`, { changeFrequency: "weekly", priority: 0.4 }),
    ),
    ...partnersOrFallback(content.partners).flatMap((item) =>
      localized(`/about/partners/${item.slug}`, { changeFrequency: "yearly", priority: 0.3 }),
    ),
  ];
}
