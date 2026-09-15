import { ApiDocs } from "@/components/admin/DashboardView";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "API" };

export default function AdminApiPage() {
  return <ApiDocs />;
}
