"use client";

import { useState } from "react";
import { useAdminStore } from "@/lib/cms/client";
import { useContentLang } from "@/lib/cms/use-content-lang";
import { incompleteTranslation, readLocaleField, writeLocaleField } from "@/lib/cms/locale";
import {
  managementGroupIds,
  managementGroupTitles,
  type CmsCareerRow,
  type CmsManagementPerson,
  type ManagementGroupId,
  type PublishStatus,
} from "@/lib/cms/types";
import { LocaleDots, LocaleTabs } from "@/components/admin/LocaleTabs";
import css from "@/app/admin/admin.module.css";

const empty: Omit<CmsManagementPerson, "id" | "updatedAt"> = {
  slug: "",
  name: "",
  role: "",
  group: "board",
  photo: "",
  bio: "",
  education: "",
  career: [],
  order: 1,
  status: "draft",
  i18n: {},
};

const strictFields = ["name", "role"];

function slugify(name: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
    н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return name
    .toLowerCase()
    .split("")
    .map((char) => map[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")[0] ?? "";
}

export function ManagementManager() {
  const { store, error, busy, mutate, upload, setError } = useAdminStore();
  const [editing, setEditing] = useState<Partial<CmsManagementPerson> | null>(null);
  const [lang, setLang] = useContentLang(editing?.id);
  const people = [...(store?.management ?? [])].sort((a, b) => a.order - b.order);

  function setField(field: string, value: string) {
    if (!editing) return;
    setEditing(writeLocaleField(editing, lang, field, value));
  }

  function setCareer(rows: CmsCareerRow[]) {
    setEditing((current) => (current ? { ...current, career: rows } : current));
  }

  function setCareerCell(index: number, field: keyof CmsCareerRow, value: string) {
    const rows = [...(editing?.career ?? [])];
    rows[index] = { ...rows[index], [field]: value };
    setCareer(rows);
  }

  async function save() {
    if (!editing?.name || !editing.role) return;
    const gap = incompleteTranslation(editing, strictFields, ["name"]);
    if (gap) {
      setError(gap.message);
      setLang(gap.lang);
      return;
    }
    const item = {
      ...empty,
      ...editing,
      slug: (editing.slug || slugify(editing.name)).trim(),
      order: Number(editing.order) || people.length + 1,
      career: (editing.career ?? []).filter((row) => row.org || row.role || row.period),
    };
    if (editing.id) await mutate("update", "management", item, editing.id);
    else await mutate("create", "management", item);
    setEditing(null);
  }

  return (
    <>
      <p className={css.kicker}>CMS · КФБ</p>
      <h1>Руководство</h1>
      <p className={css.lead}>
        Совет директоров и исполнительный орган на странице «О бирже / Руководство». ФИО и должность обязательны на
        русском, кыргызском и английском. Биография, образование и трудовая деятельность переводятся по желанию.
      </p>
      <div className={css.toolbar}>
        <button
          className={css.primary}
          type="button"
          onClick={() => setEditing({ ...empty, order: people.length + 1, status: "published" })}
        >
          + Добавить руководителя
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
            <LocaleTabs lang={lang} onChange={setLang} i18n={editing.i18n} fields={strictFields} item={editing} />
            <label className={css.field}>
              <span>ФИО</span>
              <input value={readLocaleField(editing, lang, "name")} onChange={(event) => setField("name", event.target.value)} required />
            </label>
            <label className={css.field}>
              <span>Должность</span>
              <input value={readLocaleField(editing, lang, "role")} onChange={(event) => setField("role", event.target.value)} required />
            </label>
            <label className={css.field}>
              <span>Орган управления</span>
              <select
                value={editing.group ?? "board"}
                onChange={(event) => setEditing({ ...editing, group: event.target.value as ManagementGroupId })}
              >
                {managementGroupIds.map((id) => (
                  <option key={id} value={id}>
                    {managementGroupTitles[id]}
                  </option>
                ))}
              </select>
            </label>
            <label className={css.field}>
              <span>Порядок</span>
              <input
                type="number"
                min={1}
                value={editing.order ?? 1}
                onChange={(event) => setEditing({ ...editing, order: Number(event.target.value) })}
              />
            </label>
            <label className={css.field}>
              <span>Статус</span>
              <select
                value={editing.status ?? "draft"}
                onChange={(event) => setEditing({ ...editing, status: event.target.value as PublishStatus })}
              >
                <option value="published">published</option>
                <option value="draft">draft</option>
              </select>
            </label>
            <label className={css.field}>
              <span>Slug</span>
              <input
                value={editing.slug ?? ""}
                placeholder={editing.name ? slugify(editing.name) : "familiya"}
                onChange={(event) => setEditing({ ...editing, slug: event.target.value })}
              />
            </label>
            <label className={css.field}>
              <span>Фото</span>
              <select value={editing.photo ?? ""} onChange={(event) => setEditing({ ...editing, photo: event.target.value })}>
                <option value="">Без фото</option>
                {editing.photo && !(store?.media ?? []).some((item) => item.url === editing.photo) ? (
                  <option value={editing.photo}>{editing.photo}</option>
                ) : null}
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
            {editing.photo ? (
              <div className={css.field}>
                <span>Превью</span>
                <img className={css.thumb} src={editing.photo} alt="" />
              </div>
            ) : null}
            <label className={`${css.field} ${css.wide}`}>
              <span>Биография — по одному абзацу на строку</span>
              <textarea
                rows={6}
                value={readLocaleField(editing, lang, "bio")}
                onChange={(event) => setField("bio", event.target.value)}
              />
            </label>
            <label className={`${css.field} ${css.wide}`}>
              <span>Образование — по одному пункту на строку</span>
              <textarea
                rows={5}
                value={readLocaleField(editing, lang, "education")}
                onChange={(event) => setField("education", event.target.value)}
              />
            </label>
          </div>
          <div className={css.fields}>
            <div className={`${css.field} ${css.wide}`}>
              <span>Трудовая деятельность</span>
              {(editing.career ?? []).map((row, index) => (
                <div key={index} className={css.careerRow}>
                  <input
                    placeholder="Организация"
                    value={row.org}
                    onChange={(event) => setCareerCell(index, "org", event.target.value)}
                  />
                  <input
                    placeholder="Должность"
                    value={row.role}
                    onChange={(event) => setCareerCell(index, "role", event.target.value)}
                  />
                  <input
                    placeholder="Период"
                    value={row.period}
                    onChange={(event) => setCareerCell(index, "period", event.target.value)}
                  />
                  <button
                    className={css.danger}
                    type="button"
                    onClick={() => setCareer((editing.career ?? []).filter((_, i) => i !== index))}
                  >
                    Удалить
                  </button>
                </div>
              ))}
              <button
                className={css.ghost}
                type="button"
                onClick={() => setCareer([...(editing.career ?? []), { org: "", role: "", period: "" }])}
              >
                + Строка
              </button>
            </div>
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
              <th>#</th>
              <th>Фото</th>
              <th>Руководитель</th>
              <th>Орган</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {people.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className={css.status} data-on={item.status}>
                    {item.status}
                  </span>
                </td>
                <td>{item.order}</td>
                <td>{item.photo ? <img className={css.thumb} src={item.photo} alt="" /> : "—"}</td>
                <td className={css.wrap}>
                  <b>
                    {item.name}
                    <LocaleDots i18n={item.i18n} fields={strictFields} item={item} />
                  </b>
                  <div>{item.role}</div>
                </td>
                <td>{managementGroupTitles[item.group]}</td>
                <td>
                  <div className={css.rowActions}>
                    <button className={css.ghost} type="button" onClick={() => setEditing(item)}>
                      Изменить
                    </button>
                    <button
                      className={css.danger}
                      type="button"
                      onClick={() => void mutate("delete", "management", undefined, item.id)}
                    >
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
