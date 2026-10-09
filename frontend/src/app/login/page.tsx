import { redirect } from "next/navigation";

// Вход в личный кабинет убран: посетители сайта не входят, вход только в админ-панель (/admin).
export default function Page() {
  redirect("/");
}
