"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { slugify } from "@/lib/cms/slug";
import { useAdminStore } from "@/lib/cms/client";
import { useContentLang } from "@/lib/cms/use-content-lang";
import { incompleteTranslation, isLocaleValueFilled, readLocaleField, writeLocaleField } from "@/lib/cms/locale";
import type { CmsIssuer, CmsNews, CmsNewsAttachment, NewsKind, PublishStatus } from "@/lib/cms/types";
import { formatFileSize } from "@/lib/news-content";
import { LocaleDots, LocaleTabs } from "@/components/admin/LocaleTabs";
import { NewsEditor } from "@/components/admin/NewsEditor";
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
  attachments: [],
  i18n: {},
};

const newsFields = ["title", "body"];

/** Документы новости: те же форматы и предел, что проверяет сервер (media.service.ts). */
const DOC_EXT = ["pdf", "doc", "docx", "xls", "xlsx", "zip"];
const DOC_MAX_BYTES = 20 * 1024 * 1024;

type FieldErrors = Partial<Record<"title" | "body" | "issuer", string>>;

function today() {
  const date = new Date();
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

function IssuerSelect({
  value,
  issuers,
  error,
  onChange,
}: {
  value: string;
  issuers: CmsIssuer[];
  error?: string;
  onChange: (slug: string) => void;
}) {
  const issuersByName = [...issuers].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  const current = value ? issuers.find((item) => item.slug === value) : undefined;

  return (
    <label className={`${css.field} ${css.wide}`}>
      <span>Компания</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={error ? true : undefined}>
        <option value="">Выберите компанию</option>
        {issuersByName.map((item) => (
          <option key={item.slug} value={item.slug}>
            {item.name}
          </option>
        ))}
      </select>
      {current ? <p className={css.picked}>Дальше напишите новость для «{current.name}».</p> : null}
      {error ? <p className={css.error}>{error}</p> : null}
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

/** Документы к новости: загрузка на сервер, название, формат и размер, удаление до сохранения. */
function AttachmentsField({
  value,
  onChange,
  upload,
}: {
  value: CmsNewsAttachment[];
  onChange: (next: CmsNewsAttachment[]) => void;
  upload: (file: File) => Promise<{ url: string; name: string }>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const added: CmsNewsAttachment[] = [];
    setBusy(true);
    try {
      for (const file of [...files]) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!DOC_EXT.includes(ext)) {
          setError(`«${file.name}»: можно прикрепить PDF, DOC, DOCX, XLS, XLSX или ZIP.`);
          continue;
        }
        if (file.size > DOC_MAX_BYTES) {
          setError(`«${file.name}» больше 20 МБ — сожмите файл или разделите его.`);
          continue;
        }
        const media = await upload(file);
        added.push({ name: file.name.replace(/\.[^.]+$/, ""), url: media.url, ext, size: file.size });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить документ.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
      if (added.length) onChange([...value, ...added]);
    }
  }

  return (
    <div className={`${css.field} ${css.wide}`}>
      <span>Документы (необязательно)</span>
      <p className={css.picked}>PDF, DOC, DOCX, XLS, XLSX или ZIP до 20 МБ. Посетители увидят их под текстом новости и смогут скачать.</p>
      {value.length ? (
        <ul className={css.attachments}>
          {value.map((item, index) => (
            <li key={item.url}>
              <span className={css.attachmentExt}>{item.ext.toUpperCase()}</span>
              <input
                aria-label="Название документа"
                value={item.name}
                maxLength={300}
                onChange={(event) => onChange(value.map((row, i) => (i === index ? { ...row, name: event.target.value } : row)))}
              />
              <small>{formatFileSize(item.size)}</small>
              <a className={css.ghost} href={item.url} target="_blank" rel="noreferrer">
                Открыть
              </a>
              <button className={css.danger} type="button" onClick={() => onChange(value.filter((_, i) => i !== index))}>
                Убрать
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div>
        <input
          ref={input}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
          disabled={busy}
          onChange={(event) => void add(event.target.files)}
        />
        {busy ? <small className={css.picked}> Загрузка…</small> : null}
      </div>
      {error ? (
        <p className={css.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function NewsManager() {
  const { store, error, busy, mutate, upload, setError } = useAdminStore();
  const [editing, setEditing] = useState<Partial<CmsNews> | null>(null);
  // Снимок открытой новости — по нему видно, есть ли несохранённые правки.
  const [original, setOriginal] = useState<string>("");
  const [lang, setLang] = useContentLang(editing?.id);
  const [notice, setNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const saving = useRef(false);

  const rows = useMemo(() => store?.news ?? [], [store]);
  const dirty = editing !== null && JSON.stringify(editing) !== original;

  // Закрытие вкладки с несохранённой новостью — браузер переспросит.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function open(next: Partial<CmsNews> | null) {
    if (dirty && !window.confirm("В открытой новости есть несохранённые изменения. Закрыть её без сохранения?")) return false;
    setEditing(next);
    setOriginal(next ? JSON.stringify(next) : "");
    setFieldErrors({});
    return true;
  }

  function setField(field: string, value: string) {
    if (!editing) return;
    setEditing(writeLocaleField(editing, lang, field, value));
    if (field === "title" || field === "body") setFieldErrors((current) => ({ ...current, [field]: undefined }));
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
    open({
      ...empty,
      date: today(),
      status: "published",
      kind,
      tag: kind === "company" ? "Эмитент" : "Биржа",
    });
  }

  /** Проверка перед отправкой: черновику нужен только заголовок, публикации — текст и переводы. */
  function validate(item: Partial<CmsNews>): boolean {
    const errors: FieldErrors = {};
    if (!item.title?.trim()) errors.title = "Укажите заголовок (вкладка RU).";
    if (item.kind === "company" && !item.issuerSlug) errors.issuer = "Выберите компанию, на чьей странице показывать новость.";
    if (item.status === "published" && !isLocaleValueFilled(item.body, "body")) errors.body = "Добавьте текст новости (вкладка RU) или сохраните её как черновик.";
    setFieldErrors(errors);
    if (errors.title || errors.body) setLang("ru");
    if (Object.keys(errors).length) {
      setError("Проверьте отмеченные поля.");
      return false;
    }
    if (item.status === "published") {
      const gap = incompleteTranslation(item, newsFields);
      if (gap) {
        setError(`${gap.message} Или сохраните новость как черновик — переводы можно добавить позже.`);
        setLang(gap.lang);
        return false;
      }
    }
    return true;
  }

  async function save() {
    if (!editing || saving.current) return;
    setNotice(null);
    setError(null);
    if (!validate(editing)) return;
    const creating = !editing.id;
    const item = {
      ...empty,
      ...editing,
      date: editing.date || today(),
      slug: editing.slug || slugify(editing.title ?? ""),
      issuerSlug: editing.kind === "company" ? editing.issuerSlug ?? "" : "",
      attachments: (editing.attachments ?? []).map((row) => ({ ...row, name: row.name.trim() || "Документ" })),
    };
    saving.current = true;
    try {
      if (editing.id) await mutate("update", "news", item, editing.id);
      else await mutate("create", "news", item);
      // Сообщение об успехе — только после ответа сервера.
      setEditing(null);
      setOriginal("");
      setNotice(
        creating
          ? item.status === "published"
            ? "Новость опубликована."
            : "Черновик сохранён."
          : "Изменения сохранены.",
      );
    } catch {
      // Текст ошибки сервера уже показан (error); введённое остаётся в форме.
    } finally {
      saving.current = false;
    }
  }

  async function remove(item: CmsNews) {
    if (!window.confirm(`Удалить новость «${item.title}»?`)) return;
    try {
      await mutate("delete", "news", undefined, item.id);
      if (editing?.id === item.id) {
        setEditing(null);
        setOriginal("");
      }
      setNotice("Новость удалена.");
    } catch {
      // сообщение уже в error
    }
  }

  async function uploadCover(file: File) {
    try {
      const uploaded = await upload(file);
      setEditing((current) => (current ? { ...current, photo: uploaded.url } : current));
    } catch {
      // Сообщение уже в error; форма и текст не теряются.
    }
  }

  const publishing = editing?.status === "published";

  return (
    <>
      <p className={css.kicker}>CMS · КФБ</p>
      <h1>Новости</h1>
      <p className={css.lead}>
        Общая новость попадает в ленту биржи. Новость компании видна только на странице этой компании. Черновик можно сохранить на
        одном русском — переводы на кыргызский и английский нужны перед публикацией.
      </p>
      <div className={css.toolbar}>
        <button className={css.primary} type="button" onClick={() => startCreate("exchange")}>
          + Общая новость
        </button>
        <button className={css.ghost} type="button" onClick={() => startCreate("company")}>
          + Новость компании
        </button>
      </div>
      {error ? (
        <p className={css.error} role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className={css.notice} role="status">
          {notice}
        </p>
      ) : null}

      {editing ? (
        <form
          className={css.form}
          noValidate
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
                error={fieldErrors.issuer}
                onChange={(issuerSlug) => {
                  setEditing({ ...editing, issuerSlug });
                  setFieldErrors((current) => ({ ...current, issuer: undefined }));
                }}
              />
            ) : (
              <label className={`${css.check} ${css.wide}`}>
                <input
                  type="checkbox"
                  checked={editing.kind === "urgent"}
                  onChange={(event) => setKind(event.target.checked ? "urgent" : "exchange")}
                />
                Пометить как срочную
              </label>
            )}
            <LocaleTabs lang={lang} onChange={setLang} i18n={editing.i18n} fields={newsFields} item={editing} />
            <label className={`${css.field} ${css.wide}`}>
              <span>Заголовок</span>
              <input
                value={readLocaleField(editing, lang, "title")}
                onChange={(event) => setField("title", event.target.value)}
                aria-invalid={fieldErrors.title && lang === "ru" ? true : undefined}
                maxLength={300}
              />
              {fieldErrors.title && lang === "ru" ? <p className={css.error}>{fieldErrors.title}</p> : null}
            </label>
            <label className={css.field}>
              <span>Дата</span>
              <input value={editing.date ?? ""} onChange={(event) => setEditing({ ...editing, date: event.target.value })} placeholder="ДД.ММ.ГГГГ" />
            </label>
            <label className={css.field}>
              <span>Рубрика</span>
              <input value={readLocaleField(editing, lang, "tag")} onChange={(event) => setField("tag", event.target.value)} />
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
              <span>Короткий текст (для списка новостей)</span>
              <input value={readLocaleField(editing, lang, "excerpt")} onChange={(event) => setField("excerpt", event.target.value)} maxLength={2000} />
            </label>
            <div className={css.wide}>
              <NewsEditor
                label="Текст новости"
                hint="Оформляйте как в Word: заголовки, списки, ссылки, таблицы, изображения и видео. Текст из Word и Google Docs можно вставлять как есть."
                value={readLocaleField(editing, lang, "body")}
                onChange={(body) => setField("body", body)}
                media={store?.media}
                onUpload={async (file) => (await upload(file)).url}
                error={lang === "ru" ? fieldErrors.body : null}
              />
            </div>
            <AttachmentsField
              value={editing.attachments ?? []}
              onChange={(attachments) => setEditing((current) => (current ? { ...current, attachments } : current))}
              upload={upload}
            />
            <label className={css.field}>
              <span>Обложка в списке</span>
              <select value={editing.photo ?? ""} onChange={(event) => setEditing({ ...editing, photo: event.target.value })}>
                <option value="">Без обложки</option>
                {(store?.media ?? [])
                  .filter((item) => /\.(jpe?g|png|webp|gif)$/i.test(item.url))
                  .map((item) => (
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
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadCover(file);
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
          {/* eslint-disable-next-line @next/next/no-img-element -- превью обложки из медиатеки в админке */}
          {editing.photo ? <img className={css.thumb} src={editing.photo} alt="" /> : null}
          <div className={css.rowActions}>
            <button className={css.primary} disabled={busy} type="submit">
              {busy ? "Сохранение…" : publishing ? "Сохранить и опубликовать" : "Сохранить черновик"}
            </button>
            <button className={css.ghost} type="button" onClick={() => open(null)}>
              Отмена
            </button>
            {editing.id ? (
              <button className={css.danger} type="button" disabled={busy} onClick={() => void remove(editing as CmsNews)}>
                Удалить
              </button>
            ) : null}
            {dirty ? <small className={css.picked}>Есть несохранённые изменения</small> : null}
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
                    {item.attachments?.length ? ` · документов: ${item.attachments.length}` : ""}
                  </div>
                </td>
                <td>{whereLabel(item, store?.issuers ?? [])}</td>
                {/* eslint-disable-next-line @next/next/no-img-element -- миниатюра в таблице админки */}
                <td>{item.photo ? <img className={css.thumb} src={item.photo} alt="" /> : "—"}</td>
                <td>
                  <div className={css.rowActions}>
                    <button
                      className={css.ghost}
                      type="button"
                      onClick={() => {
                        setNotice(null);
                        setError(null);
                        open({ ...item, attachments: item.attachments ?? [] });
                      }}
                    >
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
