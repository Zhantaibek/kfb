import { UsersManager } from "@/components/admin/UsersManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Пользователи" };

export default function AdminUsersPage() {
  return <UsersManager />;
}
