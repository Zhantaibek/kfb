-- Двухфакторный вход сотрудников (TOTP): секрет хранится зашифрованным (AES-256-GCM, ключ из SESSION_SECRET),
-- totp_last_step — шаг последнего принятого кода, чтобы один код нельзя было использовать дважды.
ALTER TABLE "users" ADD COLUMN "totp_secret" TEXT;
ALTER TABLE "users" ADD COLUMN "totp_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "totp_last_step" INTEGER;
