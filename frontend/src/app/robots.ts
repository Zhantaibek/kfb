import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // Служебные разделы поисковикам не нужны: админка, вход и прокси API.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/login", "/search"] },
    sitemap: "https://kse.kg/sitemap.xml",
  };
}
