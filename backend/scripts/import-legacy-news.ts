/**
 * Перенос архива новостей старого сайта kse.kg (таблица Blog_Entries) в news — только заголовки.
 *
 *   npx tsx scripts/import-legacy-news.ts <путь к дампу kse.sql>
 *
 * Дамп только читается. У нас хранится заголовок, дата, рубрика, язык и компания; полный текст не переносится —
 * на сайте новость открывается на старом сайте по ссылке source_url (https://www.kse.kg/<язык>/<блог>/<номер>).
 * Новости, добавленные позже в админке нового сайта, source_url не имеют и читаются целиком у нас.
 * Повторный запуск обновляет те же записи (ключ — legacy_id = Blog_Entries.blogentry_id), дублей нет.
 */
import { createReadStream } from "node:fs";
import { randomUUID } from "node:crypto";
import readline from "node:readline";
import { prisma } from "../src/db/prisma";

/** Блоги старого сайта → язык, вид новости и рубрика на новом сайте. */
const BLOGS: Record<number, { lang: "ru" | "ky" | "en"; kind: "exchange" | "company" | "urgent"; tag: string }> = {
  1: { lang: "ru", kind: "exchange", tag: "Новости" },
  2: { lang: "ru", kind: "exchange", tag: "Аналитика" },
  3: { lang: "ru", kind: "company", tag: "Корпоративные новости" },
  4: { lang: "en", kind: "exchange", tag: "News" },
  5: { lang: "en", kind: "company", tag: "Corporate news" },
  6: { lang: "ky", kind: "company", tag: "Компаниялардын жаңылыктары" },
  7: { lang: "ky", kind: "exchange", tag: "Жаңылыктар" },
  8: { lang: "ru", kind: "urgent", tag: "Срочное объявление" },
  9: { lang: "ky", kind: "urgent", tag: "Шашылыш жарыя" },
};

/** Значения одной строки дампа «\t(1, 'a', NULL, …),» — с учётом кавычек и экранирования MySQL. */
export function parseTuple(line: string): (string | null)[] {
  const values: (string | null)[] = [];
  let i = line.indexOf("(") + 1;
  while (i < line.length) {
    while (line[i] === " ") i++;
    if (line[i] === "'") {
      let out = "";
      i++;
      while (i < line.length) {
        const ch = line[i];
        if (ch === "\\") {
          const next = line[i + 1];
          out += next === "n" ? "\n" : next === "r" ? "\r" : next === "t" ? "\t" : next === "0" ? "" : next;
          i += 2;
        } else if (ch === "'" && line[i + 1] === "'") {
          out += "'";
          i += 2;
        } else if (ch === "'") {
          i++;
          break;
        } else {
          out += ch;
          i++;
        }
      }
      values.push(out);
    } else {
      let j = i;
      while (j < line.length && line[j] !== "," && line[j] !== ")") j++;
      const raw = line.slice(i, j).trim();
      values.push(raw === "NULL" ? null : raw);
      i = j;
    }
    while (i < line.length && line[i] !== "," && line[i] !== ")") i++;
    if (line[i] === ")") break;
    i++;
  }
  return values;
}

const ENTITIES: Record<string, string> = { quot: '"', amp: "&", lt: "<", gt: ">", nbsp: " ", laquo: "«", raquo: "»", ndash: "–", mdash: "—", apos: "'" };

