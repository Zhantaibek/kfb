import css from "@/app/admin/admin.module.css";
import type { Metadata } from "next";
import { MfaPanel } from "@/components/admin/MfaPanel";

export const metadata: Metadata = { title: "Профиль" };

export default function AdminProfilePage() {
  return (
    <>
      <p className={css.kicker}>Система</p>
      <h1>Профиль</h1>
      <p className={css.lead}>Безопасность вашей учётной записи.</p>
      <MfaPanel />
    </>
  );
}
