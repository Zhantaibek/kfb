"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { useAdminStore } from "@/lib/cms/client";
import { incompleteTranslation, readLocaleField, writeLocaleField, type ContentLang } from "@/lib/cms/locale";
import { resolveMenuHref, suggestedMenuHref } from "@/lib/cms/menu-href";
import type { CmsMenuItem } from "@/lib/cms/types";
import css from "@/app/admin/admin.module.css";

const empty: Omit<CmsMenuItem, "id"> = {
  label: "",
  href: "",
  group: "header",
  order: 1,
  parentId: null,
  i18n: {},
};
const menuFields = ["label"];

function childrenOf(menu: CmsMenuItem[], parentId: string | null) {
  return menu
    .filter((item) => (item.parentId ?? null) === parentId)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, "ru"));
}

export function MenuManager() {
  const { store, error, busy, mutate, setError } = useAdminStore();
  const [editing, setEditing] = useState<Partial<CmsMenuItem> | null>(null);
  const [hrefTouched, setHrefTouched] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [lang, setLang] = useState<ContentLang>("ru");
  const menu = store?.menu ?? [];
  const pages = store?.pages ?? [];
  const sections = useMemo(() => childrenOf(menu, null), [menu]);
  const active = sections.find((item) => item.id === openId) ?? sections[0] ?? null;
  const dropdown = active ? childrenOf(menu, active.id) : [];

  useEffect(() => {
    setLang("ru");
  }, [editing?.id]);

  function startCreate(parentId: string | null) {
    const siblings = childrenOf(menu, parentId);
    setHrefTouched(false);
    setEditing({ ...empty, parentId, order: siblings.length + 1, href: "" });
    const parent = parentId ? menu.find((item) => item.id === parentId) : undefined;
    if (parent && !parent.parentId) setOpenId(parent.id);
    if (parent?.parentId) setOpenId(parent.parentId);
  }

  function startEdit(item: CmsMenuItem) {
    const broken = !item.href.trim() || item.href.trim() === "/";
    setHrefTouched(!broken);
    setEditing(broken ? { ...item, href: suggestedMenuHref(menu, item.parentId, item.label) } : item);
    if (!item.parentId) {
      setOpenId(item.id);
      return;
    }
    const parent = menu.find((row) => row.id === item.parentId);
    setOpenId(parent?.parentId ?? parent?.id ?? item.id);
  }

  function setLabel(label: string) {
    if (!editing) return;
    if (lang !== "ru") {
      setEditing(writeLocaleField(editing, lang, "label", label));
      return;
    }
    setEditing({
      ...editing,
      label,
      href: hrefTouched ? editing.href : suggestedMenuHref(menu, editing.parentId ?? null, label),
    });
  }

  function setParent(parentId: string | null) {
    if (!editing) return;
    setEditing({
      ...editing,
      parentId,
      href: hrefTouched ? editing.href : suggestedMenuHref(menu, parentId, editing.label ?? ""),
    });
  }

  async function save() {
    if (!editing?.label) return;
    const gap = incompleteTranslation(editing, menuFields);
    if (gap) {
      setError(gap.message);
      setLang(gap.lang);
      return;
    }
    const href = resolveMenuHref(menu, editing.parentId ?? null, editing.label, editing.href ?? "");
    if (!href) return;
    const item = {
      ...empty,
      ...editing,
      href,
      group: "header",
      order: Number(editing.order) || 1,
      parentId: editing.parentId || null,
    };
    const hrefTaken = menu.some((row) => row.href === href && row.id !== editing.id);
    const pageExists = pages.some((page) => page.path === href);
    const previous = editing.id ? menu.find((row) => row.id === editing.id) : undefined;
    const needsPage = !previous || !previous.href.trim() || previous.href.trim() === "/";
    if (needsPage && href.startsWith("/") && !/^https?:\/\//i.test(href) && !hrefTaken && !pageExists) {
      const kyTitle = readLocaleField(editing, "ky", "label");
      const enTitle = readLocaleField(editing, "en", "label");
      await mutate("create", "pages", {
        path: href,
        title: editing.label,
        lead: "",
        body: "<p>Страница создана из меню. Откройте «Страницы» в админке, чтобы добавить текст.</p>",
        status: "published",
        i18n: {
          ky: {
            title: kyTitle,
            body: "<p>Барак менюдан түзүлдү. Текстти «Барактар» бөлүмүнөн кошуңуз.</p>",
          },
          en: {
            title: enTitle,
            body: "<p>This page was created from the menu. Open Pages in admin to add the text.</p>",
          },
        },
      });
    }
    if (editing.id) await mutate("update", "menu", item, editing.id);
    else await mutate("create", "menu", item);
    if (!item.parentId && editing.id) setOpenId(editing.id);
    setEditing(null);
  }

  async function remove(item: CmsMenuItem) {
    const nested = menu.some((child) => child.parentId === item.id);
    if (!window.confirm(nested ? `Удалить «${item.label}» и все пункты внутри?` : `Удалить «${item.label}»?`)) return;
    await mutate("delete", "menu", undefined, item.id);
    setEditing((current) => (current?.id === item.id ? null : current));
    if (openId === item.id) setOpenId(null);
  }

  async function move(item: CmsMenuItem, dir: -1 | 1) {
    const siblings = childrenOf(menu, item.parentId ?? null);
    const index = siblings.findIndex((row) => row.id === item.id);
    const swap = siblings[index + dir];
    if (!swap) return;
    await mutate("update", "menu", { ...item, order: index + dir + 1 }, item.id);
    await mutate("update", "menu", { ...swap, order: index + 1 }, swap.id);
  }

  return (
    <>
      <p className={css.kicker}>CMS · КФБ</p>
      <h1>Меню сайта</h1>
      <p className={css.lead}>
        Это та же шапка, что у посетителя. Название каждого пункта обязательно на русском, кыргызском и английском.
      </p>
      {error ? <p className={css.error}>{error}</p> : null}

      <div className={css.menuCanvas}>
        <div className={css.menuBar}>
          <div className={css.menuBarBrand}>
            <Logo className={css.menuBarLogo} />
            <span>КФБ</span>
          </div>
          <nav className={css.menuBarNav} aria-label="Пункты шапки">
            {sections.map((item) => (
              <button
                key={item.id}
                className={css.menuTab}
                data-on={active?.id === item.id ? "true" : undefined}
                type="button"
                onClick={() => setOpenId(item.id)}
              >
                {item.label}
              </button>
            ))}
            <button className={css.menuBarAdd} type="button" onClick={() => startCreate(null)}>
              + пункт шапки
            </button>
          </nav>
        </div>

        {editing ? (
          <form
            className={`${css.form} ${css.menuForm}`}
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <p className={css.menuFormHint}>{formHint(menu, editing)}</p>
            <div className={css.fields}>
              <LocaleTabs lang={lang} onChange={setLang} i18n={editing.i18n} fields={menuFields} item={editing} />
              <label className={css.field}>
                <span>Название</span>
                <input
                  value={readLocaleField(editing, lang, "label")}
                  onChange={(event) => setLabel(event.target.value)}
                  required
                />
              </label>
              <label className={css.field}>
                <span>Ссылка</span>
                <input
                  list="menu-paths"
                  value={editing.href ?? ""}
                  onChange={(event) => {
                    setHrefTouched(true);
                    setEditing({ ...editing, href: event.target.value });
                  }}
                  placeholder="появится из названия"
                />
                {editing.href?.startsWith("/") && editing.href !== "/" ? (
                  <a className={css.menuFormHint} href={editing.href} target="_blank" rel="noreferrer">
                    Открыть на сайте →
                  </a>
                ) : null}
              </label>
              <label className={`${css.field} ${css.wide}`}>
                <span>Где показать</span>
                <select
                  value={editing.parentId ?? ""}
                  onChange={(event) => setParent(event.target.value || null)}
                >
                  <option value="">В шапке, отдельным пунктом</option>
                  {sections
                    .filter((section) => section.id !== editing.id)
                    .map((section) => (
                      <optgroup key={section.id} label={`Список «${section.label}»`}>
                        <option value={section.id}>В списке «{section.label}»</option>
                        {childrenOf(menu, section.id)
                          .filter((child) => child.id !== editing.id)
                          .map((child) => (
                            <option key={child.id} value={child.id}>
                              В группе «{child.label}»
                            </option>
                          ))}
                      </optgroup>
                    ))}
                </select>
              </label>
            </div>
            <datalist id="menu-paths">
              {pages.map((page) => (
                <option key={page.id} value={page.path}>
                  {page.title}
                </option>
              ))}
            </datalist>
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

        {active ? (
          <div className={css.menuDrop}>
            <div className={css.menuDropHead}>
              <div>
                <small>Выпадающий список</small>
                <b>{active.label}</b>
                <code>{active.href}</code>
              </div>
              <div className={css.menuActions}>
                <button className={css.ghost} disabled={busy || sections[0]?.id === active.id} type="button" onClick={() => void move(active, -1)}>
                  ←
                </button>
                <button className={css.ghost} disabled={busy || sections[sections.length - 1]?.id === active.id} type="button" onClick={() => void move(active, 1)}>
                  →
                </button>
                <button className={css.ghost} type="button" onClick={() => startEdit(active)}>
                  Изменить
                </button>
                <button className={css.danger} disabled={busy} type="button" onClick={() => void remove(active)}>
                  Удалить
                </button>
              </div>
            </div>

            {dropdown.length ? (
              <div className={css.menuDropGrid}>
                {dropdown.map((item) => {
                  const nested = childrenOf(menu, item.id);
                  if (nested.length) {
                    return (
                      <section className={css.menuGroup} key={item.id} data-edit={editing?.id === item.id ? "true" : undefined}>
                        <div className={css.menuGroupTitle}>
                          <div>
                            <small>Группа в списке</small>
                            <b>{item.label}</b>
                          </div>
                          <ItemActions busy={busy} item={item} siblings={dropdown} onEdit={startEdit} onMove={move} onRemove={remove} />
                        </div>
                        <div className={css.menuGroupItems}>
                          {nested.map((child) => (
                            <MenuTile
                              key={child.id}
                              item={child}
                              siblings={nested}
                              busy={busy}
                              editingId={editing?.id}
                              onEdit={startEdit}
                              onMove={move}
                              onRemove={remove}
                            />
                          ))}
                          <button className={css.menuAddTile} type="button" onClick={() => startCreate(item.id)}>
                            + пункт в «{item.label}»
                          </button>
                        </div>
                      </section>
                    );
                  }
                  return (
                    <MenuTile
                      key={item.id}
                      item={item}
                      siblings={dropdown}
                      busy={busy}
                      editingId={editing?.id}
                      onEdit={startEdit}
                      onMove={move}
                      onRemove={remove}
                      extra={
                        <button className={css.ghost} type="button" onClick={() => startCreate(item.id)}>
                          + внутрь
                        </button>
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <p className={css.menuEmpty}>На сайте этот пункт без выпадающего списка — только ссылка в шапке.</p>
            )}

            <button className={css.menuAddRow} type="button" onClick={() => startCreate(active.id)}>
              + пункт в список «{active.label}»
            </button>
          </div>
        ) : (
          <p className={css.menuEmpty}>В шапке пока пусто. Добавьте первый пункт справа сверху.</p>
        )}
      </div>
    </>
  );
}

function formHint(menu: CmsMenuItem[], editing: Partial<CmsMenuItem>) {
  if (!editing.parentId) {
    return editing.id ? "Пункт верхней полоски сайта" : "Новый пункт верхней полоски сайта";
  }
  const parent = menu.find((item) => item.id === editing.parentId);
  if (!parent) return "Пункт меню";
  if (!parent.parentId) {
    return `Появится в выпадающем списке «${parent.label}»`;
  }
  const section = menu.find((item) => item.id === parent.parentId);
  return `Появится в группе «${parent.label}» списка «${section?.label ?? "шапка"}»`;
}

function ItemActions({
  item,
  siblings,
  busy,
  onEdit,
  onMove,
  onRemove,
}: {
  item: CmsMenuItem;
  siblings: CmsMenuItem[];
  busy: boolean;
  onEdit: (item: CmsMenuItem) => void;
  onMove: (item: CmsMenuItem, dir: -1 | 1) => Promise<void>;
  onRemove: (item: CmsMenuItem) => Promise<void>;
}) {
  const index = siblings.findIndex((row) => row.id === item.id);
  return (
    <div className={css.menuActions}>
      <button className={css.ghost} disabled={busy || index <= 0} type="button" onClick={() => void onMove(item, -1)}>
        ↑
      </button>
      <button className={css.ghost} disabled={busy || index === siblings.length - 1} type="button" onClick={() => void onMove(item, 1)}>
        ↓
      </button>
      <button className={css.ghost} type="button" onClick={() => onEdit(item)}>
        Изменить
      </button>
      <button className={css.danger} disabled={busy} type="button" onClick={() => void onRemove(item)}>
        Удалить
      </button>
    </div>
  );
}

function MenuTile({
  item,
  siblings,
  busy,
  editingId,
  extra,
  onEdit,
  onMove,
  onRemove,
}: {
  item: CmsMenuItem;
  siblings: CmsMenuItem[];
  busy: boolean;
  editingId?: string;
  extra?: ReactNode;
  onEdit: (item: CmsMenuItem) => void;
  onMove: (item: CmsMenuItem, dir: -1 | 1) => Promise<void>;
  onRemove: (item: CmsMenuItem) => Promise<void>;
}) {
  return (
    <article className={css.menuTile} data-edit={editingId === item.id ? "true" : undefined}>
      <b>{item.label}</b>
      <code>{item.href}</code>
      <div className={css.menuTileActions}>
        {extra}
        <ItemActions busy={busy} item={item} siblings={siblings} onEdit={onEdit} onMove={onMove} onRemove={onRemove} />
      </div>
    </article>
  );
}
