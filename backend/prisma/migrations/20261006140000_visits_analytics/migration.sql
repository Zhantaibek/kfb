-- Аналитика посещений как на cds.kg: посетитель, IP и устройство у каждого просмотра.
ALTER TABLE "visits" ADD COLUMN "visitor_id" TEXT;
ALTER TABLE "visits" ADD COLUMN "ip" TEXT;
ALTER TABLE "visits" ADD COLUMN "device" TEXT;

CREATE INDEX "visits_path_idx" ON "visits"("path");
CREATE INDEX "visits_visitor_id_path_at_idx" ON "visits"("visitor_id", "path", "at");
