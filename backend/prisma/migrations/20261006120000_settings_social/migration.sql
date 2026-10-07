-- Ссылки на соцсети КФБ для иконок в подвале сайта.
ALTER TABLE "settings" ADD COLUMN "facebook_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "settings" ADD COLUMN "instagram_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "settings" ADD COLUMN "telegram_url" TEXT NOT NULL DEFAULT '';

-- Адреса как на kse.kg — у уже существующей записи настроек.
UPDATE "settings"
SET "facebook_url" = 'https://ru-ru.facebook.com/KyrgyzStockExchange/',
    "instagram_url" = 'https://www.instagram.com/kse.kg/',
    "telegram_url" = 'https://t.me/kse_publicinfo';
