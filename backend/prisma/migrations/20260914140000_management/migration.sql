CREATE TABLE "management" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "group_id" TEXT NOT NULL,
  "photo" TEXT NOT NULL,
  "bio" TEXT NOT NULL,
  "education" TEXT NOT NULL,
  "career" JSONB NOT NULL DEFAULT '[]',
  "order" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "i18n" JSONB NOT NULL DEFAULT '{}',
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "management_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "management_slug_key" ON "management"("slug");
CREATE INDEX "management_group_id_order_idx" ON "management"("group_id", "order");
