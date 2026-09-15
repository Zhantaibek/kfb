"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/lib/cms/client";
import { incompleteTranslation, readLocaleField, writeLocaleField, type ContentLang } from "@/lib/cms/locale";
import type { CmsSlide } from "@/lib/cms/types";
import { LocaleDots, LocaleTabs } from "@/components/admin/LocaleTabs";
import css from "@/app/admin/admin.module.css";

const empty: Omit<CmsSlide, "id"> = { title: "", text: "", href: "/", value: "", photo: "", order: 1, i18n: {} };
const slideFields = ["title", "text", "value"];

export function SliderManager() {
  const { store, error, busy, mutate, upload, setError } = useAdminStore();
  const [editing, setEditing] = useState<Partial<CmsSlide> | null>(null);
  const [lang, setLang] = useState<ContentLang>("ru");
  const slides = [...(store?.slides ?? [])].sort((a, b) => a.order - b.order);

  useEffect(() => {
    setLang("ru");
  }, [editing?.id]);

  function setField(field: string, value: string) {
    if (!editing) return;
    setEditing(writeLocaleField(editing, lang, field, value));
  }

  async function save() {
    if (!editing?.title) return;
    const gap = incompleteTranslation(editing, slideFields);
    if (gap) {
      setError(gap.message);
      setLang(gap.lang);
      return;
    }
    const item = { ...empty, ...editing, order: Number(editing.order) || slides.length + 1 };
    if (editing.id) await mutate("update", "slides", item, editing.id);
    else await mutate("create", "slides", item);
    setEditing(null);
  }

  return (
    <>
      <p className={css.kicker}>CMS · КФБ</p>
      <h1>Слайдер</h1>
      <p className={css.lead}>Баннеры на главной. Заголовок и текст обязательны на русском, кыргызском и английском.</p>
      <div className={css.toolbar}>
        <button className={css.primary} type="button" onClick={() => setEditing({ ...empty, order: slides.length + 1 })}>
          + Добавить слайд
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
            <LocaleTabs lang={lang} onChange={setLang} i18n={editing.i18n} fields={slideFields} item={editing} />
            <label className={css.field}>
              <span>Заголовок</span>
              <input
                value={readLocaleField(editing, lang, "title")}
                onChange={(event) => setField("title", event.target.value)}
                required
              />
            </label>
            <label className={css.field}>
              <span>Значение / бейдж</span>
              <input value={readLocaleField(editing, lang, "value")} onChange={(event) => setField("value", event.target.value)} />
            </label>
            <label className={`${css.field} ${css.wide}`}>
              <span>Текст</span>
              <input value={readLocaleField(editing, lang, "text")} onChange={(event) => setField("text", event.target.value)} />
            </label>
            <label className={css.field}>
              <span>Ссылка</span>
              <input value={editing.href ?? ""} onChange={(event) => setEditing({ ...editing, href: event.target.value })} />
            </label>
            <label className={css.field}>
              <span>Порядок</span>
              <input type="number" value={editing.order ?? 1} onChange={(event) => setEditing({ ...editing, order: Number(event.target.value) })} />
            </label>
            <label className={css.field}>
              <span>Фото</span>
              <select value={editing.photo ?? ""} onChange={(event) => setEditing({ ...editing, photo: event.target.value })}>
                <option value="">Без фото</option>
                {(store?.media ?? []).map((item) => (
                  <option key={item.id} value={item.url}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={css.field}>
              <span>Загрузить фото</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const media = await upload(file);
                  setEditing((current) => ({ ...current, photo: media.url }));
                }}
              />
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
              <th>#</th>
              <th>Слайд</th>
              <th>Ссылка</th>
              <th>Фото</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {slides.map((item) => (
              <tr key={item.id}>
                <td>{item.order}</td>
                <td className={css.wrap}>
                  <b>
                    {item.title}
                    <LocaleDots i18n={item.i18n} fields={slideFields} item={item} />
                  </b>
                  <div>{item.text}</div>
                </td>
                <td>{item.href}</td>
                <td>{item.photo ? <img className={css.thumb} src={item.photo} alt="" /> : "—"}</td>
                <td>
                  <div className={css.rowActions}>
                    <button className={css.ghost} type="button" onClick={() => setEditing(item)}>
                      Изменить
                    </button>
                    <button className={css.danger} type="button" onClick={() => void mutate("delete", "slides", undefined, item.id)}>
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
