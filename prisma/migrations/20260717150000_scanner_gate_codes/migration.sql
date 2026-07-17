-- Kapı ekibi erişim kodu: kısa, paylaşılabilir kod (uzun JWT yerine DB'de saklanır)
CREATE TABLE IF NOT EXISTS "scanner_gate_codes" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "organizer_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scanner_gate_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "scanner_gate_codes_code_key" ON "scanner_gate_codes"("code");
CREATE INDEX IF NOT EXISTS "scanner_gate_codes_organizer_id_expires_at_idx" ON "scanner_gate_codes"("organizer_id", "expires_at");
CREATE INDEX IF NOT EXISTS "scanner_gate_codes_expires_at_idx" ON "scanner_gate_codes"("expires_at");
