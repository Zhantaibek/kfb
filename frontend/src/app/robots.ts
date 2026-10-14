import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // Админка и служебный API поисковикам не нужны.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: "https://kse.kg/sitemap.xml",
  };
}
