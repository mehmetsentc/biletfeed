-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cart_group_id" UUID;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_cart_group_id_idx" ON "orders"("cart_group_id");
