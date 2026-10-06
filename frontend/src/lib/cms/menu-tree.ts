import type { CmsMenuItem } from "@/lib/cms/types";
import type { SiteLink, SiteNavGroup } from "@/data/site-nav";

export function menuToSiteNav(items: CmsMenuItem[]): SiteNavGroup[] {
  const header = items.filter((item) => item.group === "header" || !item.group);
  const byParent = new Map<string, CmsMenuItem[]>();

  for (const item of header) {
    const key = item.parentId || "";
    const list = byParent.get(key) ?? [];
    list.push(item);
    byParent.set(key, list);
  }

  for (const list of byParent.values()) {
    list.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, "ru"));
  }

  function links(parentId: string): SiteLink[] {
    return (byParent.get(parentId) ?? []).map((item) => {
      const children = links(item.id);
      return children.length ? { href: item.href, label: item.label, children } : { href: item.href, label: item.label };
    });
  }

  return (byParent.get("") ?? []).map((item) => ({
    key: item.id,
    label: item.label,
    href: item.href,
    items: links(item.id),
  }));
}

export function menuToFooterColumns(items: CmsMenuItem[]) {
  return menuToSiteNav(items)
    .slice(0, 3)
    .map((group) => ({
      title: group.label,
      links: flattenNavLinks(group.items).slice(0, 4),
    }));
}

function flattenNavLinks(items: SiteLink[]): [string, string][] {
  const out: [string, string][] = [];
  for (const item of items) {
    if (item.children?.length) {
      for (const child of item.children) out.push([child.href, child.label]);
    } else {
      out.push([item.href, item.label]);
    }
  }
  return out;
}

export function menuTreeRows(items: CmsMenuItem[]) {
  const byParent = new Map<string, CmsMenuItem[]>();
  for (const item of items) {
    const key = item.parentId || "";
    const list = byParent.get(key) ?? [];
    list.push(item);
    byParent.set(key, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, "ru"));
  }

  const rows: { item: CmsMenuItem; depth: number }[] = [];
  function walk(parentId: string, depth: number) {
    for (const item of byParent.get(parentId) ?? []) {
      rows.push({ item, depth });
      walk(item.id, depth + 1);
    }
  }
  walk("", 0);
  return rows;
}

/** Строка навигации шапки — пункты группы «primary» по порядку. */
export function menuToPrimaryNav(items: CmsMenuItem[]): SiteLink[] {
  return items
    .filter((item) => item.group === "primary" && !item.parentId)
    .sort((a, b) => a.order - b.order)
    .map((item) => ({ href: item.href, label: item.label }));
}

/** Колонки футера из группы «footer»: верхний уровень — заголовок, дети — ссылки. */
export function menuToFooterNav(items: CmsMenuItem[]) {
  const footer = items.filter((item) => item.group === "footer");
  const byOrder = (a: CmsMenuItem, b: CmsMenuItem) => a.order - b.order;
  return footer
    .filter((item) => !item.parentId)
    .sort(byOrder)
    .map((column) => ({
      title: column.label,
      links: footer
        .filter((item) => item.parentId === column.id)
        .sort(byOrder)
        .map((item): [string, string] => [item.href, item.label]),
    }));
}

/** Плоский список ссылок одной группы меню (кнопки и ссылки футера). */
export function menuGroupLinks(items: CmsMenuItem[], group: string): SiteLink[] {
  return items
    .filter((item) => item.group === group && !item.parentId)
    .sort((a, b) => a.order - b.order)
    .map((item) => ({ href: item.href, label: item.label }));
}
