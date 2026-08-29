-- AlterTable
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "sale_campaign_type" TEXT NOT NULL DEFAULT 'percent';
