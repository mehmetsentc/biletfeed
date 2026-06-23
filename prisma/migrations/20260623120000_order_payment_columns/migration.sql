-- Order payment flow columns (checkout / mock provider)

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_session_id" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP(3);
