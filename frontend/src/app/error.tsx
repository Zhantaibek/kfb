"use client";

import Link from "next/link";
import ui from "@/app/ui.module.css";
import { PublicMain } from "@/components/PublicMain";

/** Сбой при открытии страницы (например, сервер данных недоступен) — вместо стандартной страницы ошибки Next. */
export default function PageError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <PublicMain>
      <h1 className={ui.title}>Не удалось загрузить страницу</h1>
      <p className={ui.lead}>Сервер временно недоступен. Попробуйте ещё раз через минуту.</p>
      <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button className={ui.primary} type="button" onClick={() => retry()}>
          Повторить
        </button>
        <Link className={ui.ghost} href="/">
          На главную
        </Link>
      </div>
    </PublicMain>
  );
}
