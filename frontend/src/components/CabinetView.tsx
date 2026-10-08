"use client";

import Link from "next/link";
import { useApp } from "@/components/AppProviders";
import { formatChange, formatSom, getInstrument } from "@/data/catalog";
import { useTr } from "@/lib/use-tr";
import ui from "@/app/ui.module.css";

export function CabinetView() {
  const { user, authReady, watchlist, toggleWatch, logout } = useApp();
  const tr = useTr();

  if (!authReady) {
    return (
      <div className={ui.card}>
        <p>{tr("Проверка сессии…")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={ui.card}>
        <h2>{tr("Нужен вход")}</h2>
        <p>{tr("Войдите, чтобы открыть личный кабинет.")}</p>
        <Link className={ui.primary} href="/login" style={{ marginTop: 16, display: "inline-flex" }}>
          {tr("Войти")}
        </Link>
      </div>
    );
  }

  return (
    <div className={ui.grid}>
      <article className={ui.card}>
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        <button className={ui.ghost} type="button" onClick={() => void logout()} style={{ marginTop: 16 }}>
          {tr("Выйти")}
        </button>
      </article>
      <article className={ui.card}>
        <h2>{tr("Избранные бумаги")}</h2>
        <div className={ui.list}>
          {watchlist.length === 0 ? <p>{tr("Список пуст — добавьте бумаги со страницы котировок.")}</p> : null}
          {watchlist.map((ticker) => {
            const item = getInstrument(ticker);
            return (
              <div className={ui.row} key={ticker}>
                <Link href={`/market/${ticker}`}>
                  <b>{ticker}</b> {item ? tr(item.name) : null}
                </Link>
                {item ? (
                  <small>
                    {formatSom(item.price)} {tr("сом")} · {formatChange(item.change)}
                  </small>
                ) : null}
                <button className={ui.ghost} type="button" onClick={() => toggleWatch(ticker)}>
                  {tr("Удалить")}
                </button>
              </div>
            );
          })}
        </div>
      </article>
      <article className={ui.card}>
        <h2>{tr("Как купить бумаги")}</h2>
        <p>{tr("Откройте счёт у участника торгов и выберите инструмент в котировках.")}</p>
        <Link className={ui.primary} href="/members" style={{ marginTop: 16, display: "inline-flex" }}>
          {tr("Участники")}
        </Link>
      </article>
    </div>
  );
}
