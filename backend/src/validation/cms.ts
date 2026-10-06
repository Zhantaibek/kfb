import { z } from "zod";
import { languageError } from "../../../shared/lang-check";

export const loginSchema = z.object({
  email: z.string().trim().email("Укажите корректный e-mail"),
  password: z.string().min(1, "Укажите пароль"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Укажите имя").max(120),
  email: z.string().trim().email("Укажите корректный e-mail"),
  password: z.string().min(4, "Пароль должен быть не короче 4 символов").max(200),
  role: z.enum(["investor", "issuer"], { message: "Выберите роль: инвестор или эмитент" }),
});

export const publicRequestSchema = z.object({
  source: z.string().trim().min(1).max(80).default("site"),
  payload: z.record(z.string(), z.string()).default({}),
});

export const visitSchema = z.object({
  path: z.string().trim().min(1).max(180).default("/"),
});

const publishStatus = z.enum(["draft", "published"]);
const newsKind = z.enum(["exchange", "company", "urgent"]);
const i18nSchema = z
  .object({
    ky: z.record(z.string(), z.string().max(500_000)).optional(),
    en: z.record(z.string(), z.string().max(500_000)).optional(),
  })
  .optional()
  .default({});

const htmlI18nFields = new Set(["body"]);

function isLocaleValueFilled(value: unknown, field: string) {
  const text = String(value ?? "");
  if (htmlI18nFields.has(field)) {
    return text
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim().length > 0;
  }
  return text.trim().length > 0;
}

/** properNames — поля с именами собственными: перевод обязателен, но эвристика языка к ним не применяется. */
function requireI18n(fields: string[], properNames: string[] = []) {
  return (
    data: { i18n?: { ky?: Record<string, string>; en?: Record<string, string> } } & Record<string, unknown>,
    ctx: z.RefinementCtx,
  ) => {
    const missing: string[] = [];
    for (const field of fields) {
      if (!isLocaleValueFilled(data[field], field)) continue;
      const skipLangCheck = properNames.includes(field);
      const ru = String(data[field] ?? "");
      const ruErr = skipLangCheck ? null : languageError(ru, "ru");
      if (ruErr) {
        ctx.addIssue({ code: "custom", message: ruErr });
        return;
      }
      for (const [id, label] of [
        ["ky", "кыргызский"],
        ["en", "английский"],
      ] as const) {
        const translated = data.i18n?.[id]?.[field] ?? "";
        if (!isLocaleValueFilled(translated, field)) {
          missing.push(label);
          continue;
        }
        const langErr = skipLangCheck ? null : languageError(translated, id, ru);
        if (langErr) {
          ctx.addIssue({ code: "custom", message: langErr });
          return;
        }
      }
    }
    const unique = [...new Set(missing)];
    if (unique.length) {
      ctx.addIssue({
        code: "custom",
        message: `Нужны все три языка. Заполните ${unique.join(" и ")} текст на вкладках KY и EN.`,
      });
    }
  };
}

export const newsItemSchema = z
  .object({
    slug: z.string({ error: "Укажите slug" }).trim().min(1, "Укажите slug").max(160),
    date: z.string({ error: "Укажите дату" }).trim().min(1, "Укажите дату").max(40),
    tag: z.string({ error: "Укажите тег" }).trim().min(1, "Укажите тег").max(80),
    kind: newsKind,
    status: publishStatus,
    title: z.string({ error: "Укажите заголовок" }).trim().min(1, "Укажите заголовок").max(300),
    excerpt: z.string().trim().max(2000).default(""),
    body: z.string().max(500_000).default(""),
    photo: z.string().trim().max(500).default(""),
    issuerSlug: z.string().trim().max(160).default(""),
    i18n: i18nSchema,
  })
  .superRefine(requireI18n(["title", "body"]))
  .superRefine((data, ctx) => {
    if (data.kind === "company" && !data.issuerSlug) {
      ctx.addIssue({
        code: "custom",
        message: "Выберите компанию для новости эмитента.",
        path: ["issuerSlug"],
      });
    }
  })
  .transform((data) => ({
    ...data,
    issuerSlug: data.kind === "company" ? data.issuerSlug : "",
  }));

export const slideItemSchema = z
  .object({
    title: z.string({ error: "Укажите заголовок" }).trim().min(1, "Укажите заголовок").max(200),
    text: z.string().trim().max(1000).default(""),
    href: z.string().trim().max(300).default("/"),
    value: z.string().trim().max(120).default(""),
    photo: z.string().trim().max(500).default(""),
    order: z.coerce.number().int().min(0).max(10_000).default(0),
    i18n: i18nSchema,
  })
  .superRefine(requireI18n(["title", "text", "value"]));

export const pageItemSchema = z
  .object({
    path: z.string({ error: "Укажите путь" }).trim().min(1, "Укажите путь").max(200),
    title: z.string({ error: "Укажите заголовок" }).trim().min(1, "Укажите заголовок").max(300),
    lead: z.string().trim().max(2000).default(""),
    body: z.string().max(500_000).default(""),
    status: publishStatus,
    i18n: i18nSchema,
  })
  .superRefine(requireI18n(["title", "lead", "body"]));

export const menuItemSchema = z
  .object({
    label: z.string({ error: "Укажите название" }).trim().min(1, "Укажите название").max(120),
    href: z.string({ error: "Укажите ссылку" }).trim().min(1, "Укажите ссылку").max(300),
    group: z.string({ error: "Укажите группу" }).trim().min(1, "Укажите группу").max(80),
    order: z.coerce.number().int().min(0).max(10_000).default(0),
    parentId: z
      .union([z.string().trim().max(80), z.null()])
      .optional()
      .transform((value) => {
        if (!value) return null;
        return value;
      }),
    i18n: i18nSchema,
  });

export const requestItemSchema = z.object({
  source: z.string().trim().min(1).max(80),
  payload: z.record(z.string(), z.string()).default({}),
  status: z.enum(["new", "done"]),
});

export const userItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  role: z.enum(["admin", "editor", "investor", "issuer"]),
  password: z.string().max(200).optional(),
});

