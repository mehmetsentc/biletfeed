-- Event automatic % sale discount + venue seat plan draft
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "sale_discount_percent" INTEGER;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "sale_discount_ticket_type_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "sale_discount_active" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "sale_discount_ends_at" TIMESTAMP(3);

ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "seat_plan_draft" JSONB;
ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "seat_plan_draft_meta" JSONB;
