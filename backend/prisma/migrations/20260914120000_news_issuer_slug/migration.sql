ALTER TABLE "news" ADD COLUMN "issuerSlug" TEXT NOT NULL DEFAULT '';
CREATE INDEX "news_issuerSlug_idx" ON "news"("issuerSlug");
UPDATE "news" SET "issuerSlug" = 'JSC_MFCInvestKor' WHERE "slug" = 'invescor-coupon';
UPDATE "news" SET "issuerSlug" = 'JSC_SalymFinance' WHERE "slug" = 'salym-finance-payout';
