"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import ui from "@/app/ui.module.css";
import { AdminEditButton } from "@/components/AdminEditButton";
import { localizeNode, useTr } from "@/lib/use-tr";

export function FeedbackForm({
  title,
  fields,
  success,
}: {
  title: string;
  fields: { name: string; label: string; type?: string; required?: boolean }[];
  success: string;
}) {
  const tr = useTr();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
    const response = await fetch("/api/public/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: title, payload }),
    });
    if (!response.ok) {
      setError("Не удалось отправить. Попробуйте ещё раз.");
      return;
    }
    setDone(true);
  }

  if (done) return <p className={ui.ok}>{tr(success)}</p>;

  return (
    <form className={ui.form} onSubmit={submit}>
      <h2>{tr(title)}</h2>
      {fields.map((field) => (
        <label className={ui.field} key={field.name}>
          <span>{tr(field.label)}</span>
          {field.type === "textarea" ? (
            <textarea name={field.name} required={field.required} />
          ) : (
            <input name={field.name} type={field.type ?? "text"} required={field.required} />
          )}
        </label>
      ))}
      {error ? <p className={ui.down}>{tr(error)}</p> : null}
      <button className={ui.primary} type="submit">
        {tr("Отправить")}
      </button>
    </form>
  );
}

export function PageIntro({
  crumb,
  title,
  lead,
}: {
  crumb: ReactNode;
  title: string;
  lead?: string;
}) {
  const tr = useTr();
  return (
    <header className={ui.pageIntro}>
      <p className={ui.crumb}>{localizeNode(crumb, tr)}</p>
      <div className={ui.titleRow}>
        <h1 className={ui.title}>{tr(title)}</h1>
        <AdminEditButton />
      </div>
      {lead ? <p className={ui.lead}>{tr(lead)}</p> : null}
    </header>
  );
}
