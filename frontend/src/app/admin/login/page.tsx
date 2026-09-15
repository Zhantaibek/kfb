import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Вход" };

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