export const mediaItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  url: z.string().trim().min(1).max(500),
});

export const hubItemSchema = z
  .object({
    href: z.string({ error: "Укажите ссылку" }).trim().min(1, "Укажите ссылку").max(300),
    title: z.string({ error: "Укажите заголовок" }).trim().min(1, "Укажите заголовок").max(200),
    text: z.string().trim().max(500).default(""),
    photo: z.string().trim().max(500).default(""),
    order: z.coerce.number().int().min(0).max(10_000).default(0),
    i18n: i18nSchema,
  })
  .superRefine(requireI18n(["title", "text"]));

const careerRowSchema = z.object({
  org: z.string().trim().max(500).default(""),
  role: z.string().trim().max(500).default(""),
  period: z.string().trim().max(200).default(""),
});

export const managementItemSchema = z
  .object({
    slug: z.string({ error: "Укажите slug" }).trim().min(1, "Укажите slug").max(160),
    name: z.string({ error: "Укажите ФИО" }).trim().min(1, "Укажите ФИО").max(200),
    role: z.string({ error: "Укажите должность" }).trim().min(1, "Укажите должность").max(200),
    group: z.enum(["board", "executive"], { message: "Выберите орган управления" }),
    photo: z.string().trim().max(500).default(""),
    bio: z.string().max(20_000).default(""),
    education: z.string().max(20_000).default(""),
    career: z
      .array(careerRowSchema)
      .max(60)
      .default([])
      .transform((rows) => rows.filter((row) => row.org || row.role || row.period)),
    order: z.coerce.number().int().min(0).max(10_000).default(0),
    status: publishStatus,
    i18n: i18nSchema,
  })
  .superRefine(requireI18n(["name", "role"], ["name"]));

const plain = (max: number) => z.string().trim().max(max).default("");

export const issuerItemSchema = z.object({
  slug: z
    .string({ error: "Укажите slug" })
    .trim()
    .min(1, "Укажите slug")
    .max(160)
    .regex(/^[A-Za-z0-9_-]+$/, "Slug: только латиница, цифры, «_» и «-»"),
  name: z.string({ error: "Укажите наименование" }).trim().min(1, "Укажите наименование").max(300),
  activity: plain(500),
  director: plain(200),
  position: plain(200),
  address: plain(500),
  phone: plain(200),
  registrar: plain(300),
  security: plain(500),
  count: plain(100),
  price: plain(100),
  status: plain(80),
  order: z.coerce.number().int().min(0).max(100_000).default(0),
});

const listingDocumentSchema = z.object({
  name: plain(300),
  url: plain(1000),
});

export const listingItemSchema = z.object({
  code: z
    .string({ error: "Укажите код бумаги" })
    .trim()
    .min(1, "Укажите код бумаги")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Код бумаги: только латиница, цифры, «_» и «-»"),
  category: z.enum(["A", "B", "C", "delisted"], { message: "Выберите категорию листинга" }),
  order: z.coerce.number().int().min(0).max(10_000).default(0),
  name: z.string({ error: "Укажите эмитента" }).trim().min(1, "Укажите эмитента").max(300),
  issuerSlug: plain(160),
  security: plain(500),
  price: plain(100),
  cap: plain(100),
  count: plain(100),
  doc: plain(1000),
  symbols: plain(300),
  industry: plain(300),
  activity: plain(500),
  listedAt: z
    .string()
    .trim()
    .max(10)
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Дата листинга в формате ГГГГ-ММ-ДД")
    .default(""),
  auditor: plain(300),
  registrar: plain(300),
  marketMaker: plain(300),
  documents: z
    .array(listingDocumentSchema)
    .max(100)
    .default([])
    .transform((rows) => rows.filter((row) => row.name || row.url)),
});

export const settingsItemSchema = z
  .object({
    tagline: z.string().trim().max(500).default(""),
    address: z.string().trim().max(500).default(""),
    phones: z.string().trim().max(1000).default(""),
    emails: z.string().trim().max(500).default(""),
    fax: z.string().trim().max(80).default(""),
    license: z.string().trim().max(200).default(""),
    copyright: z.string().trim().max(300).default(""),
    eduUrl: z.string().trim().max(500).default(""),
    disclosurePhone: z.string().trim().max(80).default(""),
    eduPhone: z.string().trim().max(80).default(""),
    i18n: i18nSchema,
  })
  .superRefine(requireI18n(["tagline", "address", "license", "copyright"]));

const mutableCollections = z.enum([
  "news",
  "slides",
  "media",
  "pages",
  "menu",
  "hubs",
  "management",
  "issuers",
  "listing",
  "settings",
  "requests",
  "users",
]);

export const mutateSchema = z.object({
  op: z.enum(["create", "update", "delete"]),
  collection: mutableCollections,
  id: z.string().min(1).optional(),
  item: z.record(z.string(), z.unknown()).optional(),
});

export const itemSchemas = {
  news: newsItemSchema,
  slides: slideItemSchema,
  pages: pageItemSchema,
  menu: menuItemSchema,
  hubs: hubItemSchema,
  management: managementItemSchema,
  issuers: issuerItemSchema,
  listing: listingItemSchema,
  settings: settingsItemSchema,
  requests: requestItemSchema,
  users: userItemSchema,
  media: mediaItemSchema,
} as const;

export type MutableCollection = z.infer<typeof mutableCollections>;
