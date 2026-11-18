import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/error";

/**
 * Архив новостей старого сайта kse.kg (news.source_url задан): у нас только заголовок, дата и рубрика,
 * полный текст читается на старом сайте по ссылке. Отдаётся постранично — в общем контенте сайта (/api/public/content)
 * архива нет, иначе каждая страница тянула бы ~8 тыс. заголовков.
 *
 *   GET /api/public/news/archive?lang=ru&page=1&q=…        — новости биржи (и корпоративные без компании на сайте)
 *   GET /api/public/news/archive/issuer/:slug?lang=ru&page=1 — корпоративные новости одной компании
 */
export const newsArchiveRoutes = Router();

const PAGE_SIZE = 30;
const LANGS = new Set(["ru", "ky", "en"]);

function readQuery(query: Record<string, unknown>) {
  const lang = typeof query.lang === "string" && LANGS.has(query.lang) ? query.lang : "ru";
  const page = Math.max(1, Math.min(10_000, Number.parseInt(String(query.page ?? "1"), 10) || 1));
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  return { lang, page, q };
}

async function archivePage(where: Prisma.NewsWhereInput, page: number) {
  const [total, rows] = await Promise.all([
    prisma.news.count({ where }),
    prisma.news.findMany({
      where,
      orderBy: [{ date: "desc" }, { legacyId: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { slug: true, date: true, title: true, tag: true, sourceUrl: true, issuerSlug: true },
    }),
  ]);
  return {
    items: rows.map((row) => ({ slug: row.slug, date: row.date, title: row.title, tag: row.tag, url: row.sourceUrl ?? "", issuerSlug: row.issuerSlug })),
    total,
    page,
    pageSize: PAGE_SIZE,
  };
}

newsArchiveRoutes.get(
  "/archive",
  asyncHandler(async (req, res) => {
    const { lang, page, q } = readQuery(req.query);
    const where: Prisma.NewsWhereInput = {
      sourceUrl: { not: null },
      status: "published",
      lang,
      // Корпоративные новости компании показываются на её странице; без компании на сайте — здесь, в общем архиве.
      OR: [{ kind: { not: "company" } }, { issuerSlug: null }],
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    };
    res.json(await archivePage(where, page));
  }),
);

/**
 * Самые свежие архивные новости для главной: kind=exchange — новости биржи (без корпоративных и срочных),
 * kind=company — корпоративные новости (с названием компании, если она есть на сайте), kind=urgent — срочные
 * объявления. Смешиваются на главной с новостями
 * из админки по дате.
 */
newsArchiveRoutes.get(
  "/archive/latest",
  asyncHandler(async (req, res) => {
    const { lang } = readQuery(req.query);
    const kind = req.query.kind === "company" || req.query.kind === "urgent" ? req.query.kind : "exchange";
    const limit = Math.max(1, Math.min(12, Number.parseInt(String(req.query.limit ?? "4"), 10) || 4));
    const rows = await prisma.news.findMany({
      // Корпоративные — все свежие: с 2025 года старый сайт часто не привязывал их к компании (название есть в заголовке).
      // Срочные — для блока «Срочное объявление» на главной.
      where:
        kind === "exchange"
          ? { sourceUrl: { not: null }, status: "published", lang, kind: { notIn: ["company", "urgent"] } }
          : { sourceUrl: { not: null }, status: "published", lang, kind },
      orderBy: [{ date: "desc" }, { legacyId: "desc" }],
      take: limit,
      select: { slug: true, date: true, title: true, tag: true, sourceUrl: true, issuer: { select: { name: true } } },
    });
    res.json(rows.map((row) => ({ slug: row.slug, date: row.date, title: row.title, tag: row.tag, url: row.sourceUrl ?? "", company: row.issuer?.name ?? "" })));
  }),
);

newsArchiveRoutes.get(
  "/archive/issuer/:slug",
  asyncHandler(async (req, res) => {
    const { lang, page } = readQuery(req.query);
    const slug = String(req.params.slug).slice(0, 200);
    res.json(await archivePage({ sourceUrl: { not: null }, status: "published", lang, kind: "company", issuerSlug: slug }, page));
  }),
);
