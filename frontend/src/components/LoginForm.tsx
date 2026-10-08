"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProviders";
import { useTr } from "@/lib/use-tr";
import ui from "@/app/ui.module.css";
import styles from "@/app/login/login.module.css";

/** Куда вернуть после входа: только пути этого же сайта (защита от открытого редиректа). */
function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
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
    const result = await login(String(data.get("email")), String(data.get("password")));
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    const next = nextPath();
    const target = next ?? (result.staff ? "/admin" : "/cabinet");
    router.push(target);
  }

  return (
    <form className={`${ui.form} ${styles.form}`} onSubmit={(event) => void submit(event)}>
      <label className={styles.field}>
        <span>{tr("E-mail")}</span>
        <input name="email" type="email" placeholder={tr("E-mail")} defaultValue="investor@kse.kg" required />
        <MailIcon />
      </label>
      <label className={styles.field}>
        <span>{tr("Пароль")}</span>
        <input
          name="password"
          type="password"
          placeholder={tr("Пароль")}
          defaultValue="kse"
          required
          minLength={4}
        />
        <LockIcon />
      </label>
      {error ? (
        <p className={ui.down}>{tr(error)}</p>
      ) : (
        <p className={ui.muted}>{tr("Учётную запись выдаёт биржа. Демо: investor@kse.kg / kse.")}</p>
      )}
      <button className={ui.primary} type="submit" disabled={busy}>
        {busy ? "…" : tr("Войти")}
      </button>
    </form>
  );
}
