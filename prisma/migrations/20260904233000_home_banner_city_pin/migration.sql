-- AlterTable
ALTER TABLE "home_banners" ADD COLUMN IF NOT EXISTS "city_slug" TEXT;
ALTER TABLE "home_banners" ADD COLUMN IF NOT EXISTS "is_pinned" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "home_banners_city_slug_is_active_idx" ON "home_banners"("city_slug", "is_active");
