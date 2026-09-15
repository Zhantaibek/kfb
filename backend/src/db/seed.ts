import type { CmsStore } from "../../../shared/cms";
import { createSeedStore } from "../data/seed";
import { hashPassword } from "../modules/auth/password";
import { prisma } from "./prisma";

export async function seedDatabase(store: CmsStore = createSeedStore()) {
  for (const user of store.users) {
    user.password = await hashPassword(user.password);
  }

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
        issuerSlug: item.issuerSlug ?? "",
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

  for (const item of store.menu) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        label: item.label,
        href: item.href,
        menuGroup: item.group,
        sortOrder: item.order,
        parentId: item.parentId,
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
