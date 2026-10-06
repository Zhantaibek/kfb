import type { CmsIssuer, CmsListingEntry, CmsStore } from "../../../shared/cms";
import { createSeedStore } from "../data/seed";
import { hashPassword } from "../modules/auth/password";
import { prisma } from "./prisma";

export async function seedDatabase(store: CmsStore = createSeedStore()) {
  for (const user of store.users) {
    user.password = await hashPassword(user.password);
  }

  // Новости и листинг ссылаются на эмитентов внешним ключом — эмитенты должны лечь первыми.
  const issuerSlugs = new Set(store.issuers.map((item) => item.slug));
  await prisma.issuer.createMany({ data: store.issuers.map(issuerCreateData), skipDuplicates: true });
  await prisma.listingEntry.createMany({
    data: store.listing.map((item) => ({ ...listingCreateData(item), issuerSlug: knownSlug(item.issuerSlug, issuerSlugs) })),
    skipDuplicates: true,
  });

  for (const item of store.news) {
    await prisma.news.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        slug: item.slug,
        date: item.date,
        tag: item.tag,
        kind: item.kind,
        status: item.status,
        title: item.title,
        excerpt: item.excerpt,
        body: item.body,
        photo: item.photo,
        issuerSlug: knownSlug(item.issuerSlug, issuerSlugs),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
      update: {},
    });
  }

  for (const item of store.slides) {
    await prisma.slide.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        title: item.title,
        text: item.text,
        href: item.href,
        value: item.value,
        photo: item.photo,
        sortOrder: item.order,
      },
      update: {},
    });
  }

  for (const item of store.media) {
    await prisma.media.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        name: item.name,
        url: item.url,
        createdAt: new Date(item.createdAt),
      },
      update: {},
    });
  }

  for (const item of store.pages) {
    await prisma.page.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        path: item.path,
        title: item.title,
        lead: item.lead,
        body: item.body,
        status: item.status,
        updatedAt: new Date(item.updatedAt),
      },
      update: {},
    });
  }

  for (const item of parentsFirst(store.menu)) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        label: item.label,
        href: item.href,
        menuGroup: item.group,
        sortOrder: item.order,
        parentId: item.parentId,
        i18n: item.i18n ?? {},
      },
      update: {},
    });
  }

  for (const item of store.hubs) {
    await prisma.homeHub.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        href: item.href,
        title: item.title,
        text: item.text,
        photo: item.photo,
        sortOrder: item.order,
      },
      update: {},
    });
  }

  for (const item of store.management) {
    await prisma.managementPerson.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        slug: item.slug,
        name: item.name,
        role: item.role,
        groupId: item.group,
        photo: item.photo,
        bio: item.bio,
        education: item.education,
        career: item.career,
        sortOrder: item.order,
        status: item.status,
        i18n: item.i18n ?? {},
        updatedAt: new Date(item.updatedAt),
      },
      update: {},
    });
  }

  for (const item of store.settings) {
    await prisma.siteSettings.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        tagline: item.tagline,
        address: item.address,
        phones: item.phones,
        emails: item.emails,
        fax: item.fax,
        license: item.license,
        copyright: item.copyright,
        eduUrl: item.eduUrl,
        disclosurePhone: item.disclosurePhone,
        eduPhone: item.eduPhone,
        updatedAt: new Date(item.updatedAt),
      },
      update: {},
    });
  }

  for (const item of store.users) {
    await prisma.user.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        name: item.name,
        email: item.email,
        role: item.role,
        password: item.password,
      },
      update: {},
    });
  }

  for (const item of store.audit) {
    await prisma.audit.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        action: item.action,
        entity: item.entity,
        detail: item.detail,
        actor: item.actor,
        at: new Date(item.at),
      },
      update: {},
    });
  }
}

/** Ссылка на эмитента: пустая или на несуществующего — NULL, иначе внешний ключ не пустит строку. */
function knownSlug(slug: string | undefined, known: Set<string>) {
  return slug && known.has(slug) ? slug : null;
}

/** Пункты меню в порядке «родитель раньше детей»; ссылки на пропавшего родителя обнуляем. */
function parentsFirst(menu: CmsStore["menu"]) {
  const ids = new Set(menu.map((item) => item.id));
  const placed = new Set<string>();
  const rows = menu.map((item) => ({ ...item, parentId: item.parentId && ids.has(item.parentId) ? item.parentId : null }));
  const ordered: typeof rows = [];
  while (ordered.length < rows.length) {
    const ready = rows.filter((item) => !placed.has(item.id) && (!item.parentId || placed.has(item.parentId)));
    // Цикл parent_id — разрываем, чтобы seed не завис.
    const batch = ready.length ? ready : rows.filter((item) => !placed.has(item.id)).map((item) => ({ ...item, parentId: null }));
    for (const item of batch) {
      placed.add(item.id);
      ordered.push(item);
    }
  }
  return ordered;
}

export function issuerCreateData(item: CmsIssuer) {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    activity: item.activity,
    director: item.director,
    position: item.position,
    address: item.address,
    phone: item.phone,
    registrar: item.registrar,
    security: item.security,
    count: item.count,
    price: item.price,
    status: item.status,
    sortOrder: item.order,
    updatedAt: new Date(item.updatedAt),
  };
}

export function listingCreateData(item: CmsListingEntry) {
  return {
    id: item.id,
    code: item.code,
    category: item.category,
    sortOrder: item.order,
    name: item.name,
    issuerSlug: item.issuerSlug || null,
    security: item.security,
    price: item.price,
    cap: item.cap,
    count: item.count,
    doc: item.doc,
    symbols: item.symbols,
    industry: item.industry,
    activity: item.activity,
    listedAt: item.listedAt,
    auditor: item.auditor,
    registrar: item.registrar,
    marketMaker: item.marketMaker,
    documents: item.documents,
    updatedAt: new Date(item.updatedAt),
  };
}
