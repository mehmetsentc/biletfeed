-- Organizer panel: venues, moderation, support, settings fields

ALTER TABLE "organizers" ADD COLUMN IF NOT EXISTS "contact_email" TEXT;
ALTER TABLE "organizers" ADD COLUMN IF NOT EXISTS "contact_phone" TEXT;
ALTER TABLE "organizers" ADD COLUMN IF NOT EXISTS "notify_email" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "organizers" ADD COLUMN IF NOT EXISTS "notify_sms" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "organizer_id" UUID;
ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "seat_plan" JSONB NOT NULL DEFAULT '{}';

DO $$ BEGIN
  ALTER TABLE "venues" ADD CONSTRAINT "venues_organizer_id_fkey"
    FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "venues_organizer_id_idx" ON "venues"("organizer_id");

ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "is_hidden" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "reviews_is_hidden_idx" ON "reviews"("is_hidden");

DO $$ BEGIN
  CREATE TYPE "SupportTicketStatus" AS ENUM ('open', 'replied', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "organizer_support_tickets" (
  "id" UUID NOT NULL,
  "organizer_id" UUID NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'open',
  "reply" TEXT,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organizer_support_tickets_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "organizer_support_tickets" ADD CONSTRAINT "organizer_support_tickets_organizer_id_fkey"
    FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "organizer_support_tickets_organizer_id_idx" ON "organizer_support_tickets"("organizer_id");
CREATE INDEX IF NOT EXISTS "organizer_support_tickets_status_idx" ON "organizer_support_tickets"("status");
CREATE INDEX IF NOT EXISTS "organizer_support_tickets_deleted_at_idx" ON "organizer_support_tickets"("deleted_at");
