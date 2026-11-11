-- Отзыв сессий сотрудников: номер версии записывается в cookie при входе; выход, смена пароля и сброс 2FA
-- увеличивают его, и все выданные раньше cookie перестают действовать.
ALTER TABLE "users" ADD COLUMN "session_version" INTEGER NOT NULL DEFAULT 0;
