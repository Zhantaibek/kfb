"use client";

import Link from "next/link";
import { useApp } from "@/components/AppProviders";
import { useTr } from "@/lib/use-tr";
import ui from "@/app/ui.module.css";

export function WatchButton({ ticker }: { ticker: string }) {
  const { user, watchlist, toggleWatch } = useApp();
  const tr = useTr();
  const on = watchlist.includes(ticker);

  if (!user) {
    return (
      <Link className={ui.ghost} href="/login">
        {tr("Войти, чтобы добавить в избранное")}
      </Link>
    );
  }

  return (
    <button className={on ? ui.ghost : ui.primary} type="button" onClick={() => toggleWatch(ticker)}>
      {on ? tr("Убрать из избранного") : tr("В избранное")}
    </button>
  );
}
