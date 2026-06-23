-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('sent', 'viewed', 'cancelled');

-- CreateTable
CREATE TABLE "event_invitations" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "organizer_id" UUID NOT NULL,
    "purchased_ticket_id" UUID NOT NULL,
    "ticket_type_id" UUID NOT NULL,
    "guest_name" TEXT NOT NULL,
    "guest_email" TEXT,
    "guest_phone" TEXT,
    "invite_token" TEXT NOT NULL,
    "personal_message" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'sent',
    "viewed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_invitations_purchased_ticket_id_key" ON "event_invitations"("purchased_ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_invitations_invite_token_key" ON "event_invitations"("invite_token");

-- CreateIndex
CREATE INDEX "event_invitations_event_id_idx" ON "event_invitations"("event_id");

-- CreateIndex
CREATE INDEX "event_invitations_organizer_id_idx" ON "event_invitations"("organizer_id");

-- CreateIndex
CREATE INDEX "event_invitations_status_idx" ON "event_invitations"("status");

-- CreateIndex
CREATE INDEX "event_invitations_deleted_at_idx" ON "event_invitations"("deleted_at");

-- AddForeignKey
ALTER TABLE "event_invitations" ADD CONSTRAINT "event_invitations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_invitations" ADD CONSTRAINT "event_invitations_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_invitations" ADD CONSTRAINT "event_invitations_purchased_ticket_id_fkey" FOREIGN KEY ("purchased_ticket_id") REFERENCES "purchased_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_invitations" ADD CONSTRAINT "event_invitations_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
