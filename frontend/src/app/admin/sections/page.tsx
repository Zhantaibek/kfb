import { redirect } from "next/navigation";

// Плитки страниц «О Бирже» и «Статистика торгов» теперь — пункты разделов в «Меню и страницы».
export default function Page() {
  redirect("/admin/menu");
}
