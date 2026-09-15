import { HubsManager } from "@/components/admin/HubsManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Главная" };

export default function AdminHubsPage() {
  return <HubsManager />;
}
