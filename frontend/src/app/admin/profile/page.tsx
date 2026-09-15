import css from "@/app/admin/admin.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Профиль" };

export default function AdminProfilePage() {
  return (
    <>
      <p className={css.kicker}>Система</p>
      <h1>Профиль</h1>
      <p className={css.lead}>Демо-вход: admin@kse.kg / admin. Редактор: editor@kse.kg / editor.</p>
    </>
  );
}
