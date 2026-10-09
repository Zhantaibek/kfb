"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { PrimaryNavManager } from "@/components/admin/PrimaryNavManager";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { useAdminStore } from "@/lib/cms/client";
import { useContentLang } from "@/lib/cms/use-content-lang";
import { incompleteTranslation, readLocaleField, writeLocaleField } from "@/lib/cms/locale";
import { resolveMenuHref, suggestedMenuHref } from "@/lib/cms/menu-href";
import type { CmsI18n, CmsMenuItem, CmsPage, PublishStatus } from "@/lib/cms/types";
import { hubPageForSection } from "@/lib/cms/hub-pages";
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

type PageDraft = {
  id?: string;
  lead: string;
  body: string;
  status: PublishStatus;
  i18n?: CmsI18n;
};

const emptyPage: PageDraft = { lead: "", body: "", status: "published", i18n: {} };

function isContentHref(href: string) {
  const value = href.trim();
  return value.startsWith("/") && value !== "/" && !/^\/\//.test(value);
}

function draftFromPage(page: CmsPage | undefined): PageDraft {
  if (!page) return { ...emptyPage };
  return { id: page.id, lead: page.lead, body: page.body, status: page.status, i18n: page.i18n ?? {} };
}

function childrenOf(menu: CmsMenuItem[], parentId: string | null) {
  return menu
    .filter((item) => (item.parentId ?? null) === parentId)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, "ru"));
}

