-- Muhasebe operasyon paketi: hakediş ödeme/iptal, gelir ters kayıt, giderler, P&L

ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE "RevenueRecognitionStatus" ADD VALUE IF NOT EXISTS 'reversed';

ALTER TABLE "organizer_payouts"
  ADD COLUMN IF NOT EXISTS "payment_ref" TEXT,
  ADD COLUMN IF NOT EXISTS "paid_by" TEXT,
  ADD COLUMN IF NOT EXISTS "iban_snapshot" TEXT;

CREATE TYPE "AccountingExpenseCategory" AS ENUM (
  'psp_fee',
  'marketing',
  'venue',
  'staff',
  'software',
  'other'
);

CREATE TABLE IF NOT EXISTS "accounting_expenses" (
    "id" UUID NOT NULL,
    "event_id" UUID,
    "organizer_id" UUID,
    "category" "AccountingExpenseCategory" NOT NULL DEFAULT 'other',
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "vat_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'TRY',
    "incurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accounting_expenses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "accounting_expenses_event_id_idx" ON "accounting_expenses"("event_id");
CREATE INDEX IF NOT EXISTS "accounting_expenses_organizer_id_idx" ON "accounting_expenses"("organizer_id");
CREATE INDEX IF NOT EXISTS "accounting_expenses_category_idx" ON "accounting_expenses"("category");
CREATE INDEX IF NOT EXISTS "accounting_expenses_incurred_at_idx" ON "accounting_expenses"("incurred_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'accounting_expenses_event_id_fkey'
  ) THEN
    ALTER TABLE "accounting_expenses"
      ADD CONSTRAINT "accounting_expenses_event_id_fkey"
      FOREIGN KEY ("event_id") REFERENCES "events"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'accounting_expenses_organizer_id_fkey'
  ) THEN
    ALTER TABLE "accounting_expenses"
      ADD CONSTRAINT "accounting_expenses_organizer_id_fkey"
      FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
