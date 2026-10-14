-- Существенные факты эмитентов (раскрытие информации) — раньше жили в коде фронтенда (data/disclosure-news.ts).
CREATE TABLE "issuer_disclosures" (
    "id" TEXT NOT NULL,
    "issuer_slug" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issuer_disclosures_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "issuer_disclosures_issuer_slug_date_idx" ON "issuer_disclosures"("issuer_slug", "date" DESC);
CREATE UNIQUE INDEX "issuer_disclosures_issuer_slug_url_key" ON "issuer_disclosures"("issuer_slug", "url");

ALTER TABLE "issuer_disclosures" ADD CONSTRAINT "issuer_disclosures_issuer_slug_fkey"
    FOREIGN KEY ("issuer_slug") REFERENCES "issuers"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- Остатки: столбцы news, которых нет в схеме и которые нигде не используются (все пустые).
ALTER TABLE "news" DROP COLUMN IF EXISTS "author",
    DROP COLUMN IF EXISTS "featured",
    DROP COLUMN IF EXISTS "pinned",
    DROP COLUMN IF EXISTS "related_ids";

-- updated_at настроек выставляет Prisma (@updatedAt) — значение по умолчанию в БД не нужно.
ALTER TABLE "settings" ALTER COLUMN "updated_at" DROP DEFAULT;
