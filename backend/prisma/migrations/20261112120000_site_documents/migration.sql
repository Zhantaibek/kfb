-- Документы сайта (PDF, DOC, XLS…): стратегии, устав, положения, регламенты — по разделам и страницам.
-- Файл лежит в uploads, в таблице — описание и ссылка (file_url). Только добавление новой таблицы.
CREATE TABLE "site_documents" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "page_path" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'ru',
    "period" TEXT NOT NULL DEFAULT '',
    "doc_date" DATE,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL DEFAULT '',
    "file_type" TEXT NOT NULL DEFAULT 'application/pdf',
    "file_size" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'published',
    "i18n" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "site_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "site_documents_section_status_order_idx" ON "site_documents"("section", "status", "order");

CREATE INDEX "site_documents_page_path_idx" ON "site_documents"("page_path");
