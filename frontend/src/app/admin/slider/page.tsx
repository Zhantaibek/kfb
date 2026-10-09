import { redirect } from "next/navigation";

// Раздел «Слайдер» убран из админ-панели — старый адрес ведёт на панель управления.
export default function Page() {
  redirect("/admin/dashboard");
}
