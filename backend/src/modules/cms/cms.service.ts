import {
  createItem,
  deleteItem,
  detachMediaUrl,
  findItem,
  insertAudit,
  insertRequest,
  readFullStore,
  readIssuerData,
  readPublicStore,
  updateItem,
} from "../../db/repositories/cms.repository";
import { isLandingCollection } from "../../db/landing";
import {
  auditDetail,
  orderedHubs,
  orderedSlides,
  publishedManagement,
  publishedOrdered,
  publishedPartners,
  publishedNews,
  readStore,
  sanitizeStore,
} from "../../store/cms.store";
import { parseI18n, type AdminSession, type CmsI18n } from "../../../../shared/cms";
import { languageError } from "../../../../shared/lang-check";
import { defaultSiteSettings } from "../../../../shared/site-defaults";
import { hashPassword } from "../auth/password";
import { sanitizeRichHtml } from "../../utils/sanitize-html";
import { AppError } from "../../middleware/error";
import { itemSchemas, mutateSchema, type MutableCollection } from "../../validation/cms";
import { removeUploadedFile } from "../media/media.service";
import { inTransaction } from "../../db/prisma";
import { notifyNewRequest } from "../notify/notify";
import { cachedPublic, invalidatePublicContent } from "../../store/public-cache";

function descendantIds(menu: { id: string; parentId: string | null }[], rootId: string) {
  const blocked = new Set<string>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const node of menu) {
      if (node.parentId && blocked.has(node.parentId) && !blocked.has(node.id)) {
        blocked.add(node.id);
        grew = true;
      }
    }
  }
  return blocked;
}

function sanitizeI18n(value: unknown, htmlFields: string[]): CmsI18n {
  const parsed = parseI18n(value);
  const out: CmsI18n = {};
  for (const lang of ["ky", "en"] as const) {
    const pack = parsed[lang];
    if (!pack) continue;
    const next = { ...pack };
    for (const field of htmlFields) {
      if (typeof next[field] === "string") next[field] = sanitizeRichHtml(next[field]);
    }
    out[lang] = next;
  }
  return out;
}

function assertMenuTranslations(item: Record<string, unknown>, existing?: Record<string, unknown>) {
  const reorderOnly = Boolean(
    existing &&
      existing.label === item.label &&
      JSON.stringify(existing.i18n ?? {}) === JSON.stringify(item.i18n ?? {}) &&
      existing.href === item.href &&
      (Number(existing.order) !== Number(item.order) || (existing.parentId ?? null) !== (item.parentId ?? null)),
  );
  if (reorderOnly) return;
  const i18n = parseI18n(item.i18n);
  const ru = String(item.label ?? "");
  const ky = String(i18n.ky?.label ?? "");
  const en = String(i18n.en?.label ?? "");
  if (!ky.trim() || !en.trim()) {
    throw new AppError("Нужны все три языка. Заполните название на вкладках KY и EN.", 400);
  }
  const ruErr = languageError(ru, "ru");
  if (ruErr) throw new AppError(ruErr, 400);
  const kyErr = languageError(ky, "ky", ru);
  if (kyErr) throw new AppError(kyErr, 400);
  const enErr = languageError(en, "en", ru);
  if (enErr) throw new AppError(enErr, 400);
}

