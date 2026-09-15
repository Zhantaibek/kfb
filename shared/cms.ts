export type NewsKind = "exchange" | "company" | "urgent";
export type PublishStatus = "draft" | "published";
export type AdminRole = "admin" | "editor";
export type PublicRole = "investor" | "issuer";
export type UserRole = AdminRole | PublicRole;
export type RequestStatus = "new" | "done";
export type LocaleCode = "ky" | "en";
export type CmsI18n = Partial<Record<LocaleCode, Record<string, string>>>;

export function parseI18n(value: unknown): CmsI18n {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const src = value as Record<string, unknown>;
  const out: CmsI18n = {};
  for (const lang of ["ky", "en"] as const) {
    const pack = src[lang];
    if (!pack || typeof pack !== "object" || Array.isArray(pack)) continue;
    const fields: Record<string, string> = {};
    for (const [key, val] of Object.entries(pack as Record<string, unknown>)) {
      if (typeof val === "string") fields[key] = val;
    }
    if (Object.keys(fields).length) out[lang] = fields;
  }
  return out;
}

export function isStaffRole(role: string): role is AdminRole {
  return role === "admin" || role === "editor";
}

export function isPublicRole(role: string): role is PublicRole {
  return role === "investor" || role === "issuer";
}

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

export function parseCareer(value: unknown): CmsCareerRow[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    const org = typeof row.org === "string" ? row.org : "";
    const role = typeof row.role === "string" ? row.role : "";
    const period = typeof row.period === "string" ? row.period : "";
    if (!org && !role && !period) return [];
    return [{ org, role, period }];
  });
}

export function paragraphs(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

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
  settings: CmsSiteSettings[];
  requests: CmsRequest[];
  users: CmsUser[];
  visits: CmsVisit[];
  audit: CmsAudit[];
};

export type CmsCollection = keyof CmsStore;

export type AuthSession = { id: string; email: string; name: string; role: UserRole };
export type AdminSession = { id: string; email: string; name: string; role: AdminRole };

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
