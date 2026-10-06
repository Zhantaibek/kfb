"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/AppProviders";
import ui from "@/app/ui.module.css";

/** Раздел админки, в котором редактируется публичная страница. */
export function adminEditHref(pathname: string): string {
  if (pathname === "/") return "/admin/hubs";
  if (pathname === "/about/management") return "/admin/management";
  if (pathname === "/news" || pathname.startsWith("/news/")) return "/admin/news";
  if (pathname === "/contacts") return "/admin/settings";
  if (pathname === "/listing") return "/admin/issuers?tab=listing";
  if (pathname === "/disclosure") return "/admin/issuers";
  if (pathname.startsWith("/disclosure/")) return `/admin/issuers?edit=${encodeURIComponent(pathname.slice("/disclosure/".length))}`;
  return `/admin/menu?edit=${encodeURIComponent(pathname)}`;
}

/**
 * Кнопка «Редактировать» на странице сайта; видна только вошедшему сотруднику CMS.
 * Без `href` ведёт в раздел админки для текущей страницы.
 */
export function AdminEditButton({ href, className }: { href?: string; className?: string }) {
  const { adminUser } = useApp();
  const pathname = usePathname();
  if (!adminUser) return null;
  return (
    <Link className={`${ui.ghost} ${ui.editBtn} ${className ?? ""}`} href={href ?? adminEditHref(pathname)}>
      Редактировать
    </Link>
  );
}