async function prepareItem(
  collection: MutableCollection,
  raw: Record<string, unknown>,
  id: string,
  now: string,
  existing?: Record<string, unknown>,
) {
  const parsed = itemSchemas[collection].safeParse(raw);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Некорректные данные", 400);
  }

  const item: Record<string, unknown> = { ...(existing ?? {}), ...parsed.data, id };

  if (collection === "menu") {
    const parentId = (item.parentId as string | null) ?? null;
    item.parentId = parentId;
    if (parentId === id) {
      throw new AppError("Пункт не может быть родителем сам себе", 400);
    }
    if (parentId) {
      const store = await readStore();
      if (!store.menu.some((node) => node.id === parentId)) {
        throw new AppError("Родительский пункт не найден", 400);
      }
      if (existing && descendantIds(store.menu, id).has(parentId)) {
        throw new AppError("Нельзя перенести пункт внутрь собственного подраздела", 400);
      }
    }
    assertMenuTranslations(item, existing);
  }

  if (collection === "news" || collection === "media" || collection === "requests") {
    item.createdAt = (existing?.createdAt as string | undefined) ?? now;
  }
  if (
    collection === "news" ||
    collection === "pages" ||
    collection === "settings" ||
    collection === "management" ||
    collection === "partners" ||
    isLandingCollection(collection) ||
    collection === "issuers" ||
    collection === "listing"
  ) {
    item.updatedAt = now;
  }
  if (collection === "landingSections") {
    const store = await readStore();
    if (store.landingSections.some((row) => row.id !== id && row.page === item.page && row.key === item.key)) {
      throw new AppError(`Блок «${item.key}» на этой странице уже есть`, 400);
    }
  }
  if (collection === "partners") {
    const store = await readStore();
    if (store.partners.some((row) => row.id !== id && row.slug === item.slug)) {
      throw new AppError(`Партнёр с адресом «${item.slug}» уже есть`, 400);
    }
  }
  if (collection === "issuers") {
    const store = await readStore();
    const slug = String(item.slug).toLowerCase();
    if (store.issuers.some((row) => row.id !== id && row.slug.toLowerCase() === slug)) {
      throw new AppError(`Эмитент со slug «${item.slug}» уже есть`, 400);
    }
  }
  if (collection === "listing") {
    const store = await readStore();
    const code = String(item.code).toUpperCase();
    if (store.listing.some((row) => row.id !== id && row.code.toUpperCase() === code)) {
      throw new AppError(`Бумага с кодом «${item.code}» уже есть в листинге`, 400);
    }
  }
  // issuer_slug — внешний ключ на issuers.slug: ссылку в никуда база не примет.
  if ((collection === "listing" || collection === "news" || collection === "sustainableBonds") && item.issuerSlug) {
    const store = await readStore();
    if (!store.issuers.some((row) => row.slug === item.issuerSlug)) {
      throw new AppError(`Эмитент со slug «${item.issuerSlug}» не найден`, 400);
    }
  }
  if (collection === "settings") {
    item.id = "site";
  }
  if ((collection === "news" || collection === "pages") && typeof item.body === "string") {
    item.body = sanitizeRichHtml(item.body);
  }
  if (
    collection === "news" ||
    collection === "pages" ||
    collection === "slides" ||
    collection === "menu" ||
    collection === "hubs" ||
    collection === "management" ||
    collection === "partners" ||
    isLandingCollection(collection) ||
    collection === "settings"
  ) {
    const htmlFields = collection === "news" || collection === "pages" ? ["body"] : [];
    item.i18n = sanitizeI18n(item.i18n, htmlFields);
  }

  return item;
}

export async function getAdminData() {
  return sanitizeStore(await readStore());
}

/**
 * Правка из админки — одна транзакция: запись, связанные записи и журнал аудита сохраняются вместе или никак.
 * Файлы с диска удаляются только после фиксации: откат базы их бы не вернул.
 * Любая правка сразу сбрасывает кеш публичного контента.
 */
export async function mutateCollection(session: AdminSession, body: unknown) {
  try {
    const removedFiles: string[] = [];
    await inTransaction(() => applyMutation(session, body, removedFiles));
    for (const url of removedFiles) await removeUploadedFile(url);
    return sanitizeStore(await readFullStore());
  } finally {
    invalidatePublicContent();
  }
}

