import { FooterNavManager } from "@/components/admin/FooterNavManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ссылки подвала" };

export default function AdminFooterPage() {
  return <FooterNavManager />;
}
