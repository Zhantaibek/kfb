import path from "node:path";
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const api = process.env.API_URL ?? "http://localhost:4000";

/**
 * Docker-образ собирается из .next/standalone (только нужные файлы); корень трассировки — монорепо, чтобы
 * в сборку попал shared/. Только для production-сборки: в next dev эта трассировка приводила к циклу
 * перезагрузок страницы (HMR).
 */
const standaloneBuild: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd(), ".."),
};

const nextConfig: NextConfig = {
  agentRules: false,
  images: {
    // 90 — для фото слайдов главной (крупные снимки на весь экран), 75 — для остальных картинок.
    qualities: [75, 90],
    // AVIF при том же весе сохраняет больше деталей, чем WebP; браузер без AVIF получит WebP.
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    proxyClientMaxBodySize: "100mb",
  },
  turbopack: {
    root: path.resolve(process.cwd(), ".."),
  },
  // Базовые заголовки безопасности для всех страниц сайта (у API свои — helmet в backend).
  // CSP ограничивает встраивание и формы, но не скрипты: Next.js и тема используют встроенные скрипты.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/admin", destination: "/admin/dashboard", permanent: false },
      // Слайдер убран из админки; ссылки подвала теперь в «Контакты и подвал».
      { source: "/admin/slider", destination: "/admin/dashboard", permanent: false },
      { source: "/admin/footer", destination: "/admin/settings", permanent: false },
      // «Главная» и «Карточки разделов» — теперь вкладки раздела «Меню и страницы».
      { source: "/admin/hubs", destination: "/admin/menu?tab=home", permanent: false },
      { source: "/admin/sections", destination: "/admin/menu?tab=cards", permanent: false },
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

export default function config(phase: string): NextConfig {
  return phase === PHASE_PRODUCTION_BUILD ? { ...nextConfig, ...standaloneBuild } : nextConfig;
}
