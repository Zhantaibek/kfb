import { resourceProfiles } from "@/data/resources";
import type { CmsPartner } from "@/lib/cms/types";

/** Поля партнёра, которые переводятся на ky/en (обозначение и сайт — общие). */
export const partnerFields = ["kind", "caption", "name", "lead", "body"] as const;

const legacyLogos: Record<string, [string, boolean]> = {
  gfr: ["/partners/gfr.png", false],
  gaugi: ["/partners/gaugi.png", false],
  mab: ["/partners/mab.svg", false],
  nbkr: ["/partners/nbkr.png", false],
  kase: ["/partners/kase.svg", true],
  bist: ["/partners/bist.png", true],
  rkfr: ["/partners/rkfr.png", false],
  cd: ["/partners/cd.png", true],
};

/** Запасной список, если API недоступен: прежние карточки из data/resources.ts. */
export const fallbackPartners: CmsPartner[] = resourceProfiles.map((item, index) => ({
  id: `partner-${item.slug}`,
  slug: item.slug,
  mark: item.mark,
  kind: item.kind,
  caption: item.caption,
  name: item.name,
  lead: item.lead,
  body: item.body.join("\n\n"),
  site: item.site,
  logo: legacyLogos[item.slug]?.[0] ?? "",
  logoWide: legacyLogos[item.slug]?.[1] ?? false,
  order: index + 1,
  status: "published",
  updatedAt: "",
}));

/** Партнёры из админки; пусто (API недоступен) — запасной список. */
export function partnersOrFallback(list: CmsPartner[] | undefined) {
  return list?.length ? list : fallbackPartners;
}

/** Текст страницы партнёра: абзацы — через пустую строку. */
export function paragraphs(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}
