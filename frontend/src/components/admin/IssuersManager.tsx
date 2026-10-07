"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminStore } from "@/lib/cms/client";
import {
  listingCategoryIds,
  listingCategoryTitles,
  type CmsIssuer,
  type CmsListingDocument,
  type CmsListingEntry,
  type ListingCategoryId,
} from "@/lib/cms/types";
import { DocumentViewer } from "@/components/admin/DocumentViewer";
import css from "@/app/admin/admin.module.css";

type Tab = "issuers" | "listing";

const perPage = 25;
const statusOptions = ["Активен", "Неактивен", "Ликвидирован"];

const emptyIssuer: Omit<CmsIssuer, "id" | "updatedAt"> = {
  slug: "",
  name: "",
  activity: "",
  director: "",
  position: "",
  address: "",
  phone: "",
  registrar: "",
  security: "",
  count: "",
  price: "",
  status: "Активен",
  order: 1,
};

const emptyListing: Omit<CmsListingEntry, "id" | "updatedAt"> = {
  code: "",
  category: "B",
  order: 1,
  name: "",
  issuerSlug: "",
  security: "",
  price: "",
  cap: "",
  count: "",
  doc: "",
  symbols: "",
  industry: "",
  activity: "",
  listedAt: "",
  auditor: "",
  registrar: "",
  marketMaker: "",
  documents: [],
};

