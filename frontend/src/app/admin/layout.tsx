import { AdminShell } from "@/components/admin/AdminShell";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import css from "./admin.module.css";

export const metadata: Metadata = {
  title: {
    default: "Портал администратора",
    template: "%s | КФБ Админ",
  },
  // Админка не должна попадать в поиск, даже если на неё где-то есть ссылка.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={css.adminRoot}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}