"use client";

import { useEffect, useState, type FormEvent } from "react";
import { adminJson } from "@/lib/cms/client";
import css from "@/app/admin/admin.module.css";

type Status = { enabled: boolean; required: boolean };
type Setup = { secret: string; uri: string; qrSvg: string };

/** Секрет группами по 4 знака — так его проще ввести в приложение вручную. */
function groups(secret: string) {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * Двухфакторный вход своей учётной записи: подключение приложения-аутентификатора по QR-коду и подтверждение
 * первым кодом. Когда 2FA обязателен, сотрудник без него попадает сюда при любом входе в админку.
 */
export function MfaPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminJson<Status>("/api/admin/mfa")
      .then(setStatus)
      .catch((reason: Error) => setError(reason.message));
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      await action();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function begin() {
    void run(async () => {
      setSetup(await adminJson<Setup>("/api/admin/mfa/setup", { method: "POST" }));
    });
  }

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code"));
    void run(async () => {
      await adminJson("/api/admin/mfa/enable", { method: "POST", body: JSON.stringify({ code }) });
      setSetup(null);
      setStatus((current) => (current ? { ...current, enabled: true } : current));
      setDone("Двухфакторный вход включён. При следующем входе понадобится код из приложения.");
    });
  }

  function disable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code"));
    void run(async () => {
      await adminJson("/api/admin/mfa/disable", { method: "POST", body: JSON.stringify({ code }) });
      setStatus((current) => (current ? { ...current, enabled: false } : current));
      setDone("Двухфакторный вход отключён.");
    });
  }

  const codeInput = (
    <label className={css.field}>
      <span>Код из приложения</span>
      <input
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123 456"
        pattern="\d{3}\s?\d{3}"
        maxLength={7}
        required
      />
    </label>
  );

  return (
    <section className={css.card} style={{ display: "grid", gap: 14, maxWidth: 560 }}>
      <h2 style={{ margin: 0 }}>Двухфакторный вход</h2>

      {status && !status.enabled && status.required && !setup ? (
        <p className={css.error}>
          Для сотрудников биржи двухфакторный вход обязателен. Настройте его, чтобы продолжить работу в админ-панели.
        </p>
      ) : null}

      {status?.enabled ? (
        <>
          <p className={css.ok}>Включён: при входе, кроме пароля, нужен код из приложения-аутентификатора.</p>
          {status.required ? (
            <p className={css.note}>
              Отключить нельзя — 2FA обязателен. Если телефон потерян, попросите администратора сбросить 2FA в разделе
              «Пользователи».
            </p>
          ) : (
            <form onSubmit={disable} style={{ display: "grid", gap: 10 }}>
              {codeInput}
              <div className={css.rowActions}>
                <button className={css.ghost} type="submit" disabled={busy}>
                  Отключить 2FA
                </button>
              </div>
            </form>
          )}
        </>
      ) : null}

      {status && !status.enabled && !setup ? (
        <>
          <p className={css.lead}>
            Установите на телефон приложение-аутентификатор (Google Authenticator, Microsoft Authenticator, Яндекс Ключ и
            др.) и подключите его к своей учётной записи.
          </p>
          <div className={css.rowActions}>
            <button className={css.primary} type="button" onClick={begin} disabled={busy}>
              Настроить двухфакторный вход
            </button>
          </div>
        </>
      ) : null}

      {setup ? (
        <form onSubmit={confirm} style={{ display: "grid", gap: 12 }}>
          <p className={css.lead}>1. Отсканируйте QR-код в приложении-аутентификаторе.</p>
          {/* SVG собран сервером из ссылки otpauth:// — показываем картинкой, без вставки разметки в страницу. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- data:-картинка, оптимизировать нечего */}
          <img
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(setup.qrSvg)}`}
            alt="QR-код для приложения-аутентификатора"
            width={200}
            height={200}
            style={{ background: "#fff", borderRadius: 12, padding: 8 }}
          />
          <p className={css.note}>
            Не получается отсканировать? Введите ключ вручную: <code style={{ userSelect: "all" }}>{groups(setup.secret)}</code>
          </p>
          <p className={css.lead}>2. Введите 6 цифр, которые показывает приложение.</p>
          {codeInput}
          <div className={css.rowActions}>
            <button className={css.primary} type="submit" disabled={busy}>
              Подтвердить и включить
            </button>
            <button className={css.ghost} type="button" onClick={() => setSetup(null)} disabled={busy}>
              Отмена
            </button>
          </div>
        </form>
      ) : null}

      {error ? <p className={css.error}>{error}</p> : null}
      {done ? <p className={css.ok}>{done}</p> : null}
    </section>
  );
}
