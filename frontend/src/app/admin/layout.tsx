import { AdminShell } from "@/components/admin/AdminShell";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import css from "./admin.module.css";

export const metadata: Metadata = {
  title: {
    default: "Портал администратора",
    template: "%s | КФБ Админ",
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={css.adminRoot}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}