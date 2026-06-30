-- AlterTable
ALTER TABLE "organizers" ADD COLUMN "account_holder_name" TEXT;

-- CreateTable
CREATE TABLE "organizer_billing_profiles" (
    "id" UUID NOT NULL,
    "organizer_id" UUID NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'TRY Hesabı',
    "iban" TEXT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'TRY',
    "company_legal_name" TEXT NOT NULL,
    "tax_office" TEXT NOT NULL,
    "tax_number" TEXT NOT NULL,
    "invoice_address" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizer_billing_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organizer_billing_profiles_organizer_id_idx" ON "organizer_billing_profiles"("organizer_id");

-- CreateIndex
CREATE INDEX "organizer_billing_profiles_deleted_at_idx" ON "organizer_billing_profiles"("deleted_at");

-- AddForeignKey
ALTER TABLE "organizer_billing_profiles" ADD CONSTRAINT "organizer_billing_profiles_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
