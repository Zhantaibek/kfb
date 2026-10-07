"use client";

/* eslint-disable @next/next/no-img-element -- превью картинок из медиатеки */
import { useState } from "react";
import type { useAdminStore } from "@/lib/cms/client";
import { useContentLang } from "@/lib/cms/use-content-lang";
import { incompleteTranslation, readLocaleField, writeLocaleField } from "@/lib/cms/locale";
import type { CmsI18n } from "@/lib/cms/types";
import { LocaleDots, LocaleTabs } from "@/components/admin/LocaleTabs";
import css from "@/app/admin/admin.module.css";

type Store = ReturnType<typeof useAdminStore>;

export type FieldSpec = {
  name: string;
  label: string;
  /** text — строка; lines — по одному значению в строке; textarea — абзацы; file — PDF с ПК; image — картинка с ПК. */
  kind?: "text" | "textarea" | "lines" | "select" | "file" | "image";
  /** Поле переводится (вкладки RU / KY / EN). */
  i18n?: boolean;
  wide?: boolean;
  required?: boolean;
  placeholder?: string;
  options?: [string, string][];
  rows?: number;
};

type Item = { id: string; order: number; status?: string; i18n?: CmsI18n } & Record<string, unknown>;

type Props = {
  admin: Pick<Store, "busy" | "mutate" | "upload" | "setError">;
  collection: string;
  title: string;
  note?: string;
  items: Item[];
  fields: FieldSpec[];
  /** Имена собственные: перевод можно оставить как есть. */
  properNames?: string[];
  /** Новая запись; нет — записи только редактируются (тексты блоков). */
  blank?: Record<string, unknown>;
  addLabel?: string;
  /** Строка таблицы: заголовок и подпись. */
  row: (item: Item) => { title: string; meta?: string; href?: string };
  removeText?: (item: Item) => string;
};

