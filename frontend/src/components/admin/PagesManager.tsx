"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/lib/cms/client";
import { incompleteTranslation, isLocaleValueFilled, readLocaleField, writeLocaleField, type ContentLang } from "@/lib/cms/locale";
import type { CmsPage, PublishStatus } from "@/lib/cms/types";
import { LocaleDots, LocaleTabs } from "@/components/admin/LocaleTabs";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import css from "@/app/admin/admin.module.css";

const empty: Omit<CmsPage, "id" | "updatedAt"> = { path: "/p/new", title: "", lead: "", body: "", status: "published", i18n: {} };
const pageFields = ["title", "lead", "body"];

export function PagesManager() {
  const { store, error, busy, mutate, upload, setError } = useAdminStore();
  const [editing, setEditing] = useState<Partial<CmsPage> | null>(null);
  const [lang, setLang] = useState<ContentLang>("ru");

  useEffect(() => {
    setLang("ru");
  }, [editing?.id]);

  function setField(field: string, value: string) {
    if (!editing) return;
    setEditing(writeLocaleField(editing, lang, field, value));
  }

  async function save() {
    if (!editing?.title || !editing.path) return;
    if (!isLocaleValueFilled(editing.body, "body")) {
      setError("Укажите текст страницы на русском, кыргызском и английском.");
      setLang("ru");
      return;
    }
    const gap = incompleteTranslation(editing, pageFields);
    if (gap) {
      setError(gap.message);
      setLang(gap.lang);
      return;
    }
    if (editing.id) await mutate("update", "pages", { ...empty, ...editing }, editing.id);
    else await mutate("create", "pages", { ...empty, ...editing });
    setEditing(null);
  }

  return (
    <>
      <p className={css.kicker}>CMS · КФБ</p>
      <h1>Страницы</h1>
      <p className={css.lead}>
        Каждая страница обязательна на русском, кыргызском и английском. Если путь совпадает с разделом (например /about/auditor), посетитель увидит этот текст.
        Новые страницы открываются по Path, например /p/partners.
      </p>
      <div className={css.toolbar}>
        <button className={css.primary} type="button" onClick={() => setEditing({ ...empty })}>
          + Добавить страницу
        </button>
      </div>
      {error ? <p className={css.error}>{error}</p> : null}
      {editing ? (
        <form
          className={css.form}
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <div className={css.fields}>
            <LocaleTabs lang={lang} onChange={setLang} i18n={editing.i18n} fields={pageFields} item={editing} />
            <label className={css.field}>
              <span>Заголовок</span>
              <input
                value={readLocaleField(editing, lang, "title")}
                onChange={(event) => setField("title", event.target.value)}
                required
              />
            </label>
            <label className={css.field}>
              <span>Path</span>
              <input value={editing.path ?? ""} onChange={(event) => setEditing({ ...editing, path: event.target.value })} required />
            </label>
            <label className={`${css.field} ${css.wide}`}>
              <span>Лид</span>
              <input value={readLocaleField(editing, lang, "lead")} onChange={(event) => setField("lead", event.target.value)} />
            </label>
            <div className={css.wide}>
              <RichTextEditor
                label="Текст страницы"
                hint="Вставьте фото в текст кнопкой ниже и сразу меняйте размер и расположение."
                value={readLocaleField(editing, lang, "body")}
                onChange={(body) => setField("body", body)}
                media={store?.media}
                onUpload={async (file) => (await upload(file)).url}
              />
            </div>
            <label className={css.field}>
              <span>Статус</span>
              <select
                value={editing.status ?? "published"}
                onChange={(event) => setEditing({ ...editing, status: event.target.value as PublishStatus })}
              >
                <option value="published">published</option>
                <option value="draft">draft</option>
              </select>
            </label>
          </div>
          <div className={css.rowActions}>
            <button className={css.primary} disabled={busy} type="submit">
              Сохранить
            </button>
            <button className={css.ghost} type="button" onClick={() => setEditing(null)}>
              Отмена
            </button>
          </div>
        </form>
      ) : null}
      <div className={css.table}>
        <table>
          <thead>
            <tr>
              <th>Статус</th>
              <th>Страница</th>
              <th>Path</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {(store?.pages ?? []).map((item) => (
              <tr key={item.id}>
                <td>
                  <span className={css.status} data-on={item.status}>
                    {item.status}
                  </span>
                </td>
                <td className={css.wrap}>
                  <b>
                    {item.title}
                    <LocaleDots i18n={item.i18n} fields={pageFields} item={item} />
                  </b>
                  <div>{item.lead}</div>
                </td>
                <td>{item.path}</td>
                <td>
                  <div className={css.rowActions}>
                    <a className={css.ghost} href={item.path.startsWith("/") ? item.path : `/p/${item.path}`} target="_blank" rel="noreferrer">
                      Открыть
                    </a>
                    <button className={css.ghost} type="button" onClick={() => setEditing(item)}>
                      Изменить
                    </button>
                    <button className={css.danger} type="button" onClick={() => void mutate("delete", "pages", undefined, item.id)}>
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
