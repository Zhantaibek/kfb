import {
  createItem,
  deleteItem,
  findItem,
  insertAudit,
  insertRequest,
  insertVisit,
  readFullStore,
  readIssuerData,
  updateItem,
} from "../../db/repositories/cms.repository";
import {
  auditDetail,
  orderedHubs,
  orderedSlides,
  publishedManagement,
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
import { purgeMediaRecord } from "../media/media.service";

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
    collection === "issuers" ||
    collection === "listing"
  ) {
    item.updatedAt = now;
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
  if ((collection === "listing" || collection === "news") && item.issuerSlug) {
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

export async function mutateCollection(
  session: AdminSession,
  body: unknown,
) {
  const parsed = mutateSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Некорректный запрос", 400);
  }

  const { op, collection, id } = parsed.data;
  const rawItem = (parsed.data.item ?? {}) as Record<string, unknown>;

  if (collection === "users" && session.role !== "admin") {
    throw new AppError("Только администратор может управлять пользователями", 403);
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
        return sanitizeStore(await readFullStore());
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
    if (collection === "media") {
      await purgeMediaRecord(existing);
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

  return sanitizeStore(await readFullStore());
}

export async function getPublicContent() {
  const store = await readFullStore();
  return {
    news: publishedNews(store),
    slides: orderedSlides(store),
    media: store.media,
    pages: store.pages.filter((item) => item.status === "published"),
    menu: [...store.menu].sort((a, b) => a.order - b.order),
    hubs: orderedHubs(store),
    management: publishedManagement(store),
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
  await insertRequest(trimmedSource, clean);
  await insertAudit({ action: "create", entity: "requests", detail: trimmedSource, actor: "public" });
}

export async function trackVisit(page: string) {
  if (page.startsWith("/admin") || page.startsWith("/api")) return;
  await insertVisit(page.slice(0, 180));
}