/** Заголовок: без тегов, HTML-сущностей и невидимых символов (в старой базе встречается U+200B). */
export function cleanTitle(raw: string) {
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&([a-z]+);/gi, (match, name: string) => ENTITIES[name.toLowerCase()] ?? match)
    .replace(/[​-‍﻿]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function readTable(file: string, table: string, onRow: (values: (string | null)[]) => void) {
  let inTable = false;
  for await (const line of readline.createInterface({ input: createReadStream(file, { encoding: "utf8" }), crlfDelay: Infinity })) {
    if (line.startsWith(`INSERT INTO \`${table}\``)) inTable = true;
    else if (inTable && !line.startsWith("\t(")) inTable = false;
    if (inTable && line.startsWith("\t(")) onRow(parseTuple(line));
  }
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Укажите путь к дампу: npx tsx scripts/import-legacy-news.ts <kse.sql>");

  // Блоги (id → имя для ссылки) и компании старого сайта (id → код), код сопоставляем с нашими эмитентами.
  const blogNames = new Map<number, string>();
  await readTable(file, "Blogs", (v) => blogNames.set(Number(v[0]), String(v[1])));
  const brep = new Map<number, string>();
  await readTable(file, "brep_companies", (v) => brep.set(Number(v[0]), String(v[1])));
  const ourIssuers = new Map((await prisma.issuer.findMany({ select: { slug: true } })).map((row) => [row.slug.toLowerCase(), row.slug]));

  type Row = Parameters<typeof prisma.news.create>[0]["data"];
  const rows: Row[] = [];
  const stats = { read: 0, skipped: 0, withIssuer: 0, companyWithoutIssuer: 0 };
  await readTable(file, "Blog_Entries", (v) => {
    stats.read++;
    // blogentry_id, blog_id, name, title, text, author, cr_date, status, link_company_id
    const id = Number(v[0]);
    const blogId = Number(v[1]);
    const blog = BLOGS[blogId];
    const blogName = blogNames.get(blogId);
    // Пустой заголовок (так в старой базе у 17 обзоров 2008 года) — берём начало текста: первое предложение до 140 знаков.
    const fromText = cleanTitle(v[4] ?? "").split(/(?<=[.!?])\s/)[0].slice(0, 140).trim();
    const title = cleanTitle(v[3] ?? "") || cleanTitle(v[2] ?? "") || fromText;
    if (!blog || !blogName || !title) {
      stats.skipped++;
      return;
    }
    const rawDate = v[6] ?? "";
    const created = /^\d{4}-\d{2}-\d{2}/.test(rawDate) && !rawDate.startsWith("0000") ? new Date(`${rawDate.replace(" ", "T")}Z`) : new Date("2004-01-01T00:00:00Z");
    const companySlug = brep.get(Number(v[8] ?? 0));
    const issuerSlug = companySlug ? ourIssuers.get(companySlug.toLowerCase()) ?? null : null;
    if (issuerSlug) stats.withIssuer++;
    else if (blog.kind === "company") stats.companyWithoutIssuer++;
    rows.push({
      id: randomUUID(),
      legacyId: id,
      slug: `kse-${id}`,
      date: created.toISOString().slice(0, 10),
      tag: blog.tag,
      kind: blog.kind,
      status: v[7] === "1" ? "published" : "draft",
      title,
      excerpt: "",
      body: "",
      photo: "",
      issuerSlug,
      lang: blog.lang,
      sourceUrl: `https://www.kse.kg/${blog.lang}/${blogName}/${id}`,
      createdAt: created,
      updatedAt: created,
    });
  });

  for (let i = 0; i < rows.length; i += 500) {
    await prisma.$transaction(
      rows.slice(i, i + 500).map((row) => {
        const { id, ...data } = row;
        return prisma.news.upsert({ where: { legacyId: row.legacyId as number }, create: { id, ...data }, update: data });
      }),
    );
  }

  const byLang = rows.reduce<Record<string, number>>((acc, row) => ((acc[String(row.lang)] = (acc[String(row.lang)] ?? 0) + 1), acc), {});
  console.log(`Строк в Blog_Entries: ${stats.read}, перенесено: ${rows.length}, пропущено: ${stats.skipped}`);
  console.log(`По языкам: ${JSON.stringify(byLang)}`);
  console.log(`С компанией нашего сайта: ${stats.withIssuer}; корпоративных без компании на сайте (покажутся в общем архиве): ${stats.companyWithoutIssuer}`);
}

if (process.argv[1]?.includes("import-legacy-news")) {
  main()
    .catch((error) => {
      console.error("FAIL", error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
