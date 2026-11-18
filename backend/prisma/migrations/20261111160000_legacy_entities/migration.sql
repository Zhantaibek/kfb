-- Сущности старой базы сайта kse.kg (MySQL) в нашей схеме — только структура, без данных.
-- Новые таблицы: ценные бумаги, отчёты эмитентов, выпуски «Финансовый рынок.KG», бизнес-каталог, подписчики Telegram,
-- история рынка (итоги дня и месяца, итоги по бумагам, котировки, индексы, курсы валют, аукционы и объёмы ГЦБ,
-- ноты НБКР, цены сырья, рейтинг участников) и снимки QUIK. В существующие таблицы добавлены только необязательные
-- колонки со значениями по умолчанию (поля старой базы и legacy_id для импорта без дублей) — код сайта не меняется.
-- Только добавление: ничего не удаляется и не меняет тип.

-- AlterTable
ALTER TABLE "issuers" ADD COLUMN     "auditor" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "issues_count" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "legacy_id" INTEGER,
ADD COLUMN     "sphere" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "listing" ADD COLUMN     "coupon_yield" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "i18n" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "legacy_id" INTEGER,
ADD COLUMN     "note" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "redemption_date" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "news" ADD COLUMN     "legacy_id" INTEGER;

-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "legacy_id" INTEGER;

-- AlterTable

