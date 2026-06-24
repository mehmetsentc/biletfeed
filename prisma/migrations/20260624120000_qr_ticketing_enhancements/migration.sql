-- QR ticketing: entry policy, check-ins, attendee fields, extended ticket types

CREATE TYPE "EntryPolicy" AS ENUM ('single', 'multiple', 'unlimited');

ALTER TYPE "TicketTypeEnum" ADD VALUE IF NOT EXISTS 'invitation';
ALTER TYPE "TicketTypeEnum" ADD VALUE IF NOT EXISTS 'media';
ALTER TYPE "TicketTypeEnum" ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE "TicketTypeEnum" ADD VALUE IF NOT EXISTS 'sponsor';

ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "entry_policy" "EntryPolicy" NOT NULL DEFAULT 'single';

ALTER TABLE "purchased_tickets" ADD COLUMN IF NOT EXISTS "attendee_name" TEXT;
ALTER TABLE "purchased_tickets" ADD COLUMN IF NOT EXISTS "attendee_email" TEXT;
ALTER TABLE "purchased_tickets" ADD COLUMN IF NOT EXISTS "download_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "purchased_tickets" ADD COLUMN IF NOT EXISTS "entry_count" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "ticket_check_ins" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "checked_by" TEXT NOT NULL,
    "device" TEXT,
    "ip_address" TEXT,
    "scanner_id" TEXT,
    "result" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_check_ins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ticket_transfers" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "from_user_id" UUID NOT NULL,
    "to_user_id" UUID,
    "to_email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "ticket_transfers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ticket_check_ins_ticket_id_idx" ON "ticket_check_ins"("ticket_id");
CREATE INDEX IF NOT EXISTS "ticket_check_ins_event_id_idx" ON "ticket_check_ins"("event_id");
CREATE INDEX IF NOT EXISTS "ticket_check_ins_created_at_idx" ON "ticket_check_ins"("created_at");

CREATE INDEX IF NOT EXISTS "ticket_transfers_ticket_id_idx" ON "ticket_transfers"("ticket_id");
CREATE INDEX IF NOT EXISTS "ticket_transfers_from_user_id_idx" ON "ticket_transfers"("from_user_id");
CREATE INDEX IF NOT EXISTS "ticket_transfers_status_idx" ON "ticket_transfers"("status");

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "attendee_name" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "attendee_email" TEXT;

ALTER TABLE "ticket_check_ins" DROP CONSTRAINT IF EXISTS "ticket_check_ins_ticket_id_fkey";
ALTER TABLE "ticket_check_ins" ADD CONSTRAINT "ticket_check_ins_ticket_id_fkey"
  FOREIGN KEY ("ticket_id") REFERENCES "purchased_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ticket_check_ins" DROP CONSTRAINT IF EXISTS "ticket_check_ins_event_id_fkey";
ALTER TABLE "ticket_check_ins" ADD CONSTRAINT "ticket_check_ins_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ticket_transfers" DROP CONSTRAINT IF EXISTS "ticket_transfers_ticket_id_fkey";
ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_ticket_id_fkey"
  FOREIGN KEY ("ticket_id") REFERENCES "purchased_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
