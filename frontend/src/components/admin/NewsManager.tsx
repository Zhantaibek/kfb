"use client";

import { useMemo, useState } from "react";
import { slugify } from "@/lib/cms/slug";
import { useAdminStore } from "@/lib/cms/client";
import { useContentLang } from "@/lib/cms/use-content-lang";
import { incompleteTranslation, isLocaleValueFilled, readLocaleField, writeLocaleField } from "@/lib/cms/locale";
import type { CmsIssuer, CmsNews, NewsKind, PublishStatus } from "@/lib/cms/types";
import { LocaleDots, LocaleTabs } from "@/components/admin/LocaleTabs";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import css from "@/app/admin/admin.module.css";

const empty: Omit<CmsNews, "id" | "createdAt" | "updatedAt"> = {
  slug: "",
  date: "",
  tag: "Биржа",
  kind: "exchange",
  status: "draft",
  title: "",
  excerpt: "",
  body: "",
  photo: "",
  issuerSlug: "",
  i18n: {},
};

const newsFields = ["title", "body"];

function today() {
  const date = new Date();
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

function IssuerSelect({
  value,
  issuers,
  onChange,
}: {
  value: string;
  issuers: CmsIssuer[];
  onChange: (slug: string) => void;
}) {
  const issuersByName = [...issuers].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  const current = value ? issuers.find((item) => item.slug === value) : undefined;

  return (
    <label className={`${css.field} ${css.wide}`}>
      <span>Компания</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} required>
        <option value="">Выберите компанию</option>
        {issuersByName.map((item) => (
          <option key={item.slug} value={item.slug}>
            {item.name}
          </option>
        ))}
      </select>
      {current ? <p className={css.picked}>Дальше напишите новость для «{current.name}».</p> : null}
    </label>
  );
}

function statusLabel(status: PublishStatus | undefined) {
  return status === "published" ? "Опубликована" : "Черновик";
}

function whereLabel(item: CmsNews, issuers: CmsIssuer[]) {
  if (item.kind === "company") return issuers.find((row) => row.slug === item.issuerSlug)?.name ?? "Компания не выбрана";
  if (item.kind === "urgent") return "Срочно, общая лента";
  return "Общая лента";
}

