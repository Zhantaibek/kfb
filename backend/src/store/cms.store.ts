import { initDb } from "../db/postgres";
import { readFullStore } from "../db/repositories/cms.repository";
import type { CmsStore } from "../../../shared/cms";

let ready: Promise<void> | null = null;

function ensureDb() {
  ready ??= initDb();
  return ready;
}

function cloneStore(store: CmsStore): CmsStore {
  return JSON.parse(JSON.stringify(store)) as CmsStore;
}

export async function readStore(): Promise<CmsStore> {
  await ensureDb();
  return cloneStore(await readFullStore());
}

export function publicUsers(store: CmsStore) {
  return store.users.map(({ password: _password, ...user }) => user);
}

export function publishedNews(store: CmsStore) {
  return [...store.news]
    .filter((item) => item.status === "published")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function orderedSlides(store: CmsStore) {
  return [...store.slides].sort((a, b) => a.order - b.order);
}

export function orderedHubs(store: CmsStore) {
  return [...store.hubs].sort((a, b) => a.order - b.order);
}

export function publishedManagement(store: CmsStore) {
  return [...store.management]
    .filter((item) => item.status === "published")
    .sort((a, b) => a.order - b.order);
}

export function sanitizeStore(store: CmsStore) {
  return { ...store, users: publicUsers(store) };
}

function detailFrom(item: Record<string, unknown>) {
  return String(item.title ?? item.name ?? item.label ?? item.email ?? item.id ?? "");
}

export function auditDetail(item: Record<string, unknown>) {
  return detailFrom(item);
}
