-- CreateTable
CREATE TABLE "transaction_feedback" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "original_category_id" INTEGER,
    "corrected_category_id" INTEGER NOT NULL,
    "feedback_type" VARCHAR(50) NOT NULL,
    "confidence_rating" SMALLINT,
    "feedback_notes" TEXT,
    "transaction_description" TEXT NOT NULL,
    "merchant_name" TEXT,
    "source" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ,
    "is_processed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "transaction_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_patterns" (
    "id" UUID NOT NULL,
    "pattern_type" VARCHAR(50) NOT NULL,
    "pattern_key" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "confidence_score" DECIMAL(5,2) NOT NULL,
    "occurrence_count" INTEGER NOT NULL DEFAULT 1,
    "success_count" INTEGER NOT NULL DEFAULT 1,
    "last_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "feedback_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_analytics" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "analysis_period" DATE NOT NULL,
    "period_type" VARCHAR(20) NOT NULL,
    "total_corrections" INTEGER NOT NULL DEFAULT 0,
    "accuracy_improvement" DECIMAL(5,2),
    "most_corrected_category" INTEGER,
    "avg_user_confidence" DECIMAL(5,2),
    "corrections_by_source" JSONB,
    "top_patterns_learned" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transaction_feedback_user_id_created_at_idx" ON "transaction_feedback"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "transaction_feedback_transaction_id_idx" ON "transaction_feedback"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_feedback_feedback_type_idx" ON "transaction_feedback"("feedback_type");

-- CreateIndex
CREATE INDEX "transaction_feedback_is_processed_idx" ON "transaction_feedback"("is_processed");

-- CreateIndex
CREATE INDEX "transaction_feedback_merchant_name_idx" ON "transaction_feedback"("merchant_name");

-- CreateIndex
CREATE INDEX "feedback_patterns_pattern_type_pattern_key_idx" ON "feedback_patterns"("pattern_type", "pattern_key");

-- CreateIndex
CREATE INDEX "feedback_patterns_confidence_score_idx" ON "feedback_patterns"("confidence_score" DESC);

-- CreateIndex
CREATE INDEX "feedback_patterns_last_seen_at_idx" ON "feedback_patterns"("last_seen_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "feedback_patterns_pattern_type_pattern_key_category_id_key" ON "feedback_patterns"("pattern_type", "pattern_key", "category_id");

-- CreateIndex
CREATE INDEX "feedback_analytics_analysis_period_idx" ON "feedback_analytics"("analysis_period" DESC);

-- CreateIndex
CREATE INDEX "feedback_analytics_period_type_idx" ON "feedback_analytics"("period_type");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_analytics_user_id_analysis_period_period_type_key" ON "feedback_analytics"("user_id", "analysis_period", "period_type");

-- AddForeignKey
ALTER TABLE "transaction_feedback" ADD CONSTRAINT "transaction_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_feedback" ADD CONSTRAINT "transaction_feedback_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_feedback" ADD CONSTRAINT "transaction_feedback_original_category_id_fkey" FOREIGN KEY ("original_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_feedback" ADD CONSTRAINT "transaction_feedback_corrected_category_id_fkey" FOREIGN KEY ("corrected_category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_patterns" ADD CONSTRAINT "feedback_patterns_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_analytics" ADD CONSTRAINT "feedback_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_analytics" ADD CONSTRAINT "feedback_analytics_most_corrected_category_fkey" FOREIGN KEY ("most_corrected_category") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
