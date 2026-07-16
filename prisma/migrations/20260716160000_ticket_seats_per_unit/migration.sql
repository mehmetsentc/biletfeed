-- Paket / masa bileti: tek satın alımda birden fazla QR
ALTER TABLE "ticket_types"
ADD COLUMN IF NOT EXISTS "seats_per_unit" INTEGER NOT NULL DEFAULT 1;

-- SOLSTICE etkinliği: capacity aslında kişi sayısıydı → seats_per_unit'e taşı, stok=1
UPDATE "ticket_types" tt
SET
  "seats_per_unit" = GREATEST(tt."capacity", 1),
  "capacity" = 1,
  "quantity" = 1
FROM "events" e
WHERE tt."event_id" = e."id"
  AND e."id" = '8c9fd920-16d4-4e5a-9d7d-04ace93350a5'
  AND tt."deleted_at" IS NULL
  AND tt."sold" = 0
  AND tt."capacity" IN (4, 6, 8, 10)
  AND tt."seats_per_unit" = 1;
