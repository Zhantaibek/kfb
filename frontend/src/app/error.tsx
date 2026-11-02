"use client";

import Link from "next/link";
import { useEffect } from "react";
import ui from "@/app/ui.module.css";
import { PublicMain } from "@/components/PublicMain";

/** Сбой при показе страницы: шапка и подвал остаются, вместо содержимого — понятное сообщение и повтор. */
export default function PageError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // В production у ошибок сервера есть только digest — по нему ошибку находят в логах.
  const digest = error instanceof Error && "digest" in error ? String((error as Error & { digest?: string }).digest ?? "") : "";

  return (
    <PublicMain>
      <h1 className={ui.title}>Не удалось открыть страницу</h1>
      <p className={ui.lead}>Произошёл временный сбой. Попробуйте ещё раз — если ошибка повторится, вернитесь на главную.</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
        <button className={ui.primary} type="button" onClick={() => retry()}>
          Повторить
        </button>
        <Link className={ui.ghost} href="/">
          На главную
        </Link>
      </div>
      {digest ? <p className={ui.lead} style={{ marginTop: 16, fontSize: 13 }}>Код ошибки: {digest}</p> : null}
    </PublicMain>
  );
}