async function applyMutation(session: AdminSession, body: unknown, removedFiles: string[]) {
  const parsed = mutateSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Некорректный запрос", 400);
  }

  const { op, collection, id } = parsed.data;
  const rawItem = (parsed.data.item ?? {}) as Record<string, unknown>;

  if (collection === "users" && session.role !== "admin") {
    throw new AppError("Только администратор может управлять пользователями", 403);
  }
  // Эмитенты и бумаги листинга добавляются только через внешний API (modules/issuers-sync), не из админки.
  // Записи медиатеки появляются только при загрузке файла (/api/admin/upload): иначе можно завести запись
  // с адресом чужого файла и, удалив её, стереть этот файл с диска.
  if (collection === "media" && op === "create") {
    throw new AppError("Файлы добавляются загрузкой, а не созданием записи", 400);
  }
  if ((collection === "issuers" || collection === "listing") && op === "create") {
    throw new AppError("Эмитенты и листинг добавляются через API (ISSUERS_API_URL / LISTING_API_URL в .env)", 400);
  }
  if (collection === "users" && op === "create" && !String(rawItem.password ?? "")) {
    throw new AppError("Укажите пароль", 400);
  }

  const now = new Date().toISOString();

  if (op === "create") {
    if (collection === "settings") {
      const existing = await findItem("settings", "site");
      if (existing) {
        const item = await prepareItem(collection, { ...existing, ...rawItem }, "site", now, existing);
        await updateItem(collection, "site", item);
        await insertAudit({
          action: "update",
          entity: collection,
          detail: auditDetail(item),
          actor: session.email,
        });
        return;
      }
    }
    const item = await prepareItem(collection, rawItem, crypto.randomUUID(), now);
    if (collection === "users" && item.password) {
      item.password = await hashPassword(String(item.password));
    }
    await createItem(collection, item);
    await insertAudit({
      action: "create",
      entity: collection,
      detail: auditDetail(item),
      actor: session.email,
    });
  } else if (op === "update") {
    if (!id) throw new AppError("Некорректный запрос", 400);
    const existing = await findItem(collection, id);
    if (!existing) throw new Error("not-found");

    const item = await prepareItem(collection, { ...existing, ...rawItem }, id, now, existing);
    // У файла можно сменить только название: адрес привязан к загруженному файлу (см. выше про чужие файлы).
    if (collection === "media") item.url = existing.url;
    if (collection === "users") {
      if (rawItem.password) {
        item.password = await hashPassword(String(rawItem.password));
      } else {
        item.password = existing.password;
      }
    }
    // Смена slug эмитента сама переносится в listing и news: внешний ключ ON UPDATE CASCADE.
    await updateItem(collection, id, item);
    await insertAudit({
      action: "update",
      entity: collection,
      detail: auditDetail(item),
      actor: session.email,
    });
  } else if (op === "delete") {
    if (!id) throw new AppError("Некорректный запрос", 400);
    if (collection === "settings") {
      throw new AppError("Настройки сайта нельзя удалить", 400);
    }
    const existing = await findItem(collection, id);
    if (!existing) throw new Error("not-found");
    if (collection === "media" && existing.url) {
      await detachMediaUrl(String(existing.url));
      removedFiles.push(String(existing.url));
    }
    if (collection === "menu") {
      const store = await readStore();
      const blocked = descendantIds(store.menu, id);
      for (const childId of [...blocked].reverse()) {
        await deleteItem("menu", childId);
      }
    } else {
      await deleteItem(collection, id);
    }
    await insertAudit({
      action: "delete",
      entity: collection,
      detail: auditDetail(existing),
      actor: session.email,
    });
  }
}

export function getPublicContent() {
  return cachedPublic(loadPublicContent);
}

async function loadPublicContent() {
  const store = await readPublicStore();
  return {
    news: publishedNews(store),
    slides: orderedSlides(store),
    media: store.media,
    pages: store.pages.filter((item) => item.status === "published"),
    menu: [...store.menu].sort((a, b) => a.order - b.order),
    hubs: orderedHubs(store),
    management: publishedManagement(store),
    partners: publishedPartners(store),
    sustainableBonds: publishedOrdered(store.sustainableBonds),
    esgReports: publishedOrdered(store.esgReports),
    verifiers: publishedOrdered(store.verifiers),
    gcbParticipants: publishedOrdered(store.gcbParticipants),
    landingSections: [...store.landingSections].sort((a, b) => a.order - b.order),
    settings: store.settings[0] ?? defaultSiteSettings,
  };
}

export function getIssuerData() {
  return readIssuerData();
}

export async function createRequest(source: string, payload: Record<string, string>) {
  const clean = Object.fromEntries(
    Object.entries(payload)
      .slice(0, 12)
      .map(([key, value]) => [key.slice(0, 40), String(value).slice(0, 2000)]),
  );

  const trimmedSource = source.slice(0, 80);
  // В журнал аудита публичные заявки не пишем: он для действий сотрудников.
  await insertRequest(trimmedSource, clean);
  // Не ждём доставки: посетитель получает ответ сразу, сбой отправки только пишется в лог.
  void notifyNewRequest(trimmedSource, clean);
}

