"use client";

import { useEffect, useMemo, useState } from "react";
import { slugify } from "@/lib/cms/slug";
import { useAdminStore } from "@/lib/cms/client";
import { incompleteTranslation, isLocaleValueFilled, readLocaleField, writeLocaleField, type ContentLang } from "@/lib/cms/locale";
import type { CmsNews, NewsKind, PublishStatus } from "@/lib/cms/types";
import { LocaleDots, LocaleTabs } from "@/components/admin/LocaleTabs";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { getIssuer, issuers } from "@/data/issuers";
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

const newsFields = ["title", "tag", "excerpt", "body"];

const kindLabel: Record<NewsKind, string> = {
  exchange: "Биржа",
  company: "Эмитент",
  urgent: "Срочно",
};

function today() {
  const date = new Date();
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

function IssuerSelect({ value, onChange }: { value: string; onChange: (slug: string) => void }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return issuers;
    return issuers.filter(
      (item) => item.name.toLowerCase().includes(needle) || item.slug.toLowerCase().includes(needle),
    );
  }, [query]);
  const current = value ? getIssuer(value) : undefined;
  const options = current && !filtered.some((item) => item.slug === current.slug) ? [current, ...filtered] : filtered;

  return (
    <>
      <label className={css.field}>
        <span>Поиск компании</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название или slug" />
      </label>
      <label className={`${css.field} ${css.wide}`}>
        <span>Компания</span>
        <select value={value} onChange={(event) => onChange(event.target.value)} required>
          <option value="">Выберите компанию</option>
          {options.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

export function NewsManager() {
  const { store, error, busy, mutate, upload, setError } = useAdminStore();
  const [editing, setEditing] = useState<Partial<CmsNews> | null>(null);
  const [lang, setLang] = useState<ContentLang>("ru");

  const rows = useMemo(() => store?.news ?? [], [store]);

  useEffect(() => {
    setLang("ru");
  }, [editing?.id]);

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

  async function save() {
    if (!editing?.title) return;
    if (editing.kind === "company" && !editing.issuerSlug) {
      setError("Выберите компанию для новости эмитента.");
      return;
    }
    if (!isLocaleValueFilled(editing.body, "body")) {
      setError("Укажите текст новости на русском, кыргызском и английском.");
      setLang("ru");
      return;
    }
    const gap = incompleteTranslation(editing, newsFields);
    if (gap) {
      setError(gap.message);
      setLang(gap.lang);
      return;
    }
    const item = {
      ...empty,
      ...editing,
      date: editing.date || today(),
      slug: editing.slug || slugify(editing.title),
      issuerSlug: editing.kind === "company" ? editing.issuerSlug ?? "" : "",
    };
    if (editing.id) await mutate("update", "news", item, editing.id);
    else await mutate("create", "news", item);
    setEditing(null);
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
        Общие новости биржи идут в пресс-центр. Новость эмитента привязывается к компании и показывается только на её
        странице.
      </p>
      <div className={css.toolbar}>
        <button className={css.primary} type="button" onClick={() => setEditing({ ...empty, date: today(), status: "published" })}>
          + Добавить новость
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
            <LocaleTabs lang={lang} onChange={setLang} i18n={editing.i18n} fields={newsFields} item={editing} />
            <label className={`${css.field} ${css.wide}`}>
              <span>Заголовок</span>
              <input
                value={readLocaleField(editing, lang, "title")}
                onChange={(event) => setField("title", event.target.value)}
                required
              />
            </label>
            <label className={css.field}>
              <span>Slug</span>
              <input value={editing.slug ?? ""} onChange={(event) => setEditing({ ...editing, slug: event.target.value })} placeholder="auto" />
            </label>
            <label className={css.field}>
              <span>Дата</span>
              <input value={editing.date ?? ""} onChange={(event) => setEditing({ ...editing, date: event.target.value })} />
            </label>
            <label className={css.field}>
              <span>Тег</span>
              <input value={readLocaleField(editing, lang, "tag")} onChange={(event) => setField("tag", event.target.value)} required />
            </label>
            <label className={css.field}>
              <span>Тип</span>
              <select value={editing.kind ?? "exchange"} onChange={(event) => setKind(event.target.value as NewsKind)}>
                <option value="exchange">Биржа — общая новость</option>
                <option value="company">Эмитент — новость компании</option>
                <option value="urgent">Срочно — общая</option>
              </select>
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
            {editing.kind === "company" ? (
              <IssuerSelect
                value={editing.issuerSlug ?? ""}
                onChange={(issuerSlug) => setEditing({ ...editing, issuerSlug })}
              />
            ) : null}
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
              <th>Тип</th>
              <th>Slug</th>
              <th>Фото</th>
              <th>ID</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className={css.status} data-on={item.status}>
                    {item.status}
                  </span>
                </td>
                <td className={css.wrap}>
                  <b>
                    {item.title}
                    <LocaleDots i18n={item.i18n} fields={newsFields} item={item} />
                  </b>
                  <div>
                    {item.date} · {item.tag}
                    {item.kind === "company" && item.issuerSlug
                      ? ` · ${getIssuer(item.issuerSlug)?.name ?? item.issuerSlug}`
                      : null}
                  </div>
                </td>
                <td>{kindLabel[item.kind]}</td>
                <td>{item.slug}</td>
                <td>{item.photo ? <img className={css.thumb} src={item.photo} alt="" /> : "—"}</td>
                <td>{item.id.slice(0, 8)}</td>
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
