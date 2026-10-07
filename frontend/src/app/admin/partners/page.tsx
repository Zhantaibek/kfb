import { PartnersManager } from "@/components/admin/PartnersManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Партнёры" };

export default function AdminPartnersPage() {
  return <PartnersManager />;
}
