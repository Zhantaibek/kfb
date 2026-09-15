import Link from "next/link";
import ui from "@/app/ui.module.css";
import { PublicMain } from "@/components/PublicMain";

export default function NotFound() {
  return (
    <PublicMain>
      <h1 className={ui.title}>Страница не найдена</h1>
      <p className={ui.lead}>Проверьте адрес или вернитесь к котировкам.</p>
      <Link className={ui.primary} href="/market" style={{ marginTop: 16, display: "inline-flex" }}>
        К торгам
      </Link>
    </PublicMain>
  );
}
