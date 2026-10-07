-- Лендинги «Сектор устойчивого развития» и «Инвестиции в ГЦБ»: данные раньше были в коде фронтенда, теперь в БД.

CREATE TABLE "sustainable_bonds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer_slug" TEXT,
    "reg_number" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT '',
    "volume" TEXT NOT NULL DEFAULT '',
    "nominal" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT '',
    "yield_rate" TEXT NOT NULL DEFAULT '',
    "start_date" TEXT NOT NULL DEFAULT '',
    "end_date" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "standard" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "i18n" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sustainable_bonds_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "sustainable_bonds_order_idx" ON "sustainable_bonds"("order");
ALTER TABLE "sustainable_bonds" ADD CONSTRAINT "sustainable_bonds_issuer_slug_fkey"
    FOREIGN KEY ("issuer_slug") REFERENCES "issuers"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "esg_reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "i18n" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "esg_reports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "esg_reports_order_idx" ON "esg_reports"("order");

CREATE TABLE "verifiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "site" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "i18n" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "verifiers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "verifiers_order_idx" ON "verifiers"("order");

CREATE TABLE "gcb_participants" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "phones" TEXT NOT NULL DEFAULT '',
    "emails" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "i18n" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "gcb_participants_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "gcb_participants_type_order_idx" ON "gcb_participants"("type", "order");

CREATE TABLE "landing_sections" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kicker" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "text" TEXT NOT NULL DEFAULT '',
    "items" TEXT NOT NULL DEFAULT '',
    "link" TEXT NOT NULL DEFAULT '',
    "photo" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL,
    "i18n" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "landing_sections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "landing_sections_page_key_key" ON "landing_sections"("page", "key");
