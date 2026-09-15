ALTER TABLE "menu" ADD COLUMN IF NOT EXISTS "parent_id" TEXT;
CREATE INDEX IF NOT EXISTS "menu_parent_id_order_idx" ON "menu"("parent_id", "order");
