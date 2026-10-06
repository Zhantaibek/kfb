import type {
  CmsAudit,
  CmsCollection,
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
  CmsStore,
  CmsUser,
} from "../../../../shared/cms";
import { prisma } from "../prisma";
import {
  toCmsAudit,
  toCmsHomeHub,
  toCmsIssuer,
  toCmsListingEntry,
  toCmsManagementPerson,
  toCmsMedia,
  toCmsMenuItem,
  toCmsNews,
  toCmsPage,
  toCmsRequest,
  toCmsSiteSettings,
  toCmsSlide,
  toCmsUser,
  toCmsVisit,
} from "../mappers";

export async function readFullStore(): Promise<CmsStore> {
  const [news, slides, media, pages, menu, hubs, management, issuers, listing, settings, requests, users, visits, audit] =
    await Promise.all([
    prisma.news.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.slide.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.media.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.page.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.menuItem.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.homeHub.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.managementPerson.findMany({ orderBy: [{ groupId: "asc" }, { sortOrder: "asc" }] }),
    prisma.issuer.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.listingEntry.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
    prisma.siteSettings.findMany(),
    prisma.request.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.visit.findMany({ orderBy: { at: "desc" }, take: 300 }),
    prisma.audit.findMany({ orderBy: { at: "desc" }, take: 200 }),
  ]);

  return {
    news: news.map(toCmsNews),
    slides: slides.map(toCmsSlide),
    media: media.map(toCmsMedia),
    pages: pages.map(toCmsPage),
    menu: menu.map(toCmsMenuItem),
    hubs: hubs.map(toCmsHomeHub),
    management: management.map(toCmsManagementPerson),
    issuers: issuers.map(toCmsIssuer),
    listing: listing.map(toCmsListingEntry),
    settings: settings.map(toCmsSiteSettings),
    requests: requests.map(toCmsRequest),
    users: users.map(toCmsUser),
    visits: visits.map(toCmsVisit),
    audit: audit.map(toCmsAudit),
  };
}

export async function findUserByEmail(email: string): Promise<CmsUser | null> {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
  });
  return user ? toCmsUser(user) : null;
}

export async function updateUserPassword(id: string, password: string) {
  await prisma.user.update({ where: { id }, data: { password } });
}

export async function insertUser(user: CmsUser) {
  await prisma.user.create({
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      password: user.password,
    },
  });
}

async function trimAudit() {
  const keep = await prisma.audit.findMany({
    orderBy: { at: "desc" },
    take: 200,
    select: { id: true },
  });
  const ids = keep.map((row) => row.id);
  if (ids.length === 0) return;
  await prisma.audit.deleteMany({ where: { id: { notIn: ids } } });
}

export async function insertAudit(entry: Omit<CmsAudit, "id" | "at">) {
  await prisma.audit.create({
    data: {
      id: crypto.randomUUID(),
      action: entry.action,
      entity: entry.entity,
      detail: entry.detail,
      actor: entry.actor,
      at: new Date(),
    },
  });
  await trimAudit();
}

async function trimVisits() {
  const keep = await prisma.visit.findMany({
    orderBy: { at: "desc" },
    take: 300,
    select: { id: true },
  });
  const ids = keep.map((row) => row.id);
  if (ids.length === 0) return;
  await prisma.visit.deleteMany({ where: { id: { notIn: ids } } });
}

export async function insertVisit(path: string) {
  await prisma.visit.create({
    data: { id: crypto.randomUUID(), path, at: new Date() },
  });
  await trimVisits();
}

async function trimRequests() {
  const keep = await prisma.request.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true },
  });
  const ids = keep.map((row) => row.id);
  if (ids.length === 0) return;
  await prisma.request.deleteMany({ where: { id: { notIn: ids } } });
}

export async function insertRequest(source: string, payload: Record<string, string>) {
  await prisma.request.create({
    data: {
      id: crypto.randomUUID(),
      source,
      payload,
      status: "new",
      createdAt: new Date(),
    },
  });
  await trimRequests();
}

