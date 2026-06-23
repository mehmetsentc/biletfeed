-- User support tickets
CREATE TABLE "user_support_tickets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'open',
    "reply" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_support_tickets_user_id_idx" ON "user_support_tickets"("user_id");
CREATE INDEX "user_support_tickets_status_idx" ON "user_support_tickets"("status");
CREATE INDEX "user_support_tickets_deleted_at_idx" ON "user_support_tickets"("deleted_at");

ALTER TABLE "user_support_tickets" ADD CONSTRAINT "user_support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
