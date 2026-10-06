CREATE TABLE "issuers" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "activity" TEXT NOT NULL DEFAULT '',
  "director" TEXT NOT NULL DEFAULT '',
  "position" TEXT NOT NULL DEFAULT '',
  "address" TEXT NOT NULL DEFAULT '',
  "phone" TEXT NOT NULL DEFAULT '',
  "registrar" TEXT NOT NULL DEFAULT '',
  "security" TEXT NOT NULL DEFAULT '',
  "count" TEXT NOT NULL DEFAULT '',
  "price" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT '',
  "order" INTEGER NOT NULL,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "issuers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "issuers_slug_key" ON "issuers"("slug");
CREATE INDEX "issuers_order_idx" ON "issuers"("order");

CREATE TABLE "listing" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "issuer_slug" TEXT NOT NULL DEFAULT '',
  "security" TEXT NOT NULL DEFAULT '',
  "price" TEXT NOT NULL DEFAULT '',
  "cap" TEXT NOT NULL DEFAULT '',
  "count" TEXT NOT NULL DEFAULT '',
  "doc" TEXT NOT NULL DEFAULT '',
  "symbols" TEXT NOT NULL DEFAULT '',
  "industry" TEXT NOT NULL DEFAULT '',
  "activity" TEXT NOT NULL DEFAULT '',
  "listed_at" TEXT NOT NULL DEFAULT '',
  "auditor" TEXT NOT NULL DEFAULT '',
  "registrar" TEXT NOT NULL DEFAULT '',
  "market_maker" TEXT NOT NULL DEFAULT '',
  "documents" JSONB NOT NULL DEFAULT '[]',
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "listing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "listing_code_key" ON "listing"("code");
CREATE INDEX "listing_category_order_idx" ON "listing"("category", "order");
CREATE INDEX "listing_issuer_slug_idx" ON "listing"("issuer_slug");
