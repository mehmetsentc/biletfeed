-- Lightweight editorial analytics: event CTA clicks on feed articles
ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "cta_click_count" INTEGER NOT NULL DEFAULT 0;
