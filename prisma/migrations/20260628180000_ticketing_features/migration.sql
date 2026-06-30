-- Ticketing features: coupons, wallet passes, gate open time, token nonce

ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "gate_open_time" TIMESTAMP(3);

ALTER TABLE "purchased_tickets" ADD COLUMN IF NOT EXISTS "token_nonce" TEXT;

CREATE TABLE IF NOT EXISTS "coupons" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "event_id" UUID,
    "organizer_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "min_order" DOUBLE PRECISION,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "wallet_passes" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "pass_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_passes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_event_id_key" ON "coupons"("code", "event_id");
CREATE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons"("code");
CREATE INDEX IF NOT EXISTS "coupons_organizer_id_idx" ON "coupons"("organizer_id");
CREATE INDEX IF NOT EXISTS "coupons_deleted_at_idx" ON "coupons"("deleted_at");

CREATE UNIQUE INDEX IF NOT EXISTS "wallet_passes_ticket_id_platform_key" ON "wallet_passes"("ticket_id", "platform");
CREATE INDEX IF NOT EXISTS "wallet_passes_ticket_id_idx" ON "wallet_passes"("ticket_id");

DO $$ BEGIN
  ALTER TABLE "coupons" ADD CONSTRAINT "coupons_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "coupons" ADD CONSTRAINT "coupons_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "wallet_passes" ADD CONSTRAINT "wallet_passes_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "purchased_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
