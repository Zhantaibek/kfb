"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProviders";
import { useTr } from "@/lib/use-tr";
import ui from "@/app/ui.module.css";
import styles from "@/app/login/login.module.css";

/**
 * Куда вернуть после входа: только страницы этого же сайта (защита от открытого редиректа).
 * Сверяем origin после разбора URL — простая проверка «начинается с /» пропускала бы «/\evil.com».
 */
function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next) return null;
  try {
    const url = new URL(next, window.location.origin);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : null;
  } catch {
    return null;
  }
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 7 9-7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}

export function LoginForm() {
  const { login } = useApp();
  const tr = useTr();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    try {
      const result = await login(String(data.get("email")), String(data.get("password")));
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push(nextPath() ?? "/admin");
    } catch {
      setError("Не удалось войти. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  // Поля пустые: сайт ничего не подставляет сам. Автозаполнение браузера и менеджеры паролей работают как обычно.
  return (
    <form className={`${ui.form} ${styles.form}`} onSubmit={(event) => void submit(event)}>
      <label className={styles.field}>
        <span>{tr("E-mail")}</span>
        <input name="email" type="email" placeholder={tr("E-mail")} autoComplete="username" required />
        <MailIcon />
      </label>
      <label className={styles.field}>
        <span>{tr("Пароль")}</span>
        <input
          name="password"
          type="password"
          placeholder={tr("Пароль")}
          autoComplete="current-password"
          required
          minLength={4}
        />
        <LockIcon />
      </label>
      {error ? (
        <p className={ui.down}>{tr(error)}</p>
      ) : (
        <p className={ui.muted}>{tr("Вход только для сотрудников биржи.")}</p>
      )}
      <button className={ui.primary} type="submit" disabled={busy}>
        {busy ? "…" : tr("Войти")}
      </button>
    </form>
  );
}
