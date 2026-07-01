ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "attendee_tc_kimlik" TEXT;
ALTER TABLE "purchased_tickets" ADD COLUMN IF NOT EXISTS "attendee_tc_kimlik" TEXT;
