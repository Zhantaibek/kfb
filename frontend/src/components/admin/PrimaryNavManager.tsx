"use client";

import { useState } from "react";
import { LocaleDots, LocaleTabs } from "@/components/admin/LocaleTabs";
import {
  incompleteTranslation,
  readLocaleField,
  writeLocaleField,
  type ContentLang,
} from "@/lib/cms/locale";
import type { CmsMenuItem } from "@/lib/cms/types";
import css from "@/app/admin/admin.module.css";

const fields = ["label"];

type Props = {
  /** Пункты одной группы меню (по умолчанию «primary» — строка навигации в шапке сайта). */
  items: CmsMenuItem[];
  group?: string;
  /** Для вложенного списка (ссылки колонки футера) — id родительского пункта. */
  parentId?: string | null;
  title?: string;
  note?: string;
  addLabel?: string;
  emptyText?: string;
  /** false — у пункта только название (заголовок колонки), ссылку не спрашиваем. */
  withHref?: boolean;
  removeText?: (item: CmsMenuItem) => string;
  busy: boolean;
  mutate: (
    op: "create" | "update" | "delete",
    collection: string,
    item?: object,
    id?: string,
  ) => Promise<void>;
  setError: (message: string | null) => void;
};

/** Плоский список пунктов одной группы меню: строка шапки, колонки и кнопки футера. */
export function PrimaryNavManager({
  items,
  busy,
  mutate,
  setError,
  group = "primary",
  parentId = null,
  title = "Строка навигации шапки",
  note = "Ссылки рядом с логотипом, как в шапке kse.kg. Полное меню по группам — ниже, оно открывается кнопкой-бургером.",
  addLabel = "+ ссылка",
  emptyText = "Ссылок нет — на сайте показывается стандартный набор, как на kse.kg.",
  withHref = true,
  removeText = (item) =>
    `Убрать «${item.label}» из шапки? Сама страница останется.`,
}: Props) {
  const [editing, setEditing] = useState<Partial<CmsMenuItem> | null>(null);
  const [lang, setLang] = useState<ContentLang>("ru");
  const sorted = [...items].sort((a, b) => a.order - b.order);

  function open(item: Partial<CmsMenuItem>) {
    setLang("ru");
    setEditing(item);
  }

  async function save() {
    if (!editing?.label || (withHref && !editing.href)) return;
    const gap = incompleteTranslation(editing, fields);
    if (gap) {
      setError(gap.message);
      setLang(gap.lang);
      return;
    }
    const item = {
      label: editing.label,
      href: editing.href?.trim() || "/",
      group,
      order: Number(editing.order) || sorted.length + 1,
      parentId,
      i18n: editing.i18n ?? {},
    };
    if (editing.id) await mutate("update", "menu", item, editing.id);
    else await mutate("create", "menu", item);
    setEditing(null);
  }

  async function move(item: CmsMenuItem, dir: -1 | 1) {
    const index = sorted.findIndex((row) => row.id === item.id);
    const other = sorted[index + dir];
    if (!other) return;
    await mutate("update", "menu", { order: other.order }, item.id);
    await mutate("update", "menu", { order: item.order }, other.id);
  }

  async function remove(item: CmsMenuItem) {
    if (!window.confirm(removeText(item))) return;
    await mutate("delete", "menu", undefined, item.id);
  }

  return (
    <section className={css.form} style={{ marginBottom: 22 }}>
      <div className={css.toolbar} style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
          <p className={css.note}>{note}</p>
        </div>
        <button
          className={css.primary}
          type="button"
          onClick={() =>
            open({ label: "", href: "", order: sorted.length + 1, i18n: {} })
          }
        >
          {addLabel}
        </button>
      </div>

      {editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <div className={css.fields}>
            <LocaleTabs
              lang={lang}
              onChange={setLang}
              i18n={editing.i18n}
              fields={fields}
              item={editing}
            />
            <label className={css.field}>
              <span>Название</span>
              <input
                value={readLocaleField(editing, lang, "label")}
                onChange={(event) =>
                  setEditing(
                    writeLocaleField(
                      editing,
                      lang,
                      "label",
                      event.target.value,
                    ),
                  )
                }
                required
              />
            </label>
            {withHref ? (
              <label className={css.field}>
                <span>Ссылка</span>
                <input
                  value={editing.href ?? ""}
                  placeholder="/listing или https://…"
                  onChange={(event) =>
                    setEditing({ ...editing, href: event.target.value })
                  }
                  required
                />
              </label>
            ) : null}
          </div>
          <div className={css.rowActions}>
            <button className={css.primary} disabled={busy} type="submit">
              Сохранить
            </button>
            <button
              className={css.ghost}
              type="button"
              onClick={() => setEditing(null)}
            >
              Отмена
            </button>
          </div>
        </form>
      ) : null}

      <div className={css.table}>
        <table>
          <tbody>
            {sorted.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td className={css.wrap}>
                  <b>
                    {item.label}
                    <LocaleDots i18n={item.i18n} fields={fields} item={item} />
                  </b>
                  {withHref ? (
                    <div className={css.note}>{item.href}</div>
                  ) : null}
                </td>
                <td>
                  <div className={css.rowActions}>
                    <button
                      className={css.ghost}
                      type="button"
                      disabled={busy || index === 0}
                      onClick={() => void move(item, -1)}
                    >
                      ↑
                    </button>
                    <button
                      className={css.ghost}
                      type="button"
                      disabled={busy || index === sorted.length - 1}
                      onClick={() => void move(item, 1)}
                    >
                      ↓
                    </button>
                    <button
                      className={css.ghost}
                      type="button"
                      onClick={() => open(item)}
                    >
                      Изменить
                    </button>
                    <button
                      className={css.danger}
                      type="button"
                      disabled={busy}
                      onClick={() => void remove(item)}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!sorted.length ? (
              <tr>
                <td colSpan={3}>{emptyText}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
