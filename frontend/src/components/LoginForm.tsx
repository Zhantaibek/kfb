"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProviders";
import { useTr } from "@/lib/use-tr";
import ui from "@/app/ui.module.css";

export function LoginForm() {
  const { login, register } = useApp();
  const tr = useTr();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const message =
      mode === "login"
        ? await login(String(data.get("email")), String(data.get("password")))
        : await register({
            name: String(data.get("name")),
            email: String(data.get("email")),
            password: String(data.get("password")),
          });
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    router.push("/cabinet");
  }

  return (
    <form className={ui.form} key={mode} onSubmit={(event) => void submit(event)}>
      <div className={ui.pills} style={{ marginBottom: 8 }}>
        <button type="button" data-on={mode === "login"} onClick={() => setMode("login")}>
          {tr("Вход")}
        </button>
        <button type="button" data-on={mode === "register"} onClick={() => setMode("register")}>
          {tr("Регистрация")}
        </button>
      </div>
      {mode === "register" ? (
        <label className={ui.field}>
          <span>{tr("Имя")}</span>
          <input name="name" type="text" required />
        </label>
      ) : null}
      <label className={ui.field}>
        <span>{tr("E-mail")}</span>
        <input name="email" type="email" defaultValue={mode === "login" ? "investor@kse.kg" : ""} required />
      </label>
      <label className={ui.field}>
        <span>{tr("Пароль")}</span>
        <input name="password" type="password" defaultValue={mode === "login" ? "kse" : ""} required minLength={4} />
      </label>
      {error ? (
        <p className={ui.down}>{tr(error)}</p>
      ) : (
        <p className={ui.muted}>
          {mode === "login"
            ? tr("Демо: investor@kse.kg / kse. Сессия хранится в cookie.")
            : tr("Аккаунт сохранится в PostgreSQL. Пароль не короче 4 символов.")}
        </p>
      )}
      <button className={ui.primary} type="submit" disabled={busy}>
        {busy ? "…" : mode === "login" ? tr("Войти") : tr("Создать аккаунт")}
      </button>
    </form>
  );
}
