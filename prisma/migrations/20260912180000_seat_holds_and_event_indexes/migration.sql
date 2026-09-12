-- Checkout sırasında koltuk kilidi (çift satış önleme)
CREATE TABLE "seat_holds" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "seat_unit_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seat_holds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "seat_holds_event_id_seat_unit_id_key" ON "seat_holds"("event_id", "seat_unit_id");
CREATE INDEX "seat_holds_order_id_idx" ON "seat_holds"("order_id");
CREATE INDEX "seat_holds_expires_at_idx" ON "seat_holds"("expires_at");

ALTER TABLE "seat_holds" ADD CONSTRAINT "seat_holds_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seat_holds" ADD CONSTRAINT "seat_holds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Public event listing filtreleri
CREATE INDEX "events_status_deleted_at_start_date_idx" ON "events"("status", "deleted_at", "start_date");
CREATE INDEX "events_status_listing_type_deleted_at_start_date_idx" ON "events"("status", "listing_type", "deleted_at", "start_date");

-- Koltuk sorgu hızı
CREATE INDEX "purchased_tickets_event_id_seat_unit_id_idx" ON "purchased_tickets"("event_id", "seat_unit_id");
