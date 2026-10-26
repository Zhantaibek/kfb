-- Документы, прикреплённые к новости: [{ name, url, ext, size }]. Существующие новости получают пустой список.
ALTER TABLE "news" ADD COLUMN "attachments" JSONB NOT NULL DEFAULT '[]';
