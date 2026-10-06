import { IssuersManager } from "@/components/admin/IssuersManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Эмитенты и листинг" };

export default function AdminIssuersPage() {
  return <IssuersManager />;
}
