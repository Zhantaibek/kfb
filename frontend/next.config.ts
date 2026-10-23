import path from "node:path";
import type { NextConfig } from "next";

const api = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  agentRules: false,
  experimental: {
    proxyClientMaxBodySize: "100mb",
  },
  turbopack: {
    root: path.resolve(process.cwd(), ".."),
  },
  async redirects() {
    return [
      { source: "/admin", destination: "/admin/dashboard", permanent: false },
      // Слайдер убран из админки; ссылки подвала теперь в «Контакты и подвал».
      { source: "/admin/slider", destination: "/admin/dashboard", permanent: false },
      { source: "/admin/footer", destination: "/admin/settings", permanent: false },
      // Кабинета инвестора больше нет: вход на сайт только для сотрудников.
      { source: "/cabinet", destination: "/login", permanent: true },
      { source: "/PublicInfo", destination: "/disclosure", permanent: false },
      { source: "/PublicInfo/:slug", destination: "/disclosure/:slug", permanent: false },
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