/** Список записей коллекции CMS: форма с переводами, порядок стрелками, статус, удаление (без blank — только правка). */
export function CollectionManager({ admin, collection, title, note, items, fields, properNames = [], blank, addLabel, row, removeText }: Props) {
  const { busy, mutate, upload, setError } = admin;
  const [editing, setEditing] = useState<Partial<Item> | null>(null);
  const [lang, setLang] = useContentLang(editing?.id);
  const list = [...items].sort((a, b) => a.order - b.order);
  const i18nFields = fields.filter((field) => field.i18n).map((field) => field.name);
  const withStatus = blank ? "status" in blank : list.some((item) => "status" in item);

  const value = (field: FieldSpec) =>
    field.i18n ? readLocaleField(editing, lang, field.name) : String((editing as Record<string, unknown> | null)?.[field.name] ?? "");

  function set(field: FieldSpec, next: string) {
    if (!editing) return;
    setEditing(field.i18n ? writeLocaleField(editing, lang, field.name, next) : { ...editing, [field.name]: next });
  }

  async function save() {
    if (!editing) return;
    const missing = fields.find((field) => field.required && !String((editing as Record<string, unknown>)[field.name] ?? "").trim());
    if (missing) {
      setError(`Заполните поле «${missing.label}» (на русском).`);
      setLang("ru");
      return;
    }
    const gap = incompleteTranslation(editing, i18nFields, properNames);
    if (gap) {
      setError(gap.message);
      setLang(gap.lang);
      return;
    }
    const item = { ...blank, ...editing, order: Number(editing.order) || list.length + 1 };
    if (editing.id) await mutate("update", collection, item, editing.id);
    else await mutate("create", collection, item);
    setEditing(null);
  }

  async function move(item: Item, dir: -1 | 1) {
    const index = list.findIndex((other) => other.id === item.id);
    const other = list[index + dir];
    if (!other) return;
    await mutate("update", collection, { ...item, order: other.order }, item.id);
    await mutate("update", collection, { ...other, order: item.order }, other.id);
  }

  async function remove(item: Item) {
    if (!window.confirm(removeText?.(item) ?? `Удалить «${row(item).title}»?`)) return;
    await mutate("delete", collection, undefined, item.id);
  }

  async function uploadInto(field: FieldSpec, file: File) {
    const media = await upload(file);
    setEditing((current) => ({ ...current, [field.name]: media.url }));
  }

  function input(field: FieldSpec) {
    const current = value(field);
    if (field.kind === "select") {
      return (
        <select value={current} onChange={(event) => set(field, event.target.value)}>
          {field.options?.map(([option, label]) => (
            <option key={option} value={option}>
              {label}
            </option>
          ))}
        </select>
      );
    }
    if (field.kind === "textarea" || field.kind === "lines") {
      return (
        <textarea
          rows={field.rows ?? (field.kind === "lines" ? 4 : 5)}
          style={{ fontFamily: "inherit" }}
          value={current}
          placeholder={field.placeholder}
          onChange={(event) => set(field, event.target.value)}
        />
      );
    }
    if (field.kind === "file" || field.kind === "image") {
      const image = field.kind === "image";
      return (
        <div className={css.docRow} style={{ gridTemplateColumns: "auto 1fr auto auto" }}>
          {current ? (
            image ? (
              <img className={css.thumb} src={current} alt="" style={{ objectFit: "cover" }} />
            ) : (
              <a className={css.docFile} href={current} target="_blank" rel="noreferrer">
                Открыть файл
              </a>
            )
          ) : (
            <span className={css.docFile}>{image ? "Нет картинки" : "Файл не загружен"}</span>
          )}
          <input value={current} placeholder={image ? "/landing/… или загрузите" : "https://… или загрузите PDF"} onChange={(event) => set(field, event.target.value)} />
          <label className={css.ghost} style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
            {busy ? "Загрузка…" : "Загрузить с ПК"}
            <input
              type="file"
              accept={image ? "image/jpeg,image/png,image/webp,image/gif" : ".pdf,.doc,.docx,.xls,.xlsx,.zip"}
              hidden
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void uploadInto(field, file).catch(() => undefined);
              }}
            />
          </label>
          {current ? (
            <button className={css.danger} type="button" onClick={() => set(field, "")}>
              Убрать
            </button>
          ) : null}
        </div>
      );
    }
    return <input value={current} placeholder={field.placeholder} onChange={(event) => set(field, event.target.value)} />;
  }

  return (
    <section style={{ marginBottom: 34 }}>
      <div className={css.toolbar} style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>{title}</h2>
          {note ? <p className={css.note}>{note}</p> : null}
        </div>
        {blank ? (
          <button className={css.primary} type="button" onClick={() => setEditing({ ...blank, order: list.length + 1 } as Partial<Item>)}>
            {addLabel ?? "+ Добавить"}
          </button>
        ) : null}
      </div>

      {editing ? (
        <form
          className={css.form}
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <div className={css.fields}>
            {i18nFields.length ? <LocaleTabs lang={lang} onChange={setLang} i18n={editing.i18n} fields={i18nFields} item={editing} /> : null}
            {fields.map((field) => {
              const wide = field.wide || field.kind === "textarea" || field.kind === "lines" || field.kind === "file" || field.kind === "image";
              const Tag = field.kind === "file" || field.kind === "image" ? "div" : "label";
              return (
                <Tag key={field.name} className={`${css.field} ${wide ? css.wide : ""}`}>
                  <span>
                    {field.label}
                    {field.i18n ? "" : field.kind === "select" || field.kind === "file" || field.kind === "image" ? "" : " (общее для всех языков)"}
                  </span>
                  {input(field)}
                </Tag>
              );
            })}
            {withStatus ? (
              <label className={css.field}>
                <span>Статус</span>
                <select value={String(editing.status ?? "published")} onChange={(event) => setEditing({ ...editing, status: event.target.value })}>
                  <option value="published">Опубликован</option>
                  <option value="draft">Черновик (скрыт на сайте)</option>
                </select>
              </label>
            ) : null}
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
          <tbody>
            {list.map((item, index) => {
              const view = row(item);
              return (
                <tr key={item.id}>
                  <td style={{ width: 36 }}>{index + 1}</td>
                  <td className={css.wrap}>
                    <b>
                      {view.title || "—"}
                      {i18nFields.length ? <LocaleDots i18n={item.i18n} fields={i18nFields} item={item} /> : null}
                    </b>
                    {view.meta ? <div className={css.note}>{view.meta}</div> : null}
                  </td>
                  {withStatus ? <td>{item.status === "draft" ? "Черновик" : "Опубликован"}</td> : null}
                  <td>
                    <div className={css.rowActions}>
                      {blank ? (
                        <>
                          <button className={css.ghost} type="button" disabled={busy || index === 0} onClick={() => void move(item, -1)}>
                            ↑
                          </button>
                          <button className={css.ghost} type="button" disabled={busy || index === list.length - 1} onClick={() => void move(item, 1)}>
                            ↓
                          </button>
                        </>
                      ) : null}
                      {view.href ? (
                        <a className={css.ghost} href={view.href} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center" }}>
                          Открыть
                        </a>
                      ) : null}
                      <button className={css.ghost} type="button" onClick={() => setEditing(item)}>
                        Изменить
                      </button>
                      {blank ? (
                        <button className={css.danger} type="button" disabled={busy} onClick={() => void remove(item)}>
                          Удалить
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
            {list.length ? null : (
              <tr>
                <td className={css.note}>Записей пока нет.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
