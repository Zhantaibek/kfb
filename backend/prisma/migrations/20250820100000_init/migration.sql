-- CreateSchema
CREATE TABLE IF NOT EXISTS "news" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "slides" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "slides_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "media" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "pages" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lead" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "menu" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "menu_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "requests" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "visits" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "audit" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "audit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "news_slug_key" ON "news"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "pages_path_key" ON "pages"("path");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "news_status_updated_at_idx" ON "news"("status", "updated_at" DESC);
CREATE INDEX IF NOT EXISTS "pages_status_idx" ON "pages"("status");
CREATE INDEX IF NOT EXISTS "visits_at_idx" ON "visits"("at" DESC);
CREATE INDEX IF NOT EXISTS "audit_at_idx" ON "audit"("at" DESC);
CREATE INDEX IF NOT EXISTS "requests_created_at_idx" ON "requests"("created_at" DESC);
