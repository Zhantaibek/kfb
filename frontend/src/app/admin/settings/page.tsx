import { SettingsManager } from "@/components/admin/SettingsManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Настройки сайта" };

export default function AdminSettingsPage() {
  return <SettingsManager />;
}
