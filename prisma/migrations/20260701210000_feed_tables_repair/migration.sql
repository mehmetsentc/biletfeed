-- Repair: feed enum'ları önceki yarım migration'da oluşmuştu, tablolar eksik kaldı.
CREATE TABLE IF NOT EXISTS "feed_categories" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cover_image" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "feed_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "feed_posts" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "headline" TEXT,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "content_type" "FeedPostType" NOT NULL,
    "status" "FeedPostStatus" NOT NULL DEFAULT 'discovered',
    "editorial_stage" "FeedEditorialStage",
    "cover_image" TEXT NOT NULL,
    "author_name" TEXT NOT NULL DEFAULT 'BiletFeed Editör',
    "author_id" UUID,
    "reading_time_minutes" INTEGER NOT NULL DEFAULT 3,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "bookmark_count" INTEGER NOT NULL DEFAULT 0,
    "share_count" INTEGER NOT NULL DEFAULT 0,
    "source_url" TEXT,
    "source_name" TEXT,
    "source_attribution" TEXT,
    "ai_provider" TEXT,
    "ai_model" TEXT,
    "ai_metadata" JSONB NOT NULL DEFAULT '{}',
    "duplicate_of_id" UUID,
    "review_notes" TEXT,
    "seo" JSONB NOT NULL DEFAULT '{}',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "trending_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "feed_category_id" UUID,
    "event_id" UUID,
    "organizer_id" UUID,
    "city_id" UUID,
    "venue_id" UUID,
    "artist_name" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "feed_posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "feed_media" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "type" "FeedMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "alt" TEXT,
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feed_media_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "feed_views" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID,
    "ip_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feed_views_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "feed_likes" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feed_likes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "feed_bookmarks" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feed_bookmarks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "feed_comments" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "parent_id" UUID,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "feed_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "feed_editorial_queue" (
    "id" UUID NOT NULL,
    "source_url" TEXT NOT NULL,
    "source_title" TEXT NOT NULL,
    "source_snippet" TEXT,
    "source_name" TEXT,
    "status" "FeedQueueStatus" NOT NULL DEFAULT 'pending',
    "stage" "FeedEditorialStage" NOT NULL DEFAULT 'discovery',
    "post_id" UUID,
    "ai_analysis" JSONB NOT NULL DEFAULT '{}',
    "error_message" TEXT,
    "content_hash" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "feed_editorial_queue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "feed_trending" (
    "id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL DEFAULT 'daily',
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_end" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feed_trending_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "feed_memories" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "body" TEXT,
    "media_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feed_memories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "feed_discovery_sources" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source_type" TEXT NOT NULL DEFAULT 'rss',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_fetched_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "feed_discovery_sources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "feed_categories_slug_key" ON "feed_categories"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "feed_posts_slug_key" ON "feed_posts"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "feed_likes_post_id_user_id_key" ON "feed_likes"("post_id", "user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "feed_bookmarks_post_id_user_id_key" ON "feed_bookmarks"("post_id", "user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "feed_editorial_queue_content_hash_key" ON "feed_editorial_queue"("content_hash");

DO $$ BEGIN
  ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_feed_category_id_fkey" FOREIGN KEY ("feed_category_id") REFERENCES "feed_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_duplicate_of_id_fkey" FOREIGN KEY ("duplicate_of_id") REFERENCES "feed_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
