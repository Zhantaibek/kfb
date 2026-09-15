import { RequestsManager } from "@/components/admin/RequestsManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Заявки" };

export default function AdminRequestsPage() {
  return <RequestsManager />;
}
