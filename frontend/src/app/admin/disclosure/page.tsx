import { DisclosureManager } from "@/components/admin/DisclosureManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Раскрытие информации" };

export default function AdminDisclosurePage() {
  return <DisclosureManager />;
}