export async function insertMedia(media: CmsMedia) {
  await prisma.media.create({
    data: {
      id: media.id,
      name: media.name,
      url: media.url,
      createdAt: new Date(media.createdAt),
    },
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripUrlFromHtml(html: string, url: string) {
  const escaped = escapeRegExp(url);
  return html
    .replace(new RegExp(`<figure[^>]*>[\\s\\S]*?<img[^>]*src="${escaped}"[^>]*>[\\s\\S]*?</figure>`, "gi"), "")
    .replace(new RegExp(`<img[^>]*src="${escaped}"[^>]*>`, "gi"), "");
}

export async function detachMediaUrl(url: string) {
  await prisma.news.updateMany({ where: { photo: url }, data: { photo: "" } });
  await prisma.slide.updateMany({ where: { photo: url }, data: { photo: "" } });
  await prisma.homeHub.updateMany({ where: { photo: url }, data: { photo: "" } });
  await prisma.managementPerson.updateMany({ where: { photo: url }, data: { photo: "" } });

  const news = await prisma.news.findMany({ where: { body: { contains: url } }, select: { id: true, body: true } });
  for (const row of news) {
    const body = stripUrlFromHtml(row.body, url);
    if (body !== row.body) await prisma.news.update({ where: { id: row.id }, data: { body } });
  }

  const pages = await prisma.page.findMany({ where: { body: { contains: url } }, select: { id: true, body: true } });
  for (const row of pages) {
    const body = stripUrlFromHtml(row.body, url);
    if (body !== row.body) await prisma.page.update({ where: { id: row.id }, data: { body } });
  }
}

export async function readIssuerData() {
  const [issuers, listing] = await Promise.all([
    prisma.issuer.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.listingEntry.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
  ]);
  return { issuers: issuers.map(toCmsIssuer), listing: listing.map(toCmsListingEntry) };
}

type MutableCollection = Exclude<CmsCollection, "audit" | "visits">;

export async function createItem(collection: MutableCollection, item: Record<string, unknown>) {
  switch (collection) {
    case "news": {
      const row = item as unknown as CmsNews;
      await prisma.news.create({
        data: {
          id: row.id,
          slug: row.slug,
          date: row.date,
          tag: row.tag,
          kind: row.kind,
          status: row.status,
          title: row.title,
          excerpt: row.excerpt,
          body: row.body,
          photo: row.photo,
          issuerSlug: row.issuerSlug || null,
          i18n: row.i18n ?? {},
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        },
      });
      break;
    }
    case "slides": {
      const row = item as unknown as CmsSlide;
      await prisma.slide.create({
        data: {
          id: row.id,
          title: row.title,
          text: row.text,
          href: row.href,
          value: row.value,
          photo: row.photo,
          sortOrder: row.order,
          i18n: row.i18n ?? {},
        },
      });
      break;
    }
    case "management": {
      const row = item as unknown as CmsManagementPerson;
      await prisma.managementPerson.create({
        data: {
          id: row.id,
          slug: row.slug,
          name: row.name,
          role: row.role,
          groupId: row.group,
          photo: row.photo,
          bio: row.bio,
          education: row.education,
          career: row.career ?? [],
          sortOrder: row.order,
          status: row.status,
          i18n: row.i18n ?? {},
          updatedAt: new Date(row.updatedAt),
        },
      });
      break;
    }
    case "issuers": {
      const row = item as unknown as CmsIssuer;
      await prisma.issuer.create({
        data: {
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
          sortOrder: row.order,
          updatedAt: new Date(row.updatedAt),
        },
      });
      break;
    }
    case "listing": {
      const row = item as unknown as CmsListingEntry;
      await prisma.listingEntry.create({
        data: {
          id: row.id,
          code: row.code,
          category: row.category,
          sortOrder: row.order,
          name: row.name,
          issuerSlug: row.issuerSlug || null,
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
          documents: row.documents ?? [],
          updatedAt: new Date(row.updatedAt),
        },
      });
      break;
    }
    case "media":
      await insertMedia(item as unknown as CmsMedia);
      break;
    case "pages": {
      const row = item as unknown as CmsPage;
      await prisma.page.create({
        data: {
          id: row.id,
          path: row.path,
          title: row.title,
          lead: row.lead,
          body: row.body,
          status: row.status,
          i18n: row.i18n ?? {},
          updatedAt: new Date(row.updatedAt),
        },
      });
      break;
    }
    case "menu": {
      const row = item as unknown as CmsMenuItem;
      await prisma.menuItem.create({
        data: {
          id: row.id,
          label: row.label,
          href: row.href,
          menuGroup: row.group,
          sortOrder: row.order,
          parentId: row.parentId,
          i18n: row.i18n ?? {},
        },
      });
      break;
    }
    case "hubs": {
      const row = item as unknown as CmsHomeHub;
      await prisma.homeHub.create({
        data: {
          id: row.id,
          href: row.href,
          title: row.title,
          text: row.text,
          photo: row.photo,
          sortOrder: row.order,
          i18n: row.i18n ?? {},
        },
      });
      break;
    }
    case "settings": {
      const row = item as unknown as CmsSiteSettings;
      await prisma.siteSettings.create({
        data: {
          id: "site",
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
          i18n: row.i18n ?? {},
          updatedAt: new Date(row.updatedAt),
        },
      });
      break;
    }
    case "requests": {
      const row = item as unknown as CmsRequest;
      await prisma.request.create({
        data: {
          id: row.id,
          source: row.source,
          payload: row.payload,
          status: row.status,
          createdAt: new Date(row.createdAt),
        },
      });
      break;
    }
    case "users": {
      const row = item as unknown as CmsUser;
      await insertUser(row);
      break;
    }
  }
}

export async function updateItem(collection: MutableCollection, id: string, item: Record<string, unknown>) {
  try {
    switch (collection) {
    case "news": {
      const row = item as unknown as CmsNews;
      await prisma.news.update({
        where: { id },
        data: {
          slug: row.slug,
          date: row.date,
          tag: row.tag,
          kind: row.kind,
          status: row.status,
          title: row.title,
          excerpt: row.excerpt,
          body: row.body,
          photo: row.photo,
          issuerSlug: row.issuerSlug || null,
          i18n: row.i18n ?? {},
          updatedAt: new Date(row.updatedAt),
        },
      });
      break;
    }
    case "slides": {
      const row = item as unknown as CmsSlide;
      await prisma.slide.update({
        where: { id },
        data: {
          title: row.title,
          text: row.text,
          href: row.href,
          value: row.value,
          photo: row.photo,
          sortOrder: row.order,
          i18n: row.i18n ?? {},
        },
      });
      break;
    }
    case "management": {
      const row = item as unknown as CmsManagementPerson;
      await prisma.managementPerson.update({
        where: { id },
        data: {
          slug: row.slug,
          name: row.name,
          role: row.role,
          groupId: row.group,
          photo: row.photo,
          bio: row.bio,
          education: row.education,
          career: row.career ?? [],
          sortOrder: row.order,
          status: row.status,
          i18n: row.i18n ?? {},
          updatedAt: new Date(row.updatedAt),
        },
      });
      break;
    }
    case "issuers": {
      const row = item as unknown as CmsIssuer;
      await prisma.issuer.update({
        where: { id },
        data: {
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
          sortOrder: row.order,
          updatedAt: new Date(row.updatedAt),
        },
      });
      break;
    }
    case "listing": {
      const row = item as unknown as CmsListingEntry;
      await prisma.listingEntry.update({
        where: { id },
        data: {
          code: row.code,
          category: row.category,
          sortOrder: row.order,
          name: row.name,
          issuerSlug: row.issuerSlug || null,
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
          documents: row.documents ?? [],
          updatedAt: new Date(row.updatedAt),
        },
      });
      break;
    }
    case "media": {
      const row = item as unknown as CmsMedia;
      await prisma.media.update({
        where: { id },
        data: { name: row.name, url: row.url },
      });
      break;
    }
    case "pages": {
      const row = item as unknown as CmsPage;
      await prisma.page.update({
        where: { id },
        data: {
          path: row.path,
          title: row.title,
          lead: row.lead,
          body: row.body,
          status: row.status,
          i18n: row.i18n ?? {},
          updatedAt: new Date(row.updatedAt),
        },
      });
      break;
    }
    case "menu": {
      const row = item as unknown as CmsMenuItem;
      await prisma.menuItem.update({
        where: { id },
        data: {
          label: row.label,
          href: row.href,
          menuGroup: row.group,
          sortOrder: row.order,
          parentId: row.parentId,
          i18n: row.i18n ?? {},
        },
      });
      break;
    }
    case "hubs": {
      const row = item as unknown as CmsHomeHub;
      await prisma.homeHub.update({
        where: { id },
        data: {
          href: row.href,
          title: row.title,
          text: row.text,
          photo: row.photo,
          sortOrder: row.order,
          i18n: row.i18n ?? {},
        },
      });
      break;
    }
    case "settings": {
      const row = item as unknown as CmsSiteSettings;
      await prisma.siteSettings.update({
        where: { id: "site" },
        data: {
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
          i18n: row.i18n ?? {},
          updatedAt: new Date(row.updatedAt),
        },
      });
      break;
    }
    case "requests": {
      const row = item as unknown as CmsRequest;
      await prisma.request.update({
        where: { id },
        data: {
          source: row.source,
          payload: row.payload,
          status: row.status,
        },
      });
      break;
    }
    case "users": {
      const row = item as unknown as CmsUser;
      await prisma.user.update({
        where: { id },
        data: {
          name: row.name,
          email: row.email,
          role: row.role,
          password: row.password,
        },
      });
      break;
    }
    }
  } catch {
    throw new Error("not-found");
  }
}

export async function deleteItem(collection: MutableCollection, id: string) {
  try {
    switch (collection) {
      case "news":
        await prisma.news.delete({ where: { id } });
        break;
      case "slides":
        await prisma.slide.delete({ where: { id } });
        break;
      case "media":
        await prisma.media.delete({ where: { id } });
        break;
      case "pages":
        await prisma.page.delete({ where: { id } });
        break;
      case "menu":
        await prisma.menuItem.delete({ where: { id } });
        break;
      case "hubs":
        await prisma.homeHub.delete({ where: { id } });
        break;
      case "management":
        await prisma.managementPerson.delete({ where: { id } });
        break;
      case "issuers":
        await prisma.issuer.delete({ where: { id } });
        break;
      case "listing":
        await prisma.listingEntry.delete({ where: { id } });
        break;
      case "settings":
        throw new Error("settings-locked");
      case "requests":
        await prisma.request.delete({ where: { id } });
        break;
      case "users":
        await prisma.user.delete({ where: { id } });
        break;
    }
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";
    if (code === "P2025") throw new Error("not-found");
    throw error;
  }
}

export async function findItem(
  collection: MutableCollection,
  id: string,
): Promise<Record<string, unknown> | null> {
  switch (collection) {
    case "news": {
      const row = await prisma.news.findUnique({ where: { id } });
      return row ? (toCmsNews(row) as unknown as Record<string, unknown>) : null;
    }
    case "slides": {
      const row = await prisma.slide.findUnique({ where: { id } });
      return row ? (toCmsSlide(row) as unknown as Record<string, unknown>) : null;
    }
    case "media": {
      const row = await prisma.media.findUnique({ where: { id } });
      return row ? (toCmsMedia(row) as unknown as Record<string, unknown>) : null;
    }
    case "pages": {
      const row = await prisma.page.findUnique({ where: { id } });
      return row ? (toCmsPage(row) as unknown as Record<string, unknown>) : null;
    }
    case "menu": {
      const row = await prisma.menuItem.findUnique({ where: { id } });
      return row ? (toCmsMenuItem(row) as unknown as Record<string, unknown>) : null;
    }
    case "hubs": {
      const row = await prisma.homeHub.findUnique({ where: { id } });
      return row ? (toCmsHomeHub(row) as unknown as Record<string, unknown>) : null;
    }
    case "management": {
      const row = await prisma.managementPerson.findUnique({ where: { id } });
      return row ? (toCmsManagementPerson(row) as unknown as Record<string, unknown>) : null;
    }
    case "issuers": {
      const row = await prisma.issuer.findUnique({ where: { id } });
      return row ? (toCmsIssuer(row) as unknown as Record<string, unknown>) : null;
    }
    case "listing": {
      const row = await prisma.listingEntry.findUnique({ where: { id } });
      return row ? (toCmsListingEntry(row) as unknown as Record<string, unknown>) : null;
    }
    case "settings": {
      const row = await prisma.siteSettings.findUnique({ where: { id: "site" } });
      return row ? (toCmsSiteSettings(row) as unknown as Record<string, unknown>) : null;
    }
    case "requests": {
      const row = await prisma.request.findUnique({ where: { id } });
      return row ? (toCmsRequest(row) as unknown as Record<string, unknown>) : null;
    }
    case "users": {
      const row = await prisma.user.findUnique({ where: { id } });
      return row ? (toCmsUser(row) as unknown as Record<string, unknown>) : null;
    }
  }
}
