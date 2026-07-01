-- CreateTable
CREATE TABLE "venue_follows" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venue_follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "venue_follows_user_id_idx" ON "venue_follows"("user_id");

-- CreateIndex
CREATE INDEX "venue_follows_venue_id_idx" ON "venue_follows"("venue_id");

-- CreateIndex
CREATE UNIQUE INDEX "venue_follows_user_id_venue_id_key" ON "venue_follows"("user_id", "venue_id");

-- AddForeignKey
ALTER TABLE "venue_follows" ADD CONSTRAINT "venue_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_follows" ADD CONSTRAINT "venue_follows_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
