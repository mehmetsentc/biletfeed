-- Satışa kapalı davetiye kontenjanı (checkout’ta gizlenir)
ALTER TABLE "ticket_types"
ADD COLUMN IF NOT EXISTS "invitation_only" BOOLEAN NOT NULL DEFAULT false;

-- Adı davetiye olan mevcut türleri satışa kapat
UPDATE "ticket_types"
SET "invitation_only" = true,
    "type" = 'invitation'
WHERE "deleted_at" IS NULL
  AND (
    "type" = 'invitation'
    OR LOWER("name") LIKE '%davetiye%'
    OR LOWER("name") LIKE '%invitation%'
    OR LOWER("name") LIKE '%invite%'
  );

-- Kombine: aynı QR’ın aynı günde iki kez VALID check-in olmaması
CREATE UNIQUE INDEX IF NOT EXISTS "ticket_check_ins_ticket_event_valid_key"
ON "ticket_check_ins" ("ticket_id", "event_id")
WHERE "result" = 'VALID';
