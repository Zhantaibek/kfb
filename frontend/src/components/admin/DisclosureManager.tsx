"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { adminJson, useAdminStore } from "@/lib/cms/client";
import css from "@/app/admin/admin.module.css";

type Row = { id: string; date: string; title: string; url: string; source: "kse" | "manual" | string };

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Существенные факты эмитентов (вкладка «Новости компании» на странице эмитента). Синхронизация с kse.kg
 * добавляет новые события сама раз в 6 часов; здесь — добавить событие вручную или убрать ошибочное.
 */
export function DisclosureManager() {
  const { store, error: storeError } = useAdminStore();
  const issuers = useMemo(() => [...(store?.issuers ?? [])].sort((a, b) => a.name.localeCompare(b.name, "ru")), [store]);
  const [slug, setSlug] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    adminJson<Row[]>(`/api/admin/disclosures?issuer=${encodeURIComponent(slug)}`)
      .then((data) => !cancelled && setRows(data))
      .catch((reason: Error) => !cancelled && setError(reason.message));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function reload() {
    setRows(await adminJson<Row[]>(`/api/admin/disclosures?issuer=${encodeURIComponent(slug)}`));
  }

  function pick(next: string) {
    setSlug(next);
    setRows(null);
    setError(null);
    setNotice(null);
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await adminJson("/api/admin/disclosures", {
        method: "POST",
        body: JSON.stringify({ issuerSlug: slug, date: data.get("date"), title: data.get("title"), url: data.get("url") }),
      });
      form.reset();
      await reload();
      setNotice("Событие добавлено и уже видно на странице эмитента.");
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: Row) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await adminJson(`/api/admin/disclosures/${encodeURIComponent(row.id)}`, { method: "DELETE" });
      await reload();
      setNotice(
        row.source === "kse"
          ? "Событие удалено. Если оно всё ещё есть на kse.kg, синхронизация добавит его снова."
          : "Событие удалено.",
      );
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p className={css.kicker}>Контент</p>
      <h1>Раскрытие информации</h1>
      <p className={css.lead}>
        Существенные факты эмитентов. Новые события с kse.kg подтягиваются сами раз в 6 часов; здесь можно добавить
        событие вручную или удалить ошибочное.
      </p>
      {storeError ? <p className={css.error}>{storeError}</p> : null}

      <label className={css.field} style={{ maxWidth: 520 }}>
        <span>Эмитент</span>
        <select value={slug} onChange={(event) => pick(event.target.value)}>
          <option value="">— выберите эмитента —</option>
          {issuers.map((issuer) => (
            <option key={issuer.slug} value={issuer.slug}>
              {issuer.name}
            </option>
          ))}
        </select>
      </label>

      {slug ? (
        <>
          <form className={css.form} onSubmit={(event) => void add(event)}>
            <div className={css.fields}>
              <label className={css.field}>
                <span>Дата раскрытия</span>
                <input name="date" type="date" defaultValue={today()} required />
              </label>
              <label className={css.field}>
                <span>Событие</span>
                <input name="title" placeholder="Решения, принятые общим собранием акционеров" maxLength={500} required />
              </label>
              <label className={css.field}>
                <span>Ссылка на сообщение</span>
                <input name="url" type="url" placeholder="https://oi.kse.kg/report/…" pattern="https://.+" maxLength={500} required />
              </label>
            </div>
            <div className={css.rowActions}>
              <button className={css.primary} type="submit" disabled={busy}>
                Добавить событие
              </button>
            </div>
          </form>

          {error ? <p className={css.error}>{error}</p> : null}
          {notice ? <p className={css.ok}>{notice}</p> : null}

          <div className={css.table}>
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Событие</th>
                  <th>Источник</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {rows === null ? (
                  <tr>
                    <td colSpan={4}>Загрузка…</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={4}>Событий пока нет.</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{row.date}</td>
                      <td>
                        <a href={row.url} target="_blank" rel="noopener noreferrer">
                          {row.title}
                        </a>
                      </td>
                      <td>{row.source === "manual" ? "вручную" : "kse.kg"}</td>
                      <td>
                        <button className={css.danger} type="button" disabled={busy} onClick={() => void remove(row)}>
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </>
  );
}
