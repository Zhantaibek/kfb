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
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
      });
      // Прокси при недоступном API может вернуть не JSON — тогда показываем общую ошибку.
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Ошибка входа");
        return;
      }
      router.replace("/admin/dashboard");
    } catch {
      setError("Не удалось войти. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={css.login}>
      <div className={css.loginBackdrop} aria-hidden="true" />
      <div className={css.loginLang}>
        <AdminLangSwitch />
      </div>
      {/* Поля пустые: сайт ничего не подставляет сам; автозаполнение браузера работает как обычно. */}
      <form className={css.loginCard} onSubmit={submit}>
        <Logo />
        <h1>{tr("Портал администратора")}</h1>
        <p className={css.lead}>{tr("CMS Кыргызской фондовой биржи — новости, страницы, фото и заявки.")}</p>
        <label className={css.field}>
          <span>E-mail</span>
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label className={css.field}>
          <span>{tr("Пароль")}</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {error ? <p className={css.error}>{error}</p> : null}
        <button className={css.primary} disabled={busy} type="submit">
          {tr("Войти")}
        </button>
      </form>
    </div>
  );
}
