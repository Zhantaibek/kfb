"use client";

import { useState } from "react";
import { useAdminStore } from "@/lib/cms/client";
import { incompleteTranslation, readLocaleField, writeLocaleField, type ContentLang } from "@/lib/cms/locale";
import type { CmsSiteSettings } from "@/lib/cms/types";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import css from "@/app/admin/admin.module.css";

const blank: CmsSiteSettings = {
  id: "site",
  tagline: "",
  address: "",
  phones: "",
  emails: "",
  fax: "",
  facebookUrl: "",
  instagramUrl: "",
  telegramUrl: "",
  license: "",
  copyright: "",
  eduUrl: "",
  disclosurePhone: "",
  eduPhone: "",
  i18n: {},
  updatedAt: "",
};

const settingsFields = ["tagline", "address", "license", "copyright"];

export function SettingsManager() {
  const { store, error, busy, mutate, setError } = useAdminStore();
  const saved = store?.settings?.[0];
  const [form, setSetting] = useState<CmsSiteSettings | null>(null);
  const [lang, setLang] = useState<ContentLang>("ru");
  const editing = form ?? saved ?? blank;

  async function save() {
    const item = { ...blank, ...editing, id: "site" };
    const gap = incompleteTranslation(item, settingsFields);
    if (gap) {
      setError(gap.message);
      setLang(gap.lang);
      return;
    }
    if (saved) await mutate("update", "settings", item, "site");
    else await mutate("create", "settings", item);
    setSetting(null);
  }

  function patch(next: Partial<CmsSiteSettings>) {
    setSetting({ ...editing, ...next });
  }

  function setField(field: string, value: string) {
    setSetting(writeLocaleField(editing, lang, field, value));
  }

  return (
    <>
      <p className={css.kicker}>CMS · КФБ</p>
      <h1>Настройки сайта</h1>
      <p className={css.lead}>Тексты подвала обязательны на русском, кыргызском и английском. Телефоны и почта — общие.</p>
      {error ? <p className={css.error}>{error}</p> : null}
      <form
        className={css.form}
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className={css.fields}>
          <LocaleTabs lang={lang} onChange={setLang} i18n={editing.i18n} fields={settingsFields} item={editing} />
          <label className={`${css.field} ${css.wide}`}>
            <span>Короткий текст в подвале</span>
            <input value={readLocaleField(editing, lang, "tagline")} onChange={(event) => setField("tagline", event.target.value)} />
          </label>
          <label className={`${css.field} ${css.wide}`}>
            <span>Адрес</span>
            <input value={readLocaleField(editing, lang, "address")} onChange={(event) => setField("address", event.target.value)} />
          </label>
          <label className={css.field}>
            <span>Телефоны (каждый с новой строки)</span>
            <textarea value={editing.phones} onChange={(event) => patch({ phones: event.target.value })} />
          </label>
          <label className={css.field}>
            <span>Почта (каждая с новой строки)</span>
            <textarea value={editing.emails} onChange={(event) => patch({ emails: event.target.value })} />
          </label>
          <label className={css.field}>
            <span>Facebook (иконка в подвале; пусто — скрыта)</span>
            <input
              value={editing.facebookUrl}
              placeholder="https://facebook.com/…"
              onChange={(event) => patch({ facebookUrl: event.target.value })}
            />
          </label>
          <label className={css.field}>
            <span>Instagram</span>
            <input
              value={editing.instagramUrl}
              placeholder="https://instagram.com/…"
              onChange={(event) => patch({ instagramUrl: event.target.value })}
            />
          </label>
          <label className={css.field}>
            <span>Telegram</span>
            <input
              value={editing.telegramUrl}
              placeholder="https://t.me/…"
              onChange={(event) => patch({ telegramUrl: event.target.value })}
            />
          </label>
          <label className={css.field}>
            <span>Факс</span>
            <input value={editing.fax} onChange={(event) => patch({ fax: event.target.value })} />
          </label>
          <label className={css.field}>
            <span>Лицензия</span>
            <input value={readLocaleField(editing, lang, "license")} onChange={(event) => setField("license", event.target.value)} />
          </label>
          <label className={css.field}>
            <span>Телефон раскрытия</span>
            <input value={editing.disclosurePhone} onChange={(event) => patch({ disclosurePhone: event.target.value })} />
          </label>
          <label className={css.field}>
            <span>Телефон учебного центра</span>
            <input value={editing.eduPhone} onChange={(event) => patch({ eduPhone: event.target.value })} />
          </label>
          <label className={`${css.field} ${css.wide}`}>
            <span>Учебная платформа (ссылка)</span>
            <input value={editing.eduUrl} onChange={(event) => patch({ eduUrl: event.target.value })} />
          </label>
          <label className={`${css.field} ${css.wide}`}>
            <span>Копирайт внизу сайта</span>
            <input value={readLocaleField(editing, lang, "copyright")} onChange={(event) => setField("copyright", event.target.value)} />
          </label>
        </div>
        <div className={css.rowActions}>
          <button className={css.primary} disabled={busy} type="submit">
            Сохранить
          </button>
        </div>
      </form>
    </>
  );
}
