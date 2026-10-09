"use client";

import { useState, type ReactNode } from "react";
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

/** Поля, которые переводятся на кыргызский и английский. */
const settingsFields = ["tagline", "address", "copyright"];

/** Блок формы: заголовок, где это видно на сайте, и поля. */
function Group({ title, where, children }: { title: string; where: string; children: ReactNode }) {
  return (
    <section className={css.settingsGroup}>
      <header>
        <h2>{title}</h2>
        <p>{where}</p>
      </header>
      <div className={css.fields}>{children}</div>
    </section>
  );
}

/**
 * «Подвал и контакты» — всё, что видно в подвале сайта и на странице «Контакты», в одном месте.
 * Раньше было два раздела («Контакты и подвал», «Ссылки подвала»); ссылки в подвале больше не выводятся.
 */
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
      <h1>Подвал и контакты</h1>
      <p className={css.lead}>
        Всё, что видно в подвале сайта и на странице «Контакты». Тексты — на русском, кыргызском и английском (вкладки ниже), телефоны,
        почта и ссылки — общие для всех языков.
      </p>
      {error ? <p className={css.error}>{error}</p> : null}
      <form
        className={css.form}
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <LocaleTabs lang={lang} onChange={setLang} i18n={editing.i18n} fields={settingsFields} item={editing} />

        <Group title="Баннер подвала" where="Бирюзовый баннер внизу каждой страницы. Первое предложение — крупный заголовок, остальное — подпись мельче.">
          <label className={`${css.field} ${css.wide}`}>
            <span>Текст баннера</span>
            <textarea rows={3} value={readLocaleField(editing, lang, "tagline")} onChange={(event) => setField("tagline", event.target.value)} />
          </label>
        </Group>

        <Group title="Контакты" where="Телефоны, почта и адрес — в баннере подвала и на странице «Контакты». Факс и телефон раскрытия — только на «Контактах».">
          <label className={css.field}>
            <span>Телефоны — каждый с новой строки</span>
            <textarea value={editing.phones} onChange={(event) => patch({ phones: event.target.value })} />
          </label>
          <label className={css.field}>
            <span>Почта — каждая с новой строки</span>
            <textarea value={editing.emails} onChange={(event) => patch({ emails: event.target.value })} />
          </label>
          <label className={`${css.field} ${css.wide}`}>
            <span>Адрес</span>
            <input value={readLocaleField(editing, lang, "address")} onChange={(event) => setField("address", event.target.value)} />
          </label>
          <label className={css.field}>
            <span>Факс</span>
            <input value={editing.fax} onChange={(event) => patch({ fax: event.target.value })} />
          </label>
          <label className={css.field}>
            <span>Телефон отдела раскрытия информации</span>
            <input value={editing.disclosurePhone} onChange={(event) => patch({ disclosurePhone: event.target.value })} />
          </label>
        </Group>

        <Group title="Соцсети" where="Круглые иконки справа в баннере подвала. Оставьте поле пустым — иконка не показывается.">
          <label className={css.field}>
            <span>Facebook</span>
            <input value={editing.facebookUrl} placeholder="https://facebook.com/…" onChange={(event) => patch({ facebookUrl: event.target.value })} />
          </label>
          <label className={css.field}>
            <span>Instagram</span>
            <input value={editing.instagramUrl} placeholder="https://instagram.com/…" onChange={(event) => patch({ instagramUrl: event.target.value })} />
          </label>
          <label className={css.field}>
            <span>Telegram</span>
            <input value={editing.telegramUrl} placeholder="https://t.me/…" onChange={(event) => patch({ telegramUrl: event.target.value })} />
          </label>
        </Group>

        <Group title="Нижняя строка" where="Мелкая строка под баннером подвала, слева.">
          <label className={`${css.field} ${css.wide}`}>
            <span>Копирайт</span>
            <input value={readLocaleField(editing, lang, "copyright")} onChange={(event) => setField("copyright", event.target.value)} />
          </label>
        </Group>

        <div className={css.rowActions}>
          <button className={css.primary} disabled={busy} type="submit">
            Сохранить
          </button>
          {form ? (
            <button className={css.ghost} type="button" onClick={() => setSetting(null)}>
              Отменить изменения
            </button>
          ) : null}
        </div>
      </form>
    </>
  );
}
