-- Связи между таблицами: эмитент → листинг и новости, пункт меню → подпункты.
-- Пустая ссылка на эмитента теперь NULL, а не "".

ALTER TABLE "listing" ALTER COLUMN "issuer_slug" DROP NOT NULL,
ALTER COLUMN "issuer_slug" DROP DEFAULT;

ALTER TABLE "news" ALTER COLUMN "issuerSlug" DROP NOT NULL,
ALTER COLUMN "issuerSlug" DROP DEFAULT;

-- Ссылки в никуда обнуляем, иначе внешний ключ не создастся.
UPDATE "listing" SET "issuer_slug" = NULL
WHERE "issuer_slug" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "issuers" i WHERE i."slug" = "listing"."issuer_slug");

UPDATE "news" SET "issuerSlug" = NULL
WHERE "issuerSlug" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "issuers" i WHERE i."slug" = "news"."issuerSlug");

UPDATE "menu" SET "parent_id" = NULL
WHERE "parent_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "menu" p WHERE p."id" = "menu"."parent_id");

ALTER TABLE "news" ADD CONSTRAINT "news_issuerSlug_fkey" FOREIGN KEY ("issuerSlug") REFERENCES "issuers"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "menu" ADD CONSTRAINT "menu_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "listing" ADD CONSTRAINT "listing_issuer_slug_fkey" FOREIGN KEY ("issuer_slug") REFERENCES "issuers"("slug") ON DELETE SET NULL ON UPDATE CASCADE;
