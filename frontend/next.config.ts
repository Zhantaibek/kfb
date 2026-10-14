import path from "node:path";
import type { NextConfig } from "next";

const api = process.env.API_URL ?? "http://localhost:4000";

/** Разделы старого kse.kg (/{язык}/{Раздел}) и их новые адреса. */
const legacyPages: [string, string][] = [
  ["Quotes", "/market/quotes"],
  ["QuotesGold", "/market/metals"],
  ["TradeResults", "/market"],
  ["TradeArchive", "/market/archive"],
  ["IndexAndCapitalization", "/market/index"],
  ["Statistics", "/statistics"],
  ["AuctionResult", "/gcb/results"],
  ["MfaResult", "/gcb/results"],
  ["ScheduleGS", "/gcb"],
  ["VolumeGs", "/gcb/volume"],
  ["Members", "/members"],
  ["MembersRating", "/members/rating"],
  ["FinMarket", "/finmarket"],
  ["GeneralInfo", "/about"],
  ["PublicInfo", "/disclosure"],
  ["PublicInfo/:slug", "/disclosure/:slug"],
  ["Listing", "/listing"],
  ["News", "/news"],
  ["News/:slug", "/news/:slug"],
  ["Contacts", "/contacts"],
  ["Documents", "/documents"],
  ["Tariffs", "/tariffs"],
  ["Partners", "/about/partners"],
  ["Management", "/about/management"],
];

const nextConfig: NextConfig = {
  agentRules: false,
  experimental: {
    proxyClientMaxBodySize: "100mb",
  },
  turbopack: {
    root: path.resolve(process.cwd(), ".."),
  },
  async redirects() {
    // Старые адреса kse.kg вида /ru/Quotes, /ky/Quotes, /en/Quotes → новые разделы (301 — поисковики переносят позиции).
    // Next сравнивает адреса без учёта регистра: /ky/Listing и новый /ky/listing — один адрес, такой редирект зациклился бы.
    const legacy = legacyPages.flatMap(([old, target]) =>
      (["ru", "ky", "en"] as const)
        .map((lang) => ({
          source: `/${lang}/${old}`,
          destination: lang === "ru" ? target : `/${lang}${target === "/" ? "" : target}`,
          permanent: true,
        }))
        .filter((route) => route.source.toLowerCase() !== route.destination.toLowerCase()),
    );
    return [
      { source: "/admin", destination: "/admin/dashboard", permanent: false },
      { source: "/ru", destination: "/", permanent: true },
      { source: "/PublicInfo", destination: "/disclosure", permanent: true },
      { source: "/PublicInfo/:slug", destination: "/disclosure/:slug", permanent: true },
      { source: "/sustainable.html", destination: "/sustainable", permanent: true },
      ...legacy,
    ];
  },
  async rewrites() {
    return [
      { source: "/uploads/:path*", destination: `${api}/uploads/:path*` },
      { source: "/openapi.json", destination: `${api}/openapi.json` },
    ];
  },
};

export default nextConfig;
