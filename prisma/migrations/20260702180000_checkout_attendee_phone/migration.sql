ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "attendee_phone" TEXT;
ALTER TABLE "purchased_tickets" ADD COLUMN IF NOT EXISTS "attendee_phone" TEXT;
