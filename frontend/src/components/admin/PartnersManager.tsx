"use client";

import { useState } from "react";
import { useAdminStore } from "@/lib/cms/client";
import { useContentLang } from "@/lib/cms/use-content-lang";
import { incompleteTranslation, readLocaleField, writeLocaleField } from "@/lib/cms/locale";
import type { CmsPartner } from "@/lib/cms/types";
import { LocaleDots, LocaleTabs } from "@/components/admin/LocaleTabs";
import css from "@/app/admin/admin.module.css";

const fields = ["kind", "caption", "name", "lead", "body"];
/** Названия партнёров — имена собственные (KASE, Borsa Istanbul): перевод можно оставить как есть. */
const properNames = ["caption", "name"];

const empty: Omit<CmsPartner, "id" | "updatedAt"> = {
  slug: "",
  mark: "",
  kind: "",
  caption: "",
  name: "",
  lead: "",
  body: "",
  site: "",
  logo: "",
  logoWide: false,
  order: 1,
  status: "published",
  i18n: {},
};

/** «Наши партнеры»: блок на главной и страницы /about/partners. */
export function PartnersManager() {
  const { store, error, busy, mutate, upload, setError } = useAdminStore();
  const [editing, setEditing] = useState<Partial<CmsPartner> | null>(null);
  const [lang, setLang] = useContentLang(editing?.id);
  const partners = [...(store?.partners ?? [])].sort((a, b) => a.order - b.order);

  function setField(field: string, value: string) {
    if (!editing) return;
    setEditing(writeLocaleField(editing, lang, field, value));
  }

  async function save() {
    if (!editing?.caption || !editing.mark || !editing.slug) return;
    const gap = incompleteTranslation(editing, fields, properNames);
    if (gap) {
      setError(gap.message);
      setLang(gap.lang);
      return;
    }
    const item = { ...empty, ...editing, slug: editing.slug.trim().toLowerCase(), order: Number(editing.order) || partners.length + 1 };
    if (editing.id) await mutate("update", "partners", item, editing.id);
    else await mutate("create", "partners", item);
    setEditing(null);
  }

  async function move(item: CmsPartner, dir: -1 | 1) {
    const index = partners.findIndex((row) => row.id === item.id);
    const other = partners[index + dir];
    if (!other) return;
    await mutate("update", "partners", { order: other.order }, item.id);
    await mutate("update", "partners", { order: item.order }, other.id);
  }

  async function remove(item: CmsPartner) {
    if (!window.confirm(`Удалить партнёра «${item.caption}»? Карточка пропадёт с главной и из раздела «Наши партнеры».`)) return;
    await mutate("delete", "partners", undefined, item.id);
  }

  return (
    <>
      <p className={css.kicker}>CMS · КФБ</p>
      <h1>Партнёры</h1>
      <p className={css.lead}>
        Блок «Наши партнеры» на главной и страницы партнёров. Тексты — на русском, кыргызском и английском; порядок карточек
        меняется стрелками.
      </p>
      <div className={css.toolbar}>
        <button className={css.primary} type="button" onClick={() => setEditing({ ...empty, order: partners.length + 1 })}>
          + Добавить партнёра
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
            <LocaleTabs lang={lang} onChange={setLang} i18n={editing.i18n} fields={fields} item={editing} />
            <label className={css.field}>
              <span>Название на карточке</span>
              <input value={readLocaleField(editing, lang, "caption")} placeholder="Казахстанская биржа" onChange={(event) => setField("caption", event.target.value)} required />
            </label>
            <label className={css.field}>
              <span>Обозначение (общее для всех языков)</span>
              <input value={editing.mark ?? ""} placeholder="KASE" onChange={(event) => setEditing({ ...editing, mark: event.target.value })} required />
            </label>
            <label className={`${css.field} ${css.wide}`}>
              <span>Полное название</span>
              <input value={readLocaleField(editing, lang, "name")} onChange={(event) => setField("name", event.target.value)} />
            </label>
            <label className={css.field}>
              <span>Тип</span>
              <input value={readLocaleField(editing, lang, "kind")} placeholder="Регулятор, Биржа-партнёр…" onChange={(event) => setField("kind", event.target.value)} />
            </label>
            <label className={css.field}>
              <span>Официальный сайт</span>
              <input value={editing.site ?? ""} placeholder="https://…" onChange={(event) => setEditing({ ...editing, site: event.target.value })} />
            </label>
            <label className={`${css.field} ${css.wide}`}>
              <span>Кратко (на карточке)</span>
              <textarea rows={2} style={{ fontFamily: "inherit" }} value={readLocaleField(editing, lang, "lead")} onChange={(event) => setField("lead", event.target.value)} />
            </label>
            <label className={`${css.field} ${css.wide}`}>
              <span>Текст страницы партнёра (абзацы — через пустую строку)</span>
              <textarea rows={6} style={{ fontFamily: "inherit" }} value={readLocaleField(editing, lang, "body")} onChange={(event) => setField("body", event.target.value)} />
            </label>
            <label className={css.field}>
              <span>Адрес страницы: /about/partners/…</span>
              <input value={editing.slug ?? ""} placeholder="kase" onChange={(event) => setEditing({ ...editing, slug: event.target.value })} required />
            </label>
            <label className={css.field}>
              <span>Статус</span>
              <select value={editing.status ?? "published"} onChange={(event) => setEditing({ ...editing, status: event.target.value as CmsPartner["status"] })}>
                <option value="published">Опубликован</option>
                <option value="draft">Черновик (скрыт на сайте)</option>
              </select>
            </label>
            <div className={`${css.field} ${css.wide}`}>
              <span>Логотип</span>
              <div className={css.docRow} style={{ gridTemplateColumns: "auto auto 1fr auto" }}>
                {editing.logo ? <img className={css.thumb} src={editing.logo} alt="" style={{ objectFit: "contain", background: "#fff" }} /> : <span className={css.docFile}>Нет логотипа</span>}
                <label className={css.ghost} style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
                  {busy ? "Загрузка…" : editing.logo ? "Заменить" : "Загрузить с ПК"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    hidden
                    disabled={busy}
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (!file) return;
                      const media = await upload(file);
                      setEditing((current) => ({ ...current, logo: media.url }));
                    }}
                  />
                </label>
                <label className={css.docFile} style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={Boolean(editing.logoWide)} onChange={(event) => setEditing({ ...editing, logoWide: event.target.checked })} />
                  Широкий логотип (как KASE, Borsa Istanbul)
                </label>
                {editing.logo ? (
                  <button className={css.danger} type="button" onClick={() => setEditing({ ...editing, logo: "" })}>
                    Убрать
                  </button>
                ) : null}
              </div>
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
              <th>#</th>
              <th>Логотип</th>
              <th>Партнёр</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.logo ? <img className={css.thumb} src={item.logo} alt="" style={{ objectFit: "contain", background: "#fff" }} /> : <b>{item.mark}</b>}</td>
                <td className={css.wrap}>
                  <b>
                    {item.mark} · {item.caption}
                    <LocaleDots i18n={item.i18n} fields={fields} item={item} />
                  </b>
                  <div className={css.note}>
                    {item.kind}
                    {item.site ? ` · ${item.site}` : ""}
                  </div>
                </td>
                <td>{item.status === "published" ? "Опубликован" : "Черновик"}</td>
                <td>
                  <div className={css.rowActions}>
                    <button className={css.ghost} type="button" disabled={busy || index === 0} onClick={() => void move(item, -1)}>
                      ↑
                    </button>
                    <button className={css.ghost} type="button" disabled={busy || index === partners.length - 1} onClick={() => void move(item, 1)}>
                      ↓
                    </button>
                    <a className={css.ghost} href={`/about/partners/${item.slug}`} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center" }}>
                      Открыть
                    </a>
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
