import type { Metadata } from "next";
import { CabinetEntry } from "@/components/CabinetEntry";
import { PublicMain } from "@/components/PublicMain";

export const metadata: Metadata = { title: "Вход в кабинет" };

export default function LoginPage() {
  return (
    <PublicMain>
      <CabinetEntry />
    </PublicMain>
  );
}
