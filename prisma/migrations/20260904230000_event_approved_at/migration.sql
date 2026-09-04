-- AlterTable
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP(3);

-- Daha önce yayınlanmış / tamamlanmış etkinlikler onay geçmişi sayılır
UPDATE "events"
SET "approved_at" = COALESCE("updated_at", "created_at")
WHERE "approved_at" IS NULL
  AND "listing_type" = 'internal'
  AND "status" IN ('published', 'completed');
