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
  const { login, verifyMfa } = useApp();
  const tr = useTr();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Билет второго шага: пароль верный, у сотрудника включён 2FA — ждём код из приложения.
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
        // Билет истёк — начинаем вход заново.
        if (ticket && /истекло/.test(result.error)) setTicket(null);
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
  if (ticket) {
    return (
      <form className={`${ui.form} ${styles.form}`} onSubmit={(event) => void submit(event)}>
        <label className={styles.field}>
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
          <LockIcon />
        </label>
        {error ? (
          <p className={ui.down}>{tr(error)}</p>
        ) : (
          <p className={ui.muted}>{tr("Введите 6 цифр из приложения-аутентификатора.")}</p>
        )}
        <button className={ui.primary} type="submit" disabled={busy}>
          {busy ? "…" : tr("Подтвердить")}
        </button>
        <button className={ui.ghost} type="button" onClick={() => { setTicket(null); setError(null); }}>
          {tr("Назад")}
        </button>
      </form>
    );
  }

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
