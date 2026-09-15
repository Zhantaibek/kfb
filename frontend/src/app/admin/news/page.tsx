import { NewsManager } from "@/components/admin/NewsManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Новости" };

export default function AdminNewsPage() {
  return <NewsManager />;
}
