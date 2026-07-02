-- Ana sayfa öne çıkan bannerlar (mobil / tablet / web)
CREATE TABLE "home_banners" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "image_mobile" TEXT NOT NULL,
    "image_tablet" TEXT NOT NULL,
    "image_desktop" TEXT NOT NULL,
    "link_url" TEXT,
    "event_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_banners_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "home_banners_is_active_sort_order_idx" ON "home_banners"("is_active", "sort_order");
CREATE INDEX "home_banners_deleted_at_idx" ON "home_banners"("deleted_at");

ALTER TABLE "home_banners" ADD CONSTRAINT "home_banners_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
