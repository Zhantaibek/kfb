import { redirect } from "next/navigation";

// «Ссылки подвала» объединены с контактами в раздел «Подвал и контакты».
export default function Page() {
  redirect("/admin/settings");
}
