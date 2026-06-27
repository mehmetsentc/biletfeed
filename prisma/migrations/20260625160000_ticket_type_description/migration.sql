-- Bilet türü açıklaması (organizatör paneli: Genel Alan, Loca vb.)

ALTER TABLE "ticket_types" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';
