-- Artist hero + group strip
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "cover_image" TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "strip_image" TEXT;

-- Venue gallery
ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Event gallery + marketing / sponsor assets
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "media_assets" JSONB NOT NULL DEFAULT '{}';
