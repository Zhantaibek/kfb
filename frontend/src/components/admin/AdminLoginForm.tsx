"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProviders";
import { Logo } from "@/components/Logo";
import { AdminLangSwitch } from "@/components/admin/AdminLangSwitch";
import css from "@/app/admin/admin.module.css";

export function AdminLoginForm() {
  const router = useRouter();
  const { tr, login, verifyMfa } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Билет второго шага: пароль верный, включён 2FA — ждём код из приложения.
  const [ticket, setTicket] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    try {
      const result = ticket
        ? await verifyMfa(ticket, String(data.get("code")))
        : await login(String(data.get("email")), String(data.get("password")));
      if ("mfaTicket" in result) {
        setTicket(result.mfaTicket);
        return;
      }
      if ("error" in result) {
        setError(result.error);
        if (ticket && /истекло/.test(result.error)) setTicket(null);
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
        {ticket ? (
          <>
            <label className={css.field}>
              <span>{tr("Код из приложения")}</span>
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123 456"
                pattern="\d{3}\s?\d{3}"
                maxLength={7}
                required
                autoFocus
              />
            </label>
            {error ? <p className={css.error}>{tr(error)}</p> : <p className={css.lead}>{tr("Введите 6 цифр из приложения-аутентификатора.")}</p>}
            <button className={css.primary} disabled={busy} type="submit">
              {tr("Подтвердить")}
            </button>
            <button className={css.ghost} type="button" onClick={() => { setTicket(null); setError(null); }}>
              {tr("Назад")}
            </button>
          </>
        ) : (
          <>
            <label className={css.field}>
              <span>E-mail</span>
              <input name="email" type="email" autoComplete="username" required />
            </label>
            <label className={css.field}>
              <span>{tr("Пароль")}</span>
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
            {error ? <p className={css.error}>{tr(error)}</p> : null}
            <button className={css.primary} disabled={busy} type="submit">
              {tr("Войти")}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
