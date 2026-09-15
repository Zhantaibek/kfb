import { slugify } from "@/lib/cms/slug";
import type { CmsMenuItem } from "@/lib/cms/types";

export function suggestedMenuHref(menu: CmsMenuItem[], parentId: string | null, label: string) {
  const slug = slugify(label);
  if (!parentId) return slug ? `/p/${slug}` : "";
  const parent = menu.find((item) => item.id === parentId);
  const parentHref = parent?.href?.trim() ?? "";
  if (parentHref && parentHref !== "/" && !/^https?:\/\//i.test(parentHref)) {
    return `${parentHref.replace(/\/$/, "")}/${slug}`;
  }
  const root = parent?.parentId ? menu.find((item) => item.id === parent.parentId) : undefined;
  const rootHref = root?.href?.trim() ?? "";
  if (rootHref && rootHref !== "/" && !/^https?:\/\//i.test(rootHref)) {
    return `${rootHref.replace(/\/$/, "")}/${slug}`;
  }
  return `/p/${slug}`;
}

export function resolveMenuHref(menu: CmsMenuItem[], parentId: string | null, label: string, href: string) {
  const trimmed = href.trim();
  if (trimmed && trimmed !== "/") return trimmed;
  return suggestedMenuHref(menu, parentId, label);
}