export function MenuManager() {
  const { store, error, busy, mutate, upload, setError } = useAdminStore();
  const [editing, setEditing] = useState<Partial<CmsMenuItem> | null>(null);
  const [pageDraft, setPageDraft] = useState<PageDraft | null>(null);
  const [hrefTouched, setHrefTouched] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  // Дерево бургер-меню — группа «header»; строка навигации шапки («primary») правится отдельным блоком.
  const allMenu = useMemo(() => store?.menu ?? [], [store?.menu]);
  const menu = useMemo(() => allMenu.filter((item) => (item.group || "header") === "header"), [allMenu]);
  const primaryItems = useMemo(() => allMenu.filter((item) => item.group === "primary"), [allMenu]);
  const pages = store?.pages ?? [];
  const sections = useMemo(() => childrenOf(menu, null), [menu]);
  const active = sections.find((item) => item.id === openId) ?? sections[0] ?? null;
  const dropdown = active ? childrenOf(menu, active.id) : [];
  const contentHref = isContentHref(editing?.href ?? "");

  // Открыли другой пункт или страницу — вкладка языка снова «RU».
  const [lang, setLang] = useContentLang(editing?.id ?? "");

  // Переход с кнопки «Редактировать» на сайте: /admin/menu?edit=/about/strategy.
  // Админка рендерится только в браузере (AdminShell ждёт сессию), поэтому window здесь доступен.
  // Обрабатываем во время рендера, как только пришли данные, — без эффекта.
  const [deepLink, setDeepLink] = useState(() => new URLSearchParams(window.location.search).get("edit"));
  if (store && deepLink) {
    setDeepLink(null);
    const item = menu.find((row) => row.href === deepLink);
    if (item) startEdit(item);
  }

  function attachPage(href: string, keepId: boolean) {
    const match = pages.find((page) => page.path === href);
    if (match) {
      setPageDraft(draftFromPage(match));
      return;
    }
    setPageDraft((current) => (keepId && current?.id ? { ...current, id: current.id } : { ...(current ?? emptyPage), id: undefined }));
  }

  function startCreate(parentId: string | null) {
    const siblings = childrenOf(menu, parentId);
    setHrefTouched(false);
    setPageDraft({ ...emptyPage });
    setEditing({ ...empty, parentId, order: siblings.length + 1, href: "" });
    const parent = parentId ? menu.find((item) => item.id === parentId) : undefined;
    if (parent && !parent.parentId) setOpenId(parent.id);
    if (parent?.parentId) setOpenId(parent.parentId);
  }

  function startEdit(item: CmsMenuItem) {
    const broken = !item.href.trim() || item.href.trim() === "/";
    const href = broken ? suggestedMenuHref(menu, item.parentId, item.label) : item.href;
    setHrefTouched(!broken);
    setPageDraft(draftFromPage(pages.find((page) => page.path === item.href) ?? pages.find((page) => page.path === href)));
    setEditing(broken ? { ...item, href } : item);
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

  function setPageField(field: "lead" | "body", value: string) {
    setPageDraft((current) => (current ? writeLocaleField(current, lang, field, value) : current));
  }

  async function savePage(href: string, label: string, menuI18n: CmsI18n | undefined, draft: PageDraft) {
    if (!isContentHref(href)) return;
    const target = pages.find((page) => page.path === href) ?? (draft.id ? pages.find((page) => page.id === draft.id) : undefined);
    const i18n: CmsI18n = { ...(draft.i18n ?? target?.i18n ?? {}) };
    for (const code of ["ky", "en"] as const) {
      const title = menuI18n?.[code]?.label?.trim();
      if (!title) continue;
      i18n[code] = { ...(i18n[code] ?? {}), title };
    }
    const item = {
      path: href,
      title: label,
      lead: draft.lead.trim() ? draft.lead : (target?.lead ?? ""),
      body: draft.body.trim() ? draft.body : (target?.body ?? "<p></p>"),
      status: draft.status,
      i18n,
    };
    if (target) await mutate("update", "pages", { ...target, ...item }, target.id);
    else await mutate("create", "pages", item);
  }

  async function save() {
    if (!editing?.label) return;
    const href = resolveMenuHref(menu, editing.parentId ?? null, editing.label, editing.href ?? "");
    if (!href) return;
    const draft = pageDraft ?? emptyPage;
    const translated = {
      label: editing.label ?? "",
      lead: draft.lead,
      body: draft.body,
      i18n: {
        ky: { ...(draft.i18n?.ky ?? {}), label: editing.i18n?.ky?.label ?? "" },
        en: { ...(draft.i18n?.en ?? {}), label: editing.i18n?.en?.label ?? "" },
      },
    };
    const gap = incompleteTranslation(translated, isContentHref(href) ? ["label", "lead", "body"] : menuFields);
    if (gap) {
      setError(gap.message);
      setLang(gap.lang);
      return;
    }
    const item = {
      ...empty,
      ...editing,
      href,
      group: "header",
      order: Number(editing.order) || 1,
      parentId: editing.parentId || null,
    };
    if (editing.id) await mutate("update", "menu", item, editing.id);
    else await mutate("create", "menu", item);
    await savePage(href, editing.label, editing.i18n, draft);
    if (!item.parentId && editing.id) setOpenId(editing.id);
    setEditing(null);
    setPageDraft(null);
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
      <h1>Меню и страницы</h1>
      <p className={css.lead}>
        Пункт шапки и текст страницы правятся здесь. Название обязательно на русском, кыргызском и английском. Если ссылка внутренняя, ниже тот же текст, который видит посетитель.
      </p>
      {error ? <p className={css.error}>{error}</p> : null}

      <PrimaryNavManager items={primaryItems} busy={busy} mutate={mutate} setError={setError} />

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
              <LocaleTabs
                lang={lang}
                onChange={setLang}
                fields={contentHref ? ["label", "lead", "body"] : menuFields}
                i18n={
                  contentHref && pageDraft
                    ? {
                        ky: { ...(pageDraft.i18n?.ky ?? {}), label: editing.i18n?.ky?.label ?? "" },
                        en: { ...(pageDraft.i18n?.en ?? {}), label: editing.i18n?.en?.label ?? "" },
                      }
                    : editing.i18n
                }
                item={contentHref && pageDraft ? { label: editing.label ?? "", lead: pageDraft.lead, body: pageDraft.body } : editing}
              />
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
                    const href = event.target.value;
                    setHrefTouched(true);
                    setEditing({ ...editing, href });
                    attachPage(href, true);
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
              {contentHref && pageDraft ? (
                <>
                  <label className={`${css.field} ${css.wide}`}>
                    <span>Лид</span>
                    <input value={readLocaleField(pageDraft, lang, "lead")} onChange={(event) => setPageField("lead", event.target.value)} />
                  </label>
                  <div className={css.wide}>
                    <RichTextEditor
                      label="Текст страницы"
                      hint="Этот текст открывается по ссылке пункта. Фото вставляется кнопкой ниже."
                      value={readLocaleField(pageDraft, lang, "body")}
                      onChange={(body) => setPageField("body", body)}
                      media={store?.media}
                      onUpload={async (file) => (await upload(file)).url}
                    />
                  </div>
                  <label className={css.field}>
                    <span>Статус страницы</span>
                    <select
                      value={pageDraft.status}
                      onChange={(event) => setPageDraft({ ...pageDraft, status: event.target.value as PublishStatus })}
                    >
                      <option value="published">published</option>
                      <option value="draft">draft</option>
                    </select>
                  </label>
                </>
              ) : null}
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
              <button className={css.ghost} type="button" onClick={() => { setEditing(null); setPageDraft(null); }}>
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
                {hubPageForSection(active) ? (
                  <p className={css.menuHubNote}>
                    Эти пункты также показываются плитками на странице «{hubPageForSection(active)?.title}». Добавили пункт — появилась
                    плитка, убрали — исчезла.{" "}
                    <a href={hubPageForSection(active)?.page} target="_blank" rel="noreferrer">
                      Открыть страницу →
                    </a>
                  </p>
                ) : null}
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
