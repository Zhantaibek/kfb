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
    // Самая большая загрузка — документ до 20 МБ; больше прокси принимать незачем.
    proxyClientMaxBodySize: "25mb",
  },
  async headers() {
    const dev = process.env.NODE_ENV !== "production";
    // CSP: всё своё; inline-скрипты нужны Next (гидратация), скрипту темы и JSON-LD. В разработке — eval и ws для HMR.
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self'${dev ? " ws: wss:" : ""}`,
      "media-src 'self'",
      // Просмотр документов — свой адрес; Swagger в админке — с API (в разработке он на :4000).
      `frame-src 'self'${dev ? " http://localhost:4000" : ""}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; ");
    const security = [
      { key: "Content-Security-Policy", value: csp },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      ...(dev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
    ];
    return [{ source: "/:path*", headers: security }];
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