/** Подсказка slug по названию: «ОАО Аэропорты Кыргызстана» → «oao_aeroporty_kyrgyzstana». */
function suggestSlug(name: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
    н: "n", о: "o", ө: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ү: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh",
    щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya", ң: "n",
  };
  return name
    .toLowerCase()
    .replace(/["«»()]/g, " ")
    .split("")
    .map((char) => map[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

function urlParam(name: string) {
  return typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(name);
}

function TextField({
  label,
  value,
  onChange,
  wide,
  required,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  wide?: boolean;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className={`${css.field} ${wide ? css.wide : ""}`}>
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function IssuersManager() {
  const { store, error, busy, mutate, upload, setError } = useAdminStore();
  // Просмотр отчётов бумаги поверх страницы, без перехода в другое окно.
  const [viewing, setViewing] = useState<{ title: string; documents: CmsListingDocument[]; index: number } | null>(null);
  // Переход с кнопки «Редактировать» на сайте: ?tab=listing или ?edit=<slug эмитента>.
  // Админка рендерится только в браузере (AdminShell ждёт сессию), поэтому window здесь доступен.
  const [tab, setTab] = useState<Tab>(() => (urlParam("tab") === "listing" ? "listing" : "issuers"));
  const [pendingEdit, setPendingEdit] = useState(() => urlParam("edit")?.toLowerCase() ?? null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [issuer, setIssuer] = useState<Partial<CmsIssuer> | null>(null);
  const [entry, setEntry] = useState<Partial<CmsListingEntry> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const issuers = useMemo(() => [...(store?.issuers ?? [])].sort((a, b) => a.order - b.order), [store?.issuers]);
  const listing = useMemo(() => store?.listing ?? [], [store?.listing]);
  const issuersByName = useMemo(() => [...issuers].sort((a, b) => a.name.localeCompare(b.name, "ru")), [issuers]);

  const codesBySlug = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const row of listing) {
      if (!row.issuerSlug) continue;
      map.set(row.issuerSlug, [...(map.get(row.issuerSlug) ?? []), row.code]);
    }
    return map;
  }, [listing]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return issuers;
    return issuers.filter((item) => item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q));
  }, [issuers, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const shown = filtered.slice((Math.min(page, pages) - 1) * perPage, Math.min(page, pages) * perPage);

  // Как только данные пришли — открываем эмитента из ссылки (обновление состояния во время рендера, без эффекта).
  if (pendingEdit && store) {
    setPendingEdit(null);
    const match = store.issuers.find((item) => item.slug.toLowerCase() === pendingEdit);
    if (match) setIssuer(match);
  }

  // Прокручиваем к форме только при её открытии, а не на каждый ввод.
  const formKey = issuer ? `issuer:${issuer.id ?? "new"}` : entry ? `listing:${entry.id ?? "new"}` : "";
  useEffect(() => {
    if (formKey) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [formKey]);

  function switchTab(next: Tab) {
    setTab(next);
    setIssuer(null);
    setEntry(null);
    setError(null);
  }

  async function saveIssuer() {
    if (!issuer?.name) return;
    const item = {
      ...emptyIssuer,
      ...issuer,
      slug: (issuer.slug || suggestSlug(issuer.name)).trim(),
      order: Number(issuer.order) || issuers.length + 1,
    };
    if (issuer.id) await mutate("update", "issuers", item, issuer.id);
    else await mutate("create", "issuers", item);
    setIssuer(null);
  }

  async function removeIssuer(item: CmsIssuer) {
    const codes = codesBySlug.get(item.slug);
    const warn = codes?.length ? `\nВ листинге он указан у бумаг: ${codes.join(", ")} — ссылки на карточку пропадут.` : "";
    if (!window.confirm(`Удалить эмитента «${item.name}»?${warn}`)) return;
    await mutate("delete", "issuers", undefined, item.id);
  }

  async function saveEntry() {
    if (!entry?.code || !entry.name) return;
    const noFile = (entry.documents ?? []).find((doc) => doc.name && !doc.url);
    if (noFile) {
      setError(`Загрузите файл для документа «${noFile.name}» или удалите строку`);
      return;
    }
    const sameCategory = listing.filter((row) => row.category === (entry.category ?? "B"));
    const item = {
      ...emptyListing,
      ...entry,
      code: entry.code.trim(),
      order: Number(entry.order) || sameCategory.length + 1,
      documents: (entry.documents ?? []).filter((doc) => doc.name || doc.url),
    };
    if (entry.id) await mutate("update", "listing", item, entry.id);
    else await mutate("create", "listing", item);
    setEntry(null);
  }

  async function removeEntry(item: CmsListingEntry) {
    if (!window.confirm(`Убрать ${item.code} (${item.name}) из листинга?`)) return;
    await mutate("delete", "listing", undefined, item.id);
  }

  function setDocuments(rows: CmsListingDocument[]) {
    setEntry((current) => (current ? { ...current, documents: rows } : current));
  }

  function setDocumentCell(index: number, field: keyof CmsListingDocument, value: string) {
    const rows = [...(entry?.documents ?? [])];
    rows[index] = { ...rows[index], [field]: value };
    setDocuments(rows);
  }

  /** Отчёт с компьютера: файл ложится в медиатеку, ссылка — в строку документа. */
  async function uploadDocument(index: number, file: File) {
    const media = await upload(file);
    setEntry((current) => {
      if (!current) return current;
      const rows = [...(current.documents ?? [])];
      rows[index] = { name: rows[index]?.name || media.name, url: media.url };
      return { ...current, documents: rows };
    });
  }

  /** Выбор эмитента подставляет его данные в пустые поля бумаги. */
  function pickIssuer(slug: string) {
    if (!entry) return;
    const picked = issuers.find((item) => item.slug === slug);
    setEntry({
      ...entry,
      issuerSlug: slug,
      name: entry.name || picked?.name || "",
      activity: entry.activity || picked?.activity || "",
      registrar: entry.registrar || picked?.registrar || "",
      security: entry.security || picked?.security || "",
    });
  }

  return (
    <>
      <p className={css.kicker}>CMS · КФБ</p>
      <h1>Эмитенты и листинг</h1>
      <p className={css.lead}>
        «Эмитенты» — карточки Центра раскрытия информации (/disclosure). «Листинг» — официальный список бумаг на странице
        /listing; бумага ссылается на карточку эмитента через выбранную компанию.
      </p>

      <div className={css.localeTabs} role="tablist" style={{ marginBottom: 18 }}>
        <button className={css.localeTab} type="button" data-on={tab === "issuers"} onClick={() => switchTab("issuers")}>
          Эмитенты · {issuers.length}
        </button>
        <button className={css.localeTab} type="button" data-on={tab === "listing"} onClick={() => switchTab("listing")}>
          Листинг · {listing.length}
        </button>
      </div>

      {error ? <p className={css.error}>{error}</p> : null}

      {tab === "issuers" ? (
        <>
          <div className={css.toolbar}>
            <button
              className={css.primary}
              type="button"
              onClick={() => setIssuer({ ...emptyIssuer, order: issuers.length + 1 })}
            >
              + Добавить эмитента
            </button>
            <label className={css.field} style={{ minWidth: 280 }}>
              <input
                type="search"
                placeholder="Поиск по названию или slug"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
            </label>
          </div>

          {issuer ? (
            <form
              ref={formRef}
              className={css.form}
              onSubmit={(event) => {
                event.preventDefault();
                void saveIssuer();
              }}
            >
              <div className={css.fields}>
                <TextField label="Наименование" wide required value={issuer.name ?? ""} onChange={(name) => setIssuer({ ...issuer, name })} />
                <TextField
                  label="Slug (адрес /disclosure/…)"
                  value={issuer.slug ?? ""}
                  placeholder={issuer.name ? suggestSlug(issuer.name) : "JSC_Company"}
                  onChange={(slug) => setIssuer({ ...issuer, slug })}
                />
                <label className={css.field}>
                  <span>Статус профиля</span>
                  <select value={issuer.status ?? ""} onChange={(event) => setIssuer({ ...issuer, status: event.target.value })}>
                    <option value="">Не указан</option>
                    {/* Старые записи могут хранить нестандартное значение («активен») — показываем его, чтобы не потерять. */}
                    {issuer.status && !statusOptions.includes(issuer.status) ? (
                      <option value={issuer.status}>{issuer.status}</option>
                    ) : null}
                    {statusOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <TextField label="Вид деятельности" wide value={issuer.activity ?? ""} onChange={(activity) => setIssuer({ ...issuer, activity })} />
                <TextField label="ФИО руководителя" value={issuer.director ?? ""} onChange={(director) => setIssuer({ ...issuer, director })} />
                <TextField label="Должность руководителя" value={issuer.position ?? ""} onChange={(position) => setIssuer({ ...issuer, position })} />
                <TextField label="Адрес" wide value={issuer.address ?? ""} onChange={(address) => setIssuer({ ...issuer, address })} />
                <TextField label="Телефон / факс" value={issuer.phone ?? ""} onChange={(phone) => setIssuer({ ...issuer, phone })} />
                <TextField label="Регистратор" value={issuer.registrar ?? ""} onChange={(registrar) => setIssuer({ ...issuer, registrar })} />
                <TextField label="Вид ценных бумаг" value={issuer.security ?? ""} onChange={(security) => setIssuer({ ...issuer, security })} />
                <TextField label="Количество ценных бумаг" value={issuer.count ?? ""} placeholder="20 400 шт." onChange={(count) => setIssuer({ ...issuer, count })} />
                <TextField label="Цена размещения" value={issuer.price ?? ""} placeholder="2 000 сом" onChange={(price) => setIssuer({ ...issuer, price })} />
                <TextField
                  label="Порядок в списке"
                  type="number"
                  value={String(issuer.order ?? "")}
                  onChange={(order) => setIssuer({ ...issuer, order: Number(order) })}
                />
              </div>
              <div className={css.rowActions}>
                <button className={css.primary} disabled={busy} type="submit">
                  Сохранить
                </button>
                <button className={css.ghost} type="button" onClick={() => setIssuer(null)}>
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
                  <th>Эмитент</th>
                  <th>Статус</th>
                  <th>Листинг</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((item) => (
                  <tr key={item.id}>
                    <td>{item.order}</td>
                    <td className={css.wrap}>
                      <b>{item.name}</b>
                      <div className={css.note}>{item.slug}</div>
                    </td>
                    <td>
                      <span className={css.status} data-on={/^актив/i.test(item.status) ? "published" : "draft"}>
                        {item.status || "—"}
                      </span>
                    </td>
                    <td>{codesBySlug.get(item.slug)?.join(", ") ?? "—"}</td>
                    <td>
                      <div className={css.rowActions}>
                        <button className={css.ghost} type="button" onClick={() => setIssuer(item)}>
                          Изменить
                        </button>
                        <a className={css.ghost} href={`/disclosure/${item.slug}`} target="_blank" rel="noreferrer">
                          На сайте
                        </a>
                        <button className={css.danger} type="button" disabled={busy} onClick={() => void removeIssuer(item)}>
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!shown.length ? (
                  <tr>
                    <td colSpan={5}>{store ? "Ничего не найдено" : "Загрузка…"}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {pages > 1 ? (
            <div className={css.localeTabs} style={{ marginTop: 14 }}>
              {Array.from({ length: pages }, (_, index) => (
                <button
                  key={index}
                  className={css.localeTab}
                  type="button"
                  data-on={index + 1 === Math.min(page, pages)}
                  onClick={() => setPage(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className={css.toolbar}>
            <button className={css.primary} type="button" onClick={() => setEntry({ ...emptyListing })}>
              + Добавить бумагу
            </button>
          </div>

          {entry ? (
            <form
              ref={formRef}
              className={css.form}
              onSubmit={(event) => {
                event.preventDefault();
                void saveEntry();
              }}
            >
              <div className={css.fields}>
                <label className={`${css.field} ${css.wide}`}>
                  <span>Эмитент в Центре раскрытия информации</span>
                  <select value={entry.issuerSlug ?? ""} onChange={(event) => pickIssuer(event.target.value)}>
                    <option value="">— нет карточки, без ссылки —</option>
                    {issuersByName.map((item) => (
                      <option key={item.id} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <TextField label="Наименование эмитента в списке" wide required value={entry.name ?? ""} onChange={(name) => setEntry({ ...entry, name })} />
                <TextField label="Код бумаги" required placeholder="MAIR4" value={entry.code ?? ""} onChange={(code) => setEntry({ ...entry, code })} />
                <label className={css.field}>
                  <span>Категория</span>
                  <select
                    value={entry.category ?? "B"}
                    onChange={(event) => setEntry({ ...entry, category: event.target.value as ListingCategoryId })}
                  >
                    {listingCategoryIds.map((id) => (
                      <option key={id} value={id}>
                        {listingCategoryTitles[id]}
                      </option>
                    ))}
                  </select>
                </label>
                <TextField
                  label="Порядок в категории"
                  type="number"
                  value={String(entry.order ?? "")}
                  onChange={(order) => setEntry({ ...entry, order: Number(order) })}
                />
                <TextField label="Ценная бумага" wide placeholder="Акция простая" value={entry.security ?? ""} onChange={(security) => setEntry({ ...entry, security })} />
                <TextField label="Цена последней сделки, сом" value={entry.price ?? ""} onChange={(price) => setEntry({ ...entry, price })} />
                <TextField label="Капитализация, млн сом" value={entry.cap ?? ""} onChange={(cap) => setEntry({ ...entry, cap })} />
                <TextField label="Количество ЦБ" value={entry.count ?? ""} onChange={(count) => setEntry({ ...entry, count })} />
                <TextField label="Анкета / проспект (ссылка)" wide type="url" placeholder="https://…" value={entry.doc ?? ""} onChange={(doc) => setEntry({ ...entry, doc })} />
                <TextField label="Торговые символы" placeholder="MAIR3 MAIR4" value={entry.symbols ?? ""} onChange={(symbols) => setEntry({ ...entry, symbols })} />
                <TextField label="Отрасль" value={entry.industry ?? ""} onChange={(industry) => setEntry({ ...entry, industry })} />
                <TextField label="Дата прохождения листинга" type="date" value={entry.listedAt ?? ""} onChange={(listedAt) => setEntry({ ...entry, listedAt })} />
                <TextField label="Вид деятельности" wide value={entry.activity ?? ""} onChange={(activity) => setEntry({ ...entry, activity })} />
                <TextField label="Аудитор" value={entry.auditor ?? ""} onChange={(auditor) => setEntry({ ...entry, auditor })} />
                <TextField label="Регистратор" value={entry.registrar ?? ""} onChange={(registrar) => setEntry({ ...entry, registrar })} />
                <TextField label="Маркет-мейкер" value={entry.marketMaker ?? ""} onChange={(marketMaker) => setEntry({ ...entry, marketMaker })} />
              </div>
              <div className={css.fields}>
                <div className={`${css.field} ${css.wide}`}>
                  <span>Документы (вкладка «Отчетность» в карточке эмитента)</span>
                  {(entry.documents ?? []).map((doc, index) => (
                    <div key={index} className={css.docRow}>
                      <input placeholder="Название" value={doc.name} onChange={(event) => setDocumentCell(index, "name", event.target.value)} />
                      {doc.url ? (
                        <button
                          className={css.docFile}
                          type="button"
                          onClick={() => {
                            const docs = entry.documents ?? [];
                            setViewing({
                              title: entry.code ? `${entry.code} — ${entry.name ?? ""}` : (entry.name ?? "Документы"),
                              documents: docs,
                              // в окне только документы с файлом — пересчитываем позицию
                              index: docs.slice(0, index).filter((item) => item.url).length,
                            });
                          }}
                        >
                          Открыть файл
                        </button>
                      ) : (
                        <span className={css.docFile}>Файл не загружен</span>
                      )}
                      <label className={css.ghost} style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
                        {busy ? "Загрузка…" : doc.url ? "Заменить файл" : "Загрузить с ПК"}
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                          hidden
                          disabled={busy}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (file) void uploadDocument(index, file).catch(() => undefined);
                          }}
                        />
                      </label>
                      <button
                        className={css.danger}
                        type="button"
                        onClick={() => setDocuments((entry.documents ?? []).filter((_, i) => i !== index))}
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                  <button
                    className={css.ghost}
                    type="button"
                    onClick={() => setDocuments([...(entry.documents ?? []), { name: "", url: "" }])}
                  >
                    + Документ
                  </button>
                  <small className={css.note}>Файл PDF, Word, Excel или ZIP до 20 МБ. После загрузки нажмите «Сохранить».</small>
                </div>
              </div>
              <div className={css.rowActions}>
                <button className={css.primary} disabled={busy} type="submit">
                  Сохранить
                </button>
                <button className={css.ghost} type="button" onClick={() => setEntry(null)}>
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
                  <th>Код</th>
                  <th>Эмитент</th>
                  <th>Бумага</th>
                  <th>Цена</th>
                  <th>Капитализация</th>
                  <th>Действия</th>
                </tr>
              </thead>
              {listingCategoryIds.map((category) => {
                const rows = listing.filter((row) => row.category === category).sort((a, b) => a.order - b.order);
                return (
                  <tbody key={category}>
                    <tr>
                      <th colSpan={7}>
                        {listingCategoryTitles[category]} · {rows.length}
                      </th>
                    </tr>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.order}</td>
                        <td>
                          <b>{row.code}</b>
                        </td>
                        <td className={css.wrap}>
                          {row.name}
                          {row.issuerSlug ? null : <div className={css.note}>без карточки эмитента</div>}
                        </td>
                        <td className={css.wrap}>{row.security || "—"}</td>
                        <td>{row.price || "—"}</td>
                        <td>{row.cap || "—"}</td>
                        <td>
                          <div className={css.rowActions}>
                            {row.documents?.some((doc) => doc.url) ? (
                              <button
                                className={css.ghost}
                                type="button"
                                onClick={() => setViewing({ title: `${row.code} — ${row.name}`, documents: row.documents, index: 0 })}
                              >
                                Отчёты ({row.documents.filter((doc) => doc.url).length})
                              </button>
                            ) : null}
                            <button className={css.ghost} type="button" onClick={() => setEntry(row)}>
                              Изменить
                            </button>
                            <button className={css.danger} type="button" disabled={busy} onClick={() => void removeEntry(row)}>
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                );
              })}
            </table>
          </div>
        </>
      )}
      {viewing ? (
        <DocumentViewer
          title={viewing.title}
          documents={viewing.documents}
          startIndex={viewing.index}
          onClose={() => setViewing(null)}
        />
      ) : null}
    </>
  );
}
