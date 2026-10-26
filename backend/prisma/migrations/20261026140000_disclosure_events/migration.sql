-- Существенные факты эмитентов (центр раскрытия информации): раньше лежали в коде сайта и не обновлялись.
-- source: kse — синхронизация с kse.kg, manual — добавлено сотрудником в админке. url уникален: по нему
-- синхронизация понимает, что событие уже есть.
CREATE TABLE "disclosure_events" (
    "id" TEXT NOT NULL,
    "issuer_slug" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'kse',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "disclosure_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "disclosure_events_url_key" ON "disclosure_events"("url");
CREATE INDEX "disclosure_events_issuer_slug_date_idx" ON "disclosure_events"("issuer_slug", "date");

ALTER TABLE "disclosure_events" ADD CONSTRAINT "disclosure_events_issuer_slug_fkey"
    FOREIGN KEY ("issuer_slug") REFERENCES "issuers"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
