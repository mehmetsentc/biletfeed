-- CreateTable
CREATE TABLE "artists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "type" TEXT NOT NULL DEFAULT 'person',
    "social_links" JSONB NOT NULL DEFAULT '{}',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "follower_count" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_follows" (
    "user_id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_follows_pkey" PRIMARY KEY ("user_id","artist_id")
);

-- CreateTable
CREATE TABLE "event_artists" (
    "event_id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "event_artists_pkey" PRIMARY KEY ("event_id","artist_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "artists_slug_key" ON "artists"("slug");
CREATE INDEX "artists_slug_idx" ON "artists"("slug");
CREATE INDEX "artists_deleted_at_idx" ON "artists"("deleted_at");

-- CreateIndex
CREATE INDEX "artist_follows_user_id_idx" ON "artist_follows"("user_id");
CREATE INDEX "artist_follows_artist_id_idx" ON "artist_follows"("artist_id");

-- CreateIndex
CREATE INDEX "event_artists_event_id_idx" ON "event_artists"("event_id");
CREATE INDEX "event_artists_artist_id_idx" ON "event_artists"("artist_id");

-- AddForeignKey
ALTER TABLE "artist_follows" ADD CONSTRAINT "artist_follows_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "artist_follows" ADD CONSTRAINT "artist_follows_artist_id_fkey"
    FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_artists" ADD CONSTRAINT "event_artists_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_artists" ADD CONSTRAINT "event_artists_artist_id_fkey"
    FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
