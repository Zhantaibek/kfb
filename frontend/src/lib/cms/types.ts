export type NewsKind = "exchange" | "company" | "urgent";
export type PublishStatus = "draft" | "published";
export type AdminRole = "admin" | "editor";
export type PublicRole = "investor" | "issuer";
export type UserRole = AdminRole | PublicRole;
export type RequestStatus = "new" | "done";
export type LocaleCode = "ky" | "en";
export type CmsI18n = Partial<Record<LocaleCode, Record<string, string>>>;

export type CmsNews = {
  id: string;
  slug: string;
  date: string;
  tag: string;
  kind: NewsKind;
  status: PublishStatus;
  title: string;
  excerpt: string;
  body: string;
  photo: string;
  issuerSlug: string;
  i18n?: CmsI18n;
  createdAt: string;
  updatedAt: string;
};

export function isGeneralNews(item: Pick<CmsNews, "kind">) {
  return item.kind !== "company";
}

export function newsForIssuer(items: CmsNews[], issuerSlug: string) {
  const key = issuerSlug.toLowerCase();
  return items.filter((item) => item.kind === "company" && (item.issuerSlug ?? "").toLowerCase() === key);
}

export type CmsSlide = {
  id: string;
  title: string;
  text: string;
  href: string;
  value: string;
  photo: string;
  order: number;
  i18n?: CmsI18n;
};

export type CmsMedia = {
  id: string;
  name: string;
  url: string;
  createdAt: string;
};

export type CmsPage = {
  id: string;
  path: string;
  title: string;
  lead: string;
  body: string;
  status: PublishStatus;
  i18n?: CmsI18n;
  updatedAt: string;
};

export type CmsCareerRow = { org: string; role: string; period: string };

export const managementGroupIds = ["board", "executive"] as const;
export type ManagementGroupId = (typeof managementGroupIds)[number];

export type CmsManagementPerson = {
  id: string;
  slug: string;
  name: string;
  role: string;
  group: ManagementGroupId;
  photo: string;
  bio: string;
  education: string;
  career: CmsCareerRow[];
  order: number;
  status: PublishStatus;
  i18n?: CmsI18n;
  updatedAt: string;
};

export const managementGroupTitles: Record<ManagementGroupId, string> = {
  board: "Совет директоров",
  executive: "Исполнительный орган",
};

export function paragraphs(text: string): string[] {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function managementByGroup(items: CmsManagementPerson[], group: ManagementGroupId) {
  return items.filter((item) => item.group === group).sort((a, b) => a.order - b.order);
}

/** Эмитент в Центре раскрытия информации (/disclosure/<slug>). */
export type CmsIssuer = {
  id: string;
  slug: string;
  name: string;
  activity: string;
  director: string;
  position: string;
  address: string;
  phone: string;
  registrar: string;
  security: string;
  count: string;
  price: string;
  /** Статус профиля, как на oi.kse.kg: «Активен» и т.п. */
  status: string;
  order: number;
  updatedAt: string;
};

export const listingCategoryIds = ["A", "B", "C", "delisted"] as const;
export type ListingCategoryId = (typeof listingCategoryIds)[number];

export const listingCategoryTitles: Record<ListingCategoryId, string> = {
  A: "Категория A",
  B: "Категория B",
  C: "Категория C",
  delisted: "Временный делистинг",
};

export type CmsListingDocument = { name: string; url: string };

/** Бумага официального списка КФБ (/listing) вместе с карточкой листинга. */
export type CmsListingEntry = {
  id: string;
  /** Код бумаги в системе КФБ, например MAIR4 */
  code: string;
  category: ListingCategoryId;
  order: number;
  name: string;
  /** slug эмитента в Центре раскрытия информации, если он есть */
  issuerSlug: string;
  security: string;
  price: string;
  cap: string;
  count: string;
  /** Ссылка на анкету/проспект эмитента */
  doc: string;
  /** Торговые символы всех выпусков эмитента */
  symbols: string;
  industry: string;
  activity: string;
  /** Дата прохождения листинга, ГГГГ-ММ-ДД */
  listedAt: string;
  auditor: string;
  registrar: string;
  marketMaker: string;
  documents: CmsListingDocument[];
  updatedAt: string;
};

export function parseListingDocuments(value: unknown): CmsListingDocument[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    const name = typeof row.name === "string" ? row.name : "";
    const url = typeof row.url === "string" ? row.url : "";
    return name || url ? [{ name, url }] : [];
  });
}

/** Публичные данные эмитентов: отдельный запрос, чтобы не утяжелять общий контент сайта. */
export type IssuerData = {
  issuers: CmsIssuer[];
  listing: CmsListingEntry[];
};

export type CmsMenuItem = {
  id: string;
  label: string;
  href: string;
  group: string;
  order: number;
  parentId: string | null;
  i18n?: CmsI18n;
};

export type CmsSiteSettings = {
  id: string;
  tagline: string;
  address: string;
  phones: string;
  emails: string;
  fax: string;
  license: string;
  copyright: string;
  eduUrl: string;
  disclosurePhone: string;
  eduPhone: string;
  i18n?: CmsI18n;
  updatedAt: string;
};

export type CmsHomeHub = {
  id: string;
  href: string;
  title: string;
  text: string;
  photo: string;
  order: number;
  i18n?: CmsI18n;
};

export type CmsRequest = {
  id: string;
  source: string;
  payload: Record<string, string>;
  status: RequestStatus;
  createdAt: string;
};

export type CmsUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
};

export type CmsVisit = {
  id: string;
  path: string;
  at: string;
};

export type CmsAudit = {
  id: string;
  action: string;
  entity: string;
  detail: string;
  actor: string;
  at: string;
};

export type CmsStore = {
  news: CmsNews[];
  slides: CmsSlide[];
  media: CmsMedia[];
  pages: CmsPage[];
  menu: CmsMenuItem[];
  hubs: CmsHomeHub[];
  management: CmsManagementPerson[];
  issuers: CmsIssuer[];
  listing: CmsListingEntry[];
  settings: CmsSiteSettings[];
  requests: CmsRequest[];
  users: CmsUser[];
  visits: CmsVisit[];
  audit: CmsAudit[];
};

export type CmsCollection = keyof CmsStore;

export type PublicContent = {
  news: CmsNews[];
  slides: CmsSlide[];
  media: CmsMedia[];
  pages: CmsPage[];
  menu: CmsMenuItem[];
  hubs: CmsHomeHub[];
  management: CmsManagementPerson[];
  settings: CmsSiteSettings;
};
