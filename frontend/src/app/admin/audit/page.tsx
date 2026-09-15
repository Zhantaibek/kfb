import { LogManager } from "@/components/admin/LogManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Журнал аудита" };

export default function AdminAuditPage() {
  return <LogManager kind="audit" />;
}
