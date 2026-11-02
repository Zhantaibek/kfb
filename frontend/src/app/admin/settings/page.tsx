import { FooterNavManager } from "@/components/admin/FooterNavManager";
import { SettingsManager } from "@/components/admin/SettingsManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Контакты и подвал" };

export default function AdminSettingsPage() {
  // Контакты, тексты подвала и ссылки подвала — один раздел админки.
  return (
    <>
      <SettingsManager />
      <FooterNavManager />
    </>
  );
}
