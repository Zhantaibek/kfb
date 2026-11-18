import { Router } from "express";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../middleware/error";

/**
 * Участники торгов (брокеры и дилеры) — из нашей базы: business_catalog, group = Members
 * (перенесено из бэкапа старого сайта, scripts/import-legacy-members.ts).
 *
 *   GET /api/public/members → { rows: [{ name, details, suspended }] }
 * details — адрес и контакты обычным текстом (строки через \n), suspended — пометка «Доступ к торгам приостановлен …».
 */
export const membersRoutes = Router();

const SUSPENDED = /Доступ к торгам приостановлен[^\n]*/i;

const ENTITIES: Record<string, string> = { nbsp: " ", laquo: "«", raquo: "»", quot: '"', amp: "&", lt: "<", gt: ">", ndash: "–", mdash: "—", apos: "'" };

/** HTML-описание старого сайта → текст: абзацы и <br> — переносы строк, сущности раскрыты, пустые строки убраны. */
export function descriptionText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/** Пометка о приостановке бывает в заголовке («… - (Доступ к торгам приостановлен Приказом …)») или в описании. */
export function memberRow(name: string, title: string, description: string) {
  const text = descriptionText(description);
  const suspended = (title.match(SUSPENDED)?.[0] ?? text.match(SUSPENDED)?.[0] ?? "").replace(/[\s)]+$/, "").trim();
  const details = text
    .replace(SUSPENDED, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
  return { name, details, suspended };
}

membersRoutes.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.catalogEntry.findMany({ where: { group: "Members", status: "published" }, orderBy: { name: "asc" } });
    res.json({ rows: rows.map((row) => memberRow(row.name, row.title, row.description)) });
  }),
);
