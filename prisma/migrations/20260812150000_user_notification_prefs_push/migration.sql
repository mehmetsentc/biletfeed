-- User notification preferences + push device tokens
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notify_email" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notify_sms" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notify_push" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notify_newsletter" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "push_device_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'web',
    "user_agent" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_device_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "push_device_tokens_token_key" ON "push_device_tokens"("token");
CREATE INDEX IF NOT EXISTS "push_device_tokens_user_id_idx" ON "push_device_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "push_device_tokens_deleted_at_idx" ON "push_device_tokens"("deleted_at");

DO $$ BEGIN
  ALTER TABLE "push_device_tokens"
    ADD CONSTRAINT "push_device_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
