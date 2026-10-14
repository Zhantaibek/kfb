"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/AppProviders";
import ui from "@/app/ui.module.css";

/** Раздел админки, в котором редактируется публичная страница. */
export function adminEditHref(pathname: string): string | null {
  if (pathname === "/") return "/admin/hubs";
  if (pathname === "/about/management") return "/admin/management";
  if (pathname === "/news" || pathname.startsWith("/news/")) return "/admin/news";
  if (pathname === "/contacts") return "/admin/settings";
  // Эмитенты и листинг приходят из внешнего API — в админке их не редактируют.
  if (pathname === "/listing" || pathname === "/disclosure" || pathname.startsWith("/disclosure/")) return null;
  return `/admin/menu?edit=${encodeURIComponent(pathname)}`;
}

/**
 * Кнопка «Редактировать» на странице сайта; видна только вошедшему сотруднику CMS.
 * Без `href` ведёт в раздел админки для текущей страницы.
 */
export function AdminEditButton({ href, className }: { href?: string; className?: string }) {
  const { adminUser } = useApp();
  const pathname = usePathname();
  const target = href ?? adminEditHref(pathname);
  if (!adminUser || !target) return null;
  return (
    <Link className={`${ui.ghost} ${ui.editBtn} ${className ?? ""}`} href={target}>
      Редактировать
    </Link>
  );
}