export function NewsManager() {
  const { store, error, busy, mutate, upload, setError } = useAdminStore();
  const [editing, setEditing] = useState<Partial<CmsNews> | null>(null);
  const [lang, setLang] = useContentLang(editing?.id);
  const [notice, setNotice] = useState<string | null>(null);

  const rows = useMemo(() => store?.news ?? [], [store]);

  function setField(field: string, value: string) {
    if (!editing) return;
    setEditing(writeLocaleField(editing, lang, field, value));
  }

  function setKind(kind: NewsKind) {
    if (!editing) return;
    const next: Partial<CmsNews> = { ...editing, kind };
    if (kind === "company") {
      if (!editing.tag || editing.tag === "Биржа") next.tag = "Эмитент";
    } else {
      next.issuerSlug = "";
      if (editing.tag === "Эмитент") next.tag = "Биржа";
    }
    setEditing(next);
  }

  function startCreate(kind: NewsKind) {
    setNotice(null);
    setError(null);
    setEditing({
      ...empty,
      date: today(),
      status: "published",
      kind,
      tag: kind === "company" ? "Эмитент" : "Биржа",
    });
  }

  async function save() {
    if (!editing) return;
    setNotice(null);
    if (!editing.title?.trim()) {
      setError("Укажите заголовок на вкладке RU.");
      setLang("ru");
      return;
    }
    if (editing.kind === "company" && !editing.issuerSlug) {
      setError("Выберите компанию, на чьей странице показывать новость.");
      return;
    }
    if (!isLocaleValueFilled(editing.body, "body")) {
      setError("Укажите текст новости на вкладке RU.");
      setLang("ru");
      return;
    }
    const gap = incompleteTranslation(editing, newsFields);
    if (gap) {
      setError(gap.message);
      setLang(gap.lang);
      return;
    }
    const creating = !editing.id;
    const item = {
      ...empty,
      ...editing,
      date: editing.date || today(),
      slug: editing.slug || slugify(editing.title),
      issuerSlug: editing.kind === "company" ? editing.issuerSlug ?? "" : "",
    };
    try {
      if (editing.id) await mutate("update", "news", item, editing.id);
      else await mutate("create", "news", item);
      setEditing(null);
      setNotice(creating ? "Новость добавлена." : "Новость сохранена.");
    } catch {
      // сообщение уже в error
    }
  }

  async function remove(item: CmsNews) {
    if (!window.confirm(`Удалить новость «${item.title}»?`)) return;
    try {
      await mutate("delete", "news", undefined, item.id);
      setEditing((current) => (current?.id === item.id ? null : current));
    } catch {
      // сообщение уже в error
    }
  }

  return (
    <>
      <p className={css.kicker}>CMS · КФБ</p>
      <h1>Новости</h1>
      <p className={css.lead}>
        Общая новость попадает в ленту биржи. Новость компании видна только на странице этой компании.
      </p>
      <div className={css.toolbar}>
        <button className={css.primary} type="button" onClick={() => startCreate("exchange")}>
          + Общая новость
        </button>
        <button className={css.ghost} type="button" onClick={() => startCreate("company")}>
          + Новость компании
        </button>
      </div>
      {error ? <p className={css.error} role="alert">{error}</p> : null}
      {notice ? <p className={css.notice} role="status">{notice}</p> : null}

      {editing ? (
        <form
          className={css.form}
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <div className={css.fields}>
            <div className={`${css.wide} ${css.audience}`}>
              <span>Куда попадёт новость</span>
              <div>
                <button type="button" data-on={editing.kind !== "company" ? "true" : undefined} onClick={() => setKind(editing.kind === "urgent" ? "urgent" : "exchange")}>
                  <b>В общую ленту</b>
                  <small>Главная и раздел «Новости»</small>
                </button>
                <button type="button" data-on={editing.kind === "company" ? "true" : undefined} onClick={() => setKind("company")}>
                  <b>На страницу компании</b>
                  <small>Только у выбранной компании</small>
                </button>
              </div>
            </div>
            {editing.kind === "company" ? (
              <IssuerSelect
                value={editing.issuerSlug ?? ""}
                issuers={store?.issuers ?? []}
                onChange={(issuerSlug) => setEditing({ ...editing, issuerSlug })}
              />
            ) : (
              <label className={`${css.field} ${css.wide}`}>
                <span>
                  <input
                    type="checkbox"
                    checked={editing.kind === "urgent"}
                    onChange={(event) => setKind(event.target.checked ? "urgent" : "exchange")}
                  />{" "}
                  Пометить как срочную
                </span>
              </label>
            )}
            <LocaleTabs lang={lang} onChange={setLang} i18n={editing.i18n} fields={newsFields} item={editing} />
            <label className={`${css.field} ${css.wide}`}>
              <span>Заголовок</span>
              <input
                value={readLocaleField(editing, lang, "title")}
                onChange={(event) => setField("title", event.target.value)}
                required={lang === "ru"}
              />
            </label>
            <label className={css.field}>
              <span>Дата</span>
              <input value={editing.date ?? ""} onChange={(event) => setEditing({ ...editing, date: event.target.value })} />
            </label>
            <label className={css.field}>
              <span>Рубрика</span>
              <input
                value={readLocaleField(editing, lang, "tag")}
                onChange={(event) => setField("tag", event.target.value)}
                required={lang === "ru"}
              />
            </label>
            <label className={css.field}>
              <span>Публикация</span>
              <select
                value={editing.status ?? "draft"}
                onChange={(event) => setEditing({ ...editing, status: event.target.value as PublishStatus })}
              >
                <option value="published">Опубликована</option>
                <option value="draft">Черновик</option>
              </select>
            </label>
            <label className={`${css.field} ${css.wide}`}>
              <span>Короткий текст</span>
              <input value={readLocaleField(editing, lang, "excerpt")} onChange={(event) => setField("excerpt", event.target.value)} />
            </label>
            <div className={css.wide}>
              <RichTextEditor
                label="Текст новости"
                hint="Вставьте фото в текст кнопкой ниже и сразу меняйте размер и расположение."
                value={readLocaleField(editing, lang, "body")}
                onChange={(body) => setField("body", body)}
                media={store?.media}
                onUpload={async (file) => (await upload(file)).url}
              />
            </div>
            <label className={css.field}>
              <span>Обложка в списке</span>
              <select value={editing.photo ?? ""} onChange={(event) => setEditing({ ...editing, photo: event.target.value })}>
                <option value="">Без обложки</option>
                {(store?.media ?? []).map((item) => (
                  <option key={item.id} value={item.url}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={css.field}>
              <span>Загрузить обложку</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const uploaded = await upload(file);
                  setEditing((current) => (current ? { ...current, photo: uploaded.url } : current));
                }}
              />
            </label>
            <details className={`${css.field} ${css.wide}`}>
              <summary>Адрес страницы</summary>
              <input
                value={editing.slug ?? ""}
                onChange={(event) => setEditing({ ...editing, slug: event.target.value })}
                placeholder="заполнится из заголовка"
              />
            </details>
          </div>
          {editing.photo ? <img className={css.thumb} src={editing.photo} alt="" /> : null}
          <div className={css.rowActions}>
            <button className={css.primary} disabled={busy} type="submit">
              Сохранить
            </button>
            <button className={css.ghost} type="button" onClick={() => setEditing(null)}>
              Отмена
            </button>
            {editing.id ? (
              <button className={css.danger} type="button" disabled={busy} onClick={() => void remove(editing as CmsNews)}>
                Удалить
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className={css.table}>
        <table>
          <thead>
            <tr>
              <th>Статус</th>
              <th>Заголовок</th>
              <th>Где видна</th>
              <th>Фото</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className={css.status} data-on={item.status}>
                    {statusLabel(item.status)}
                  </span>
                </td>
                <td className={css.wrap}>
                  <b>
                    {item.title}
                    <LocaleDots i18n={item.i18n} fields={newsFields} item={item} />
                  </b>
                  <div>
                    {item.date} · {item.tag}
                  </div>
                </td>
                <td>{whereLabel(item, store?.issuers ?? [])}</td>
                <td>{item.photo ? <img className={css.thumb} src={item.photo} alt="" /> : "—"}</td>
                <td>
                  <div className={css.rowActions}>
                    <button className={css.ghost} type="button" onClick={() => setEditing(item)}>
                      Изменить
                    </button>
                    <button className={css.danger} type="button" disabled={busy} onClick={() => void remove(item)}>
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
