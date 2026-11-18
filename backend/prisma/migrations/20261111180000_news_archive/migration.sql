-- Архив новостей старого сайта kse.kg: у нас хранятся только заголовок, дата и рубрика, полный текст читается
-- на старом сайте по source_url. Новости нового сайта (source_url пустой) читаются целиком у нас, как раньше.
-- lang — язык новости (ru | ky | en): старый сайт вёл отдельные записи на каждом языке.
-- Только добавление: существующие новости получают lang = 'ru' и пустой source_url.
ALTER TABLE "news" ADD COLUMN "lang" TEXT NOT NULL DEFAULT 'ru',
ADD COLUMN "source_url" TEXT;

CREATE INDEX "news_lang_kind_date_idx" ON "news"("lang", "kind", "date");
