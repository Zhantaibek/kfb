import { DashboardView } from "@/components/admin/DashboardView";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Панель" };

export default function DashboardPage() {
  return <DashboardView />;
}
