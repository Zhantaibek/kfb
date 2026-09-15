import { ManagementManager } from "@/components/admin/ManagementManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Руководство" };

export default function AdminManagementPage() {
  return <ManagementManager />;
}
