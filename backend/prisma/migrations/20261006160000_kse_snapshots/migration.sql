-- Живые данные с kse.kg: снимок каждого раздела (итоги торгов, котировки, аукционы ГЦБ и т.д.).
CREATE TABLE "kse_snapshots" (
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "source_url" TEXT NOT NULL,
    "fetched_at" TIMESTAMPTZ(6) NOT NULL,
    "error" TEXT,
    "checked_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "kse_snapshots_pkey" PRIMARY KEY ("key")
);
