-- CreateEnum
CREATE TYPE "RuleCatalogStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "RuleParameterType" AS ENUM ('none', 'age_limit', 'door_time', 'duration', 'dress_code', 'child_policy', 'refund_policy', 'custom_text', 'custom_number');

-- CreateTable
CREATE TABLE "event_rule_categories" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "title_tr" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "description_tr" TEXT,
    "description_en" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "RuleCatalogStatus" NOT NULL DEFAULT 'active',
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_rule_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_rules" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "subcategory" TEXT,
    "title_tr" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "description_tr" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "event_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_recommended" BOOLEAN NOT NULL DEFAULT false,
    "requires_parameter" BOOLEAN NOT NULL DEFAULT false,
    "parameter_type" "RuleParameterType" NOT NULL DEFAULT 'none',
    "parameter_options" JSONB,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "status" "RuleCatalogStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizer_rule_templates" (
    "id" UUID NOT NULL,
    "organizer_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "selected_rule_ids" JSONB NOT NULL DEFAULT '[]',
    "custom_rules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizer_rule_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_rule_sets" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "selected_rules" JSONB NOT NULL DEFAULT '[]',
    "custom_rules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "applied_template_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_rule_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_announcements" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "title_tr" TEXT NOT NULL,
    "title_en" TEXT,
    "content_tr" TEXT NOT NULL,
    "content_en" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_rule_categories_slug_key" ON "event_rule_categories"("slug");

-- CreateIndex
CREATE INDEX "event_rule_categories_status_sort_order_idx" ON "event_rule_categories"("status", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "event_rules_slug_key" ON "event_rules"("slug");

-- CreateIndex
CREATE INDEX "event_rules_category_id_status_sort_order_idx" ON "event_rules"("category_id", "status", "sort_order");

-- CreateIndex
CREATE INDEX "event_rules_status_idx" ON "event_rules"("status");

-- CreateIndex
CREATE INDEX "organizer_rule_templates_organizer_id_sort_order_idx" ON "organizer_rule_templates"("organizer_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "event_rule_sets_event_id_key" ON "event_rule_sets"("event_id");

-- CreateIndex
CREATE INDEX "event_announcements_event_id_sort_order_idx" ON "event_announcements"("event_id", "sort_order");

-- AddForeignKey
ALTER TABLE "event_rules" ADD CONSTRAINT "event_rules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "event_rule_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizer_rule_templates" ADD CONSTRAINT "organizer_rule_templates_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rule_sets" ADD CONSTRAINT "event_rule_sets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_announcements" ADD CONSTRAINT "event_announcements_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
