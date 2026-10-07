import { VisitsManager } from "@/components/admin/VisitsManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Посещения" };

export default function AdminVisitsPage() {
  return <VisitsManager />;
}
