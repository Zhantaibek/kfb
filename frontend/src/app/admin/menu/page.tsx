import { MenuManager } from "@/components/admin/MenuManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Меню" };

export default function AdminMenuPage() {
  return <MenuManager />;
}
