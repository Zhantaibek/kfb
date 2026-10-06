import type {
  Audit,
  HomeHub,
  Issuer,
  ListingEntry,
  ManagementPerson,
  Media,
  MenuItem,
  News,
  Page,
  Request,
  SiteSettings,
  Slide,
  User,
  Visit,
} from "@prisma/client";
import type {
  CmsAudit,
  CmsHomeHub,
  CmsIssuer,
  CmsListingEntry,
  CmsManagementPerson,
  CmsMedia,
  CmsMenuItem,
  CmsNews,
  CmsPage,
  CmsRequest,
  CmsSiteSettings,
  CmsSlide,
  CmsUser,
  CmsVisit,
} from "../../../shared/cms";
import { listingCategoryIds, parseCareer, parseI18n, parseListingDocuments } from "../../../shared/cms";
import { decodeUploadName } from "../utils/upload-name";

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function toCmsNews(row: News): CmsNews {
  return {
    id: row.id,
    slug: row.slug,
    date: row.date,
    tag: row.tag,
    kind: row.kind as CmsNews["kind"],
    status: row.status as CmsNews["status"],
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    photo: row.photo,
    issuerSlug: row.issuerSlug ?? "",
    i18n: parseI18n(row.i18n),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toCmsManagementPerson(row: ManagementPerson): CmsManagementPerson {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    role: row.role,
    group: row.groupId as CmsManagementPerson["group"],
    photo: row.photo,
    bio: row.bio,
    education: row.education,
    career: parseCareer(row.career),
    order: row.sortOrder,
    status: row.status as CmsManagementPerson["status"],
    i18n: parseI18n(row.i18n),
    updatedAt: iso(row.updatedAt),
  };
}

export function toCmsIssuer(row: Issuer): CmsIssuer {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    activity: row.activity,
    director: row.director,
    position: row.position,
    address: row.address,
    phone: row.phone,
    registrar: row.registrar,
    security: row.security,
    count: row.count,
    price: row.price,
    status: row.status,
    order: row.sortOrder,
    updatedAt: iso(row.updatedAt),
  };
}

export function toCmsListingEntry(row: ListingEntry): CmsListingEntry {
  const category = (listingCategoryIds as readonly string[]).includes(row.category) ? row.category : "C";
  return {
    id: row.id,
    code: row.code,
    category: category as CmsListingEntry["category"],
    order: row.sortOrder,
    name: row.name,
    issuerSlug: row.issuerSlug ?? "",
    security: row.security,
    price: row.price,
    cap: row.cap,
    count: row.count,
    doc: row.doc,
    symbols: row.symbols,
    industry: row.industry,
    activity: row.activity,
    listedAt: row.listedAt,
    auditor: row.auditor,
    registrar: row.registrar,
    marketMaker: row.marketMaker,
    documents: parseListingDocuments(row.documents),
    updatedAt: iso(row.updatedAt),
  };
}

export function toCmsSlide(row: Slide): CmsSlide {
  return {
    id: row.id,
    title: row.title,
    text: row.text,
    href: row.href,
    value: row.value,
    photo: row.photo,
    order: row.sortOrder,
    i18n: parseI18n(row.i18n),
  };
}

export function toCmsMedia(row: Media): CmsMedia {
  return {
    id: row.id,
    name: decodeUploadName(row.name),
    url: row.url,
    createdAt: iso(row.createdAt),
  };
}

export function toCmsPage(row: Page): CmsPage {
  return {
    id: row.id,
    path: row.path,
    title: row.title,
    lead: row.lead,
    body: row.body,
    status: row.status as CmsPage["status"],
    i18n: parseI18n(row.i18n),
    updatedAt: iso(row.updatedAt),
  };
}

export function toCmsMenuItem(row: MenuItem): CmsMenuItem {
  return {
    id: row.id,
    label: row.label,
    href: row.href,
    group: row.menuGroup,
    order: row.sortOrder,
    parentId: row.parentId,
    i18n: parseI18n(row.i18n),
  };
}

export function toCmsSiteSettings(row: SiteSettings): CmsSiteSettings {
  return {
    id: row.id,
    tagline: row.tagline,
    address: row.address,
    phones: row.phones,
    emails: row.emails,
    fax: row.fax,
    license: row.license,
    copyright: row.copyright,
    eduUrl: row.eduUrl,
    disclosurePhone: row.disclosurePhone,
    eduPhone: row.eduPhone,
    i18n: parseI18n(row.i18n),
    updatedAt: iso(row.updatedAt),
  };
}

export function toCmsHomeHub(row: HomeHub): CmsHomeHub {
  return {
    id: row.id,
    href: row.href,
    title: row.title,
    text: row.text,
    photo: row.photo,
    order: row.sortOrder,
    i18n: parseI18n(row.i18n),
  };
}

export function toCmsRequest(row: Request): CmsRequest {
  return {
    id: row.id,
    source: row.source,
    payload: (row.payload as Record<string, string>) ?? {},
    status: row.status as CmsRequest["status"],
    createdAt: iso(row.createdAt),
  };
}

export function toCmsUser(row: User): CmsUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as CmsUser["role"],
    password: row.password,
  };
}

export function toCmsVisit(row: Visit): CmsVisit {
  return {
    id: row.id,
    path: row.path,
    at: iso(row.at),
  };
}

export function toCmsAudit(row: Audit): CmsAudit {
  return {
    id: row.id,
    action: row.action,
    entity: row.entity,
    detail: row.detail,
    actor: row.actor,
    at: iso(row.at),
  };
}
