import { LogManager } from "@/components/admin/LogManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Посещения" };

export default function AdminVisitsPage() {
  return <LogManager kind="visits" />;
}
