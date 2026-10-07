-- Партнёры биржи — раньше были зашиты в код фронтенда (data/resources.ts), теперь правятся в админке.
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "mark" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT '',
    "caption" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "lead" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "site" TEXT NOT NULL DEFAULT '',
    "logo" TEXT NOT NULL DEFAULT '',
    "logo_wide" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "i18n" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "partners_slug_key" ON "partners"("slug");
CREATE INDEX "partners_order_idx" ON "partners"("order");
