-- AlterTable
ALTER TABLE "newsletter_subscribers" ADD COLUMN "city_slug" TEXT;
ALTER TABLE "newsletter_subscribers" ADD COLUMN "city_name" TEXT;
ALTER TABLE "newsletter_subscribers" ADD COLUMN "last_digest_sent_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "newsletter_subscribers_city_slug_idx" ON "newsletter_subscribers"("city_slug");
