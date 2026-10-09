"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProviders";
import { Logo } from "@/components/Logo";
import { AdminLangSwitch } from "@/components/admin/AdminLangSwitch";
import css from "@/app/admin/admin.module.css";

export function AdminLoginForm() {
  const router = useRouter();
  const { tr } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/session", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "Ошибка входа");
      return;
    }
    router.replace("/admin/dashboard");
  }

  return (
    <div className={css.login}>
      <div className={css.loginBackdrop} aria-hidden="true" />
      <div className={css.loginLang}>
        <AdminLangSwitch />
      </div>
      <form className={css.loginCard} onSubmit={submit}>
        <Logo />
        <h1>{tr("Портал администратора")}</h1>
        <p className={css.lead}>{tr("CMS Кыргызской фондовой биржи — новости, фото, страницы и заявки.")}</p>
        <label className={css.field}>
          <span>E-mail</span>
          <input name="email" type="email" defaultValue="admin@kse.kg" required />
        </label>
        <label className={css.field}>
          <span>{tr("Пароль")}</span>
          <input name="password" type="password" defaultValue="admin" required />
        </label>
        {error ? <p className={css.error}>{error}</p> : <p className={css.lead}>{tr("Демо: admin@kse.kg / admin")}</p>}
        <button className={css.primary} disabled={busy} type="submit">
          {tr("Войти")}
        </button>
      </form>
    </div>
  );
}
