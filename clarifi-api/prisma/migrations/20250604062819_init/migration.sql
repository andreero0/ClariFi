-- CreateTable
CREATE TABLE "users_profile" (
    "id" UUID NOT NULL,
    "auth_user_id" UUID,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "preferred_language" TEXT NOT NULL DEFAULT 'en',
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon_name" TEXT,
    "color_hex" VARCHAR(7),
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchants" (
    "id" UUID NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "category_guess_id" INTEGER,
    "logo_url" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "user_id" UUID,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statement_imports" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "bank_name" TEXT NOT NULL,
    "statement_date" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "file_name" TEXT,
    "file_size" INTEGER,
    "source_type" TEXT NOT NULL,
    "transaction_count" INTEGER,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ,

    CONSTRAINT "statement_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "statement_import_id" UUID,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" TEXT NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "category_id" INTEGER,
    "merchant_id" UUID,
    "notes" TEXT,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_transaction_id" UUID,
    "user_verified_category" BOOLEAN NOT NULL DEFAULT false,
    "user_verified_merchant" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "budget_month" DATE NOT NULL,
    "alert_threshold_percentage" DECIMAL(5,2),
    "is_recurring" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_goals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "target_amount" DECIMAL(12,2) NOT NULL,
    "current_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "target_date" DATE,
    "status" TEXT NOT NULL,
    "description" TEXT,
    "icon_name" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "financial_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "educational_modules" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content_path" TEXT,
    "estimated_duration_minutes" INTEGER,
    "difficulty_level" TEXT,

    CONSTRAINT "educational_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_education_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "completion_percentage" SMALLINT,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "quiz_results" JSONB,

    CONSTRAINT "user_education_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "notification_type" VARCHAR(50) NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "event_type" VARCHAR(100) NOT NULL,
    "event_timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "details" JSONB,
    "status" VARCHAR(20),
    "error_message" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_profile_auth_user_id_key" ON "users_profile"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_profile_email_key" ON "users_profile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "merchants_normalized_name_key" ON "merchants"("normalized_name");

-- CreateIndex
CREATE INDEX "merchants_user_id_idx" ON "merchants"("user_id");

-- CreateIndex
CREATE INDEX "merchants_category_guess_id_idx" ON "merchants"("category_guess_id");

-- CreateIndex
CREATE INDEX "statement_imports_user_id_statement_date_idx" ON "statement_imports"("user_id", "statement_date" DESC);

-- CreateIndex
CREATE INDEX "statement_imports_user_id_status_idx" ON "statement_imports"("user_id", "status");

-- CreateIndex
CREATE INDEX "transactions_user_id_date_idx" ON "transactions"("user_id", "date");

-- CreateIndex
CREATE INDEX "transactions_user_id_category_id_idx" ON "transactions"("user_id", "category_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_merchant_id_idx" ON "transactions"("user_id", "merchant_id");

-- CreateIndex
CREATE INDEX "transactions_statement_import_id_idx" ON "transactions"("statement_import_id");

-- CreateIndex
CREATE INDEX "budgets_user_id_budget_month_idx" ON "budgets"("user_id", "budget_month");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_user_id_category_id_budget_month_key" ON "budgets"("user_id", "category_id", "budget_month");

-- CreateIndex
CREATE INDEX "financial_goals_user_id_idx" ON "financial_goals"("user_id");

-- CreateIndex
CREATE INDEX "financial_goals_user_id_status_idx" ON "financial_goals"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "educational_modules_title_key" ON "educational_modules"("title");

-- CreateIndex
CREATE INDEX "user_education_progress_user_id_idx" ON "user_education_progress"("user_id");

-- CreateIndex
CREATE INDEX "user_education_progress_user_id_status_idx" ON "user_education_progress"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_education_progress_user_id_module_id_key" ON "user_education_progress"("user_id", "module_id");

-- CreateIndex
CREATE INDEX "notification_preferences_user_id_idx" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_notification_type_channel_key" ON "notification_preferences"("user_id", "notification_type", "channel");

-- CreateIndex
CREATE INDEX "audit_log_event_timestamp_idx" ON "audit_log"("event_timestamp" DESC);

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");

-- CreateIndex
CREATE INDEX "audit_log_event_type_idx" ON "audit_log"("event_type");

-- AddForeignKey
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_category_guess_id_fkey" FOREIGN KEY ("category_guess_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statement_imports" ADD CONSTRAINT "statement_imports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_statement_import_id_fkey" FOREIGN KEY ("statement_import_id") REFERENCES "statement_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_goals" ADD CONSTRAINT "financial_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_education_progress" ADD CONSTRAINT "user_education_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_education_progress" ADD CONSTRAINT "user_education_progress_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "educational_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