-- CreateTable
CREATE TABLE "securities" (
    "id" TEXT NOT NULL,
    "isin" TEXT,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'other',
    "class_code" TEXT NOT NULL DEFAULT '',
    "face_unit" TEXT NOT NULL DEFAULT '',
    "nominal" DECIMAL(20,4),
    "issuer_slug" TEXT,
    "listing_code" TEXT,
    "legacy_id" INTEGER,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "securities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "issuer_slug" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "year" INTEGER,
    "quarter" INTEGER,
    "period_label" TEXT NOT NULL DEFAULT '',
    "report_date" DATE,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL DEFAULT '',
    "file_type" TEXT NOT NULL DEFAULT '',
    "file_size" INTEGER,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL,
    "legacy_id" INTEGER,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_market_issues" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "date" DATE NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "legacy_id" INTEGER,

    CONSTRAINT "fin_market_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_catalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'published',
    "date" DATE,
    "legacy_id" INTEGER,

    CONSTRAINT "business_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_subscribers" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL DEFAULT '',
    "chat_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_days" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_volume" DECIMAL(20,4) NOT NULL,
    "primary_volume" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "secondary_volume" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "listing_volume" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "non_listing_volume" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "total_change_percent" DECIMAL(20,4),
    "primary_change_percent" DECIMAL(20,4),
    "secondary_change_percent" DECIMAL(20,4),
    "listing_change_percent" DECIMAL(20,4),
    "non_listing_change_percent" DECIMAL(20,4),
    "source" TEXT NOT NULL DEFAULT 'kse',
    "legacy_id" INTEGER,

    CONSTRAINT "trade_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_months" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "total_volume" DECIMAL(20,4) NOT NULL,
    "securities_count" BIGINT NOT NULL DEFAULT 0,
    "deals_count" INTEGER NOT NULL DEFAULT 0,
    "primary_volume" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "secondary_volume" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "listing_volume" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "non_listing_volume" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "legacy_id" INTEGER,

    CONSTRAINT "trade_months_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_trade_days" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isin" TEXT NOT NULL,
    "security_id" TEXT,
    "deals_count" INTEGER NOT NULL DEFAULT 0,
    "quantity" BIGINT NOT NULL DEFAULT 0,
    "volume" DECIMAL(20,4) NOT NULL,
    "min_price" DECIMAL(20,4),
    "max_price" DECIMAL(20,4),
    "open_price" DECIMAL(20,4),
    "close_price" DECIMAL(20,4),
    "source" TEXT NOT NULL DEFAULT 'kse',

    CONSTRAINT "security_trade_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "isin" TEXT NOT NULL DEFAULT '',
    "security_id" TEXT,
    "buy_amount" DECIMAL(20,4),
    "buy_price" DECIMAL(20,4),
    "sell_amount" DECIMAL(20,4),
    "sell_price" DECIMAL(20,4),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "index_values" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "value" DECIMAL(20,4) NOT NULL,
    "change_percent" DECIMAL(20,4),
    "capitalization" DECIMAL(24,4),
    "legacy_id" INTEGER,

    CONSTRAINT "index_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_rates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "rate" DECIMAL(20,6) NOT NULL,
    "change_percent" DECIMAL(20,4),
    "legacy_id" INTEGER,

    CONSTRAINT "currency_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gcb_auctions" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "security_code" TEXT NOT NULL,
    "supply" DECIMAL(20,4),
    "demand" DECIMAL(20,4),
    "satisfied" DECIMAL(20,4),
    "min_yield" DECIMAL(20,4),
    "max_yield" DECIMAL(20,4),
    "avg_yield" DECIMAL(20,4),
    "coupon_rate" DECIMAL(20,4),
    "legacy_id" INTEGER,

    CONSTRAINT "gcb_auctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gcb_volumes" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "volume" DECIMAL(20,4) NOT NULL,
    "legacy_id" INTEGER,

    CONSTRAINT "gcb_volumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nbkr_bill_results" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "ask" DECIMAL(20,4),
    "bid" DECIMAL(20,4),
    "min_yield" DECIMAL(20,4),
    "max_yield" DECIMAL(20,4),
    "avg_yield" DECIMAL(20,4),

    CONSTRAINT "nbkr_bill_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commodity_prices" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "price" DECIMAL(20,4),
    "bid" DECIMAL(20,4),
    "ask" DECIMAL(20,4),

    CONSTRAINT "commodity_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_ratings" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "member_short" TEXT NOT NULL,
    "member_full" TEXT NOT NULL DEFAULT '',
    "volume" DECIMAL(24,4) NOT NULL DEFAULT 0,
    "instruments_count" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "market_deals_count" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "market_deals_volume" DECIMAL(24,4) NOT NULL DEFAULT 0,
    "factor_volume" DECIMAL(20,6),
    "factor_amount" DECIMAL(20,6),
    "factor_instruments" DECIMAL(20,6),
    "factor_market_amount" DECIMAL(20,6),
    "factor_market_volume" DECIMAL(20,6),
    "amount" INTEGER NOT NULL DEFAULT 0,
    "factor" DECIMAL(20,6),

    CONSTRAINT "member_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quik_classes" (
    "id" TEXT NOT NULL,
    "trade_date" DATE NOT NULL,
    "class_code" TEXT NOT NULL,
    "class_name" TEXT NOT NULL DEFAULT '',
    "firms_id" TEXT NOT NULL DEFAULT '',
    "flags" TEXT NOT NULL DEFAULT '',
    "class_type" TEXT NOT NULL DEFAULT '',
    "class_sub_type" TEXT NOT NULL DEFAULT '',
    "common_behavior" TEXT NOT NULL DEFAULT '',
    "specific_behavior" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "quik_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quik_securities" (
    "id" TEXT NOT NULL,
    "trade_date" DATE NOT NULL,
    "class_code" TEXT NOT NULL,
    "sec_code" TEXT NOT NULL,
    "face_unit" TEXT NOT NULL DEFAULT '',
    "short_name" TEXT NOT NULL DEFAULT '',
    "full_name" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "quik_securities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quik_params" (
    "id" TEXT NOT NULL,
    "trade_date" DATE NOT NULL,
    "class_code" TEXT NOT NULL,
    "sec_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '',
    "trading_status" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "quik_params_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quik_trades" (
    "id" TEXT NOT NULL,
    "class_code" TEXT NOT NULL,
    "sec_code" TEXT NOT NULL,
    "price" DECIMAL(20,6) NOT NULL,
    "quantity" DECIMAL(20,4) NOT NULL,
    "value" DECIMAL(24,4) NOT NULL,
    "traded_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "quik_trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quik_orders" (
    "id" TEXT NOT NULL,
    "order_num" TEXT NOT NULL,
    "class_code" TEXT NOT NULL,
    "sec_code" TEXT NOT NULL,
    "price" DECIMAL(20,6) NOT NULL,
    "quantity" DECIMAL(20,4) NOT NULL,
    "value" DECIMAL(24,4) NOT NULL,
    "operation" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "ordered_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "quik_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "securities_isin_key" ON "securities"("isin");

-- CreateIndex
CREATE UNIQUE INDEX "securities_symbol_key" ON "securities"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "securities_legacy_id_key" ON "securities"("legacy_id");

-- CreateIndex
CREATE INDEX "securities_issuer_slug_idx" ON "securities"("issuer_slug");

-- CreateIndex
CREATE INDEX "securities_listing_code_idx" ON "securities"("listing_code");

-- CreateIndex
CREATE INDEX "reports_issuer_slug_type_report_date_idx" ON "reports"("issuer_slug", "type", "report_date");

-- CreateIndex
CREATE UNIQUE INDEX "reports_source_legacy_id_key" ON "reports"("source", "legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "fin_market_issues_legacy_id_key" ON "fin_market_issues"("legacy_id");

-- CreateIndex
CREATE INDEX "fin_market_issues_date_idx" ON "fin_market_issues"("date");

-- CreateIndex
CREATE UNIQUE INDEX "business_catalog_legacy_id_key" ON "business_catalog"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_subscribers_chat_id_key" ON "telegram_subscribers"("chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "trade_days_date_key" ON "trade_days"("date");

-- CreateIndex
CREATE UNIQUE INDEX "trade_days_legacy_id_key" ON "trade_days"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "trade_months_legacy_id_key" ON "trade_months"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "trade_months_year_month_key" ON "trade_months"("year", "month");

-- CreateIndex
CREATE INDEX "security_trade_days_security_id_date_idx" ON "security_trade_days"("security_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "security_trade_days_date_isin_key" ON "security_trade_days"("date", "isin");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_symbol_key" ON "quotes"("symbol");

-- CreateIndex
CREATE INDEX "quotes_security_id_idx" ON "quotes"("security_id");

-- CreateIndex
CREATE UNIQUE INDEX "index_values_code_date_key" ON "index_values"("code", "date");

-- CreateIndex
CREATE UNIQUE INDEX "currency_rates_legacy_id_key" ON "currency_rates"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "currency_rates_code_date_key" ON "currency_rates"("code", "date");

-- CreateIndex
CREATE UNIQUE INDEX "gcb_auctions_legacy_id_key" ON "gcb_auctions"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "gcb_auctions_date_security_code_key" ON "gcb_auctions"("date", "security_code");

-- CreateIndex
CREATE UNIQUE INDEX "gcb_volumes_kind_date_key" ON "gcb_volumes"("kind", "date");

-- CreateIndex
CREATE UNIQUE INDEX "nbkr_bill_results_kind_date_key" ON "nbkr_bill_results"("kind", "date");

-- CreateIndex
CREATE UNIQUE INDEX "commodity_prices_code_date_key" ON "commodity_prices"("code", "date");

-- CreateIndex
CREATE UNIQUE INDEX "member_ratings_year_member_short_key" ON "member_ratings"("year", "member_short");

-- CreateIndex
CREATE UNIQUE INDEX "quik_classes_class_code_trade_date_key" ON "quik_classes"("class_code", "trade_date");

-- CreateIndex
CREATE UNIQUE INDEX "quik_securities_class_code_sec_code_trade_date_key" ON "quik_securities"("class_code", "sec_code", "trade_date");

-- CreateIndex
CREATE UNIQUE INDEX "quik_params_class_code_sec_code_trade_date_key" ON "quik_params"("class_code", "sec_code", "trade_date");

-- CreateIndex
CREATE UNIQUE INDEX "quik_trades_class_code_sec_code_traded_at_price_quantity_va_key" ON "quik_trades"("class_code", "sec_code", "traded_at", "price", "quantity", "value");

-- CreateIndex
CREATE UNIQUE INDEX "quik_orders_order_num_key" ON "quik_orders"("order_num");

-- CreateIndex
CREATE INDEX "quik_orders_class_code_sec_code_idx" ON "quik_orders"("class_code", "sec_code");

-- CreateIndex
CREATE UNIQUE INDEX "issuers_legacy_id_key" ON "issuers"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_legacy_id_key" ON "listing"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "news_legacy_id_key" ON "news"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "pages_legacy_id_key" ON "pages"("legacy_id");

-- AddForeignKey
ALTER TABLE "securities" ADD CONSTRAINT "securities_issuer_slug_fkey" FOREIGN KEY ("issuer_slug") REFERENCES "issuers"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "securities" ADD CONSTRAINT "securities_listing_code_fkey" FOREIGN KEY ("listing_code") REFERENCES "listing"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_issuer_slug_fkey" FOREIGN KEY ("issuer_slug") REFERENCES "issuers"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_trade_days" ADD CONSTRAINT "security_trade_days_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "securities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "securities"("id") ON DELETE SET NULL ON UPDATE CASCADE;





