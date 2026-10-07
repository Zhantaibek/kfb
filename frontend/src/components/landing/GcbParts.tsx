"use client";

import { useState, type FormEvent } from "react";
import type { CmsGcbParticipant, CmsLandingSection } from "@/lib/cms/types";
import { useTr } from "@/lib/use-tr";
import { lines } from "./landing-data";
import css from "./landing.module.css";

/** «Как купить ГКВ-12 и ГКО-2?»: участники торгов ГЦБ с переключателем «Брокеры / Банки». */
export function GcbCompanies({ companies }: { companies: CmsGcbParticipant[] }) {
  const tr = useTr();
  const [type, setType] = useState<CmsGcbParticipant["type"]>("broker");
  return (
    <>
      <div className={css.tabs} role="tablist">
        {(["broker", "bank"] as const).map((key) => (
          <button key={key} type="button" role="tab" aria-selected={type === key} data-on={String(type === key)} onClick={() => setType(key)}>
            {tr(key === "broker" ? "Брокеры" : "Банки")}
          </button>
        ))}
      </div>
      <div className={css.companies}>
        {companies
          .filter((item) => item.type === type)
          .map((item) => (
            <details key={item.id} className={css.company}>
              <summary>{item.title}</summary>
              <div>
                {item.address ? <span>{item.address}</span> : null}
                {lines(item.phones).map((phone) => (
                  <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                    {phone}
                  </a>
                ))}
                {lines(item.emails).map((mail) => (
                  <a key={mail} href={`mailto:${mail}`}>
                    {mail}
                  </a>
                ))}
                {item.website ? (
                  <a href={item.website} target="_blank" rel="noreferrer">
                    {item.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                ) : null}
              </div>
            </details>
          ))}
      </div>
    </>
  );
}

const fields = [
  { name: "Имя", type: "text", autoComplete: "given-name" },
  { name: "Фамилия", type: "text", autoComplete: "family-name" },
  { name: "Email", type: "email", autoComplete: "email", full: true },
  { name: "Номер телефона", type: "tel", autoComplete: "tel", full: true },
  { name: "Место жительства", type: "text", autoComplete: "address-level2", full: true },
];

/** «Заполните форму для покупки ГЦБ» — заявка попадает в админку, раздел «Заявки». */
export function GcbBuyForm({ block }: { block: CmsLandingSection }) {
  const tr = useTr();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("busy");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value).trim()]));
    const response = await fetch("/api/public/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "Покупка ГЦБ", payload }),
    }).catch(() => null);
    setState(response?.ok ? "done" : "error");
  }

  if (state === "done") {
    return (
      <div className={css.form}>
        <h2>{tr("Заявка отправлена")}</h2>
        <p className={css.ok}>{block.text || tr("Спасибо! Специалист биржи свяжется с вами.")}</p>
      </div>
    );
  }

  return (
    <form className={css.form} onSubmit={submit}>
      <h2>{block.title || tr("Заполните форму для покупки ГЦБ")}</h2>
      {fields.map((field) => (
        <label key={field.name} className={field.full ? css.full : undefined}>
          {tr(field.name)}
          <input name={field.name} type={field.type} autoComplete={field.autoComplete} required />
        </label>
      ))}
      <label>
        {tr("Вид ГЦБ")}
        <select name="Вид ГЦБ" required defaultValue="">
          <option value="" disabled>
            {tr("Выберите тип ГЦБ")}
          </option>
          <option value="ГКВ-12">ГКВ-12</option>
          <option value="ГКО-2">ГКО-2</option>
        </select>
      </label>
      <label>
        {tr("Количество ГЦБ")}
        <input name="Количество ГЦБ" type="number" min={1} step={1} required />
      </label>
      {state === "error" ? <p className={css.err}>{tr("Не удалось отправить. Попробуйте ещё раз.")}</p> : null}
      <button className={css.btn} type="submit" disabled={state === "busy"}>
        {tr(state === "busy" ? "Отправка…" : "Отправить")}
      </button>
    </form>
  );
}
