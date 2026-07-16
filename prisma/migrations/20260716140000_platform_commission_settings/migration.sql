-- Platform hizmet bedeli ayarları: global varsayılan + organizatör override (nullable)

ALTER TABLE "organizers" ALTER COLUMN "commission_rate" DROP NOT NULL;
ALTER TABLE "organizers" ALTER COLUMN "commission_rate" DROP DEFAULT;

CREATE TABLE "platform_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

INSERT INTO "platform_settings" ("key", "value", "updated_at")
VALUES ('default_commission_rate', '0.06', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
