"use client";

import { useState } from "react";
import { useTr } from "@/lib/use-tr";
import ui from "@/app/ui.module.css";

export function AppDock() {
  const [open, setOpen] = useState(true);
  const tr = useTr();
  if (!open) return null;

  return (
    <aside className={ui.appDock} aria-label={tr("Мобильное приложение КФБ")}>
      <button className={ui.appClose} type="button" aria-label={tr("Закрыть")} onClick={() => setOpen(false)}>
        ✕
      </button>
      <div className={ui.appPhone} aria-hidden="true">
        <b>KSE</b>
        <small>Markets</small>
      </div>
      <div>
        <strong>{tr("Скачайте приложение КФБ")}</strong>
        <p>{tr("Котировки и новости рынка — в телефоне.")}</p>
        <div className={ui.appStores}>
          <span>App Store</span>
          <span>Google Play</span>
        </div>
      </div>
    </aside>
  );
}
