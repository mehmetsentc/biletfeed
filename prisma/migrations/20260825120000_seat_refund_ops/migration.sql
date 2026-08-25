-- Seat unit id + bank/organizer refund request tables
ALTER TABLE "purchased_tickets" ADD COLUMN IF NOT EXISTS "seat_unit_id" TEXT;
CREATE INDEX IF NOT EXISTS "purchased_tickets_seat_unit_id_idx" ON "purchased_tickets"("seat_unit_id");

DO $$ BEGIN
  CREATE TYPE "BankRefundStatus" AS ENUM ('pending', 'sent', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "OrderRefundRequestStatus" AS ENUM ('pending', 'approved', 'rejected', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "bank_refund_requests" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'TRY',
    "account_holder" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "status" "BankRefundStatus" NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "payment_ref" TEXT,
    "requested_by" TEXT,
    "processed_by" TEXT,
    "sent_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bank_refund_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "bank_refund_requests_order_id_idx" ON "bank_refund_requests"("order_id");
CREATE INDEX IF NOT EXISTS "bank_refund_requests_status_idx" ON "bank_refund_requests"("status");
CREATE INDEX IF NOT EXISTS "bank_refund_requests_created_at_idx" ON "bank_refund_requests"("created_at");

DO $$ BEGIN
  ALTER TABLE "bank_refund_requests"
    ADD CONSTRAINT "bank_refund_requests_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "order_refund_requests" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "organizer_id" UUID NOT NULL,
    "status" "OrderRefundRequestStatus" NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "ticket_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "requested_by" TEXT,
    "reviewed_by" TEXT,
    "review_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "order_refund_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "order_refund_requests_order_id_idx" ON "order_refund_requests"("order_id");
CREATE INDEX IF NOT EXISTS "order_refund_requests_organizer_id_idx" ON "order_refund_requests"("organizer_id");
CREATE INDEX IF NOT EXISTS "order_refund_requests_status_idx" ON "order_refund_requests"("status");

DO $$ BEGIN
  ALTER TABLE "order_refund_requests"
    ADD CONSTRAINT "order_refund_requests_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "order_refund_requests"
    ADD CONSTRAINT "order_refund_requests_organizer_id_fkey"
    FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
