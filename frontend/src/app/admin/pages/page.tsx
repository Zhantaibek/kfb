import { PagesManager } from "@/components/admin/PagesManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Страницы" };

export default function AdminPagesPage() {
  return <PagesManager />;
}
