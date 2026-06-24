-- Muhasebe altyapısı: fatura, mutabakat, e-posta, hakediş, gelir tanıma, denetim izi

CREATE TYPE "InvoiceType" AS ENUM ('e_fatura', 'e_arsiv', 'proforma', 'credit_note');
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'issued', 'cancelled');
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('queued', 'sent', 'delivered', 'bounced', 'opened', 'failed');
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'scheduled', 'paid', 'failed');
CREATE TYPE "ReconciliationStatus" AS ENUM ('pending', 'reconciled', 'mismatch');
CREATE TYPE "RevenueRecognitionStatus" AS ENUM ('deferred', 'recognized');

CREATE TABLE "user_billing_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_name" TEXT,
    "tax_office" TEXT,
    "tax_number" TEXT,
    "billing_address" TEXT,
    "is_corporate" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_billing_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "type" "InvoiceType" NOT NULL DEFAULT 'e_arsiv',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'issued',
    "buyer_name" TEXT NOT NULL,
    "buyer_tax_number" TEXT,
    "buyer_tax_office" TEXT,
    "buyer_address" TEXT,
    "subtotal_net" DOUBLE PRECISION NOT NULL,
    "vat_rate" DOUBLE PRECISION NOT NULL,
    "vat_amount" DOUBLE PRECISION NOT NULL,
    "total_gross" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'TRY',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),
    "e_invoice_uuid" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoice_lines" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_net" DOUBLE PRECISION NOT NULL,
    "vat_rate" DOUBLE PRECISION NOT NULL,
    "vat_amount" DOUBLE PRECISION NOT NULL,
    "total_gross" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_reconciliations" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_ref" TEXT,
    "expected_amount" DOUBLE PRECISION NOT NULL,
    "received_amount" DOUBLE PRECISION NOT NULL,
    "fee_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "net_amount" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'TRY',
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'pending',
    "reconciled_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payment_reconciliations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_deliveries" (
    "id" UUID NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'queued',
    "provider" TEXT NOT NULL DEFAULT 'smtp',
    "message_id" TEXT,
    "order_id" UUID,
    "invoice_id" UUID,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "error_message" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "email_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organizer_payouts" (
    "id" UUID NOT NULL,
    "organizer_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "gross_amount" DOUBLE PRECISION NOT NULL,
    "commission_amount" DOUBLE PRECISION NOT NULL,
    "net_amount" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'TRY',
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "scheduled_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organizer_payouts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "revenue_recognitions" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'TRY',
    "event_date" TIMESTAMP(3) NOT NULL,
    "recognized_at" TIMESTAMP(3),
    "status" "RevenueRecognitionStatus" NOT NULL DEFAULT 'deferred',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "revenue_recognitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "accounting_audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "actor_role" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accounting_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_billing_profiles_user_id_key" ON "user_billing_profiles"("user_id");
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");
CREATE INDEX "invoices_order_id_idx" ON "invoices"("order_id");
CREATE INDEX "invoices_user_id_idx" ON "invoices"("user_id");
CREATE INDEX "invoices_status_idx" ON "invoices"("status");
CREATE INDEX "invoices_issued_at_idx" ON "invoices"("issued_at");
CREATE INDEX "invoice_lines_invoice_id_idx" ON "invoice_lines"("invoice_id");
CREATE INDEX "payment_reconciliations_order_id_idx" ON "payment_reconciliations"("order_id");
CREATE INDEX "payment_reconciliations_provider_idx" ON "payment_reconciliations"("provider");
CREATE INDEX "payment_reconciliations_status_idx" ON "payment_reconciliations"("status");
CREATE INDEX "email_deliveries_status_idx" ON "email_deliveries"("status");
CREATE INDEX "email_deliveries_order_id_idx" ON "email_deliveries"("order_id");
CREATE INDEX "email_deliveries_created_at_idx" ON "email_deliveries"("created_at");
CREATE INDEX "organizer_payouts_organizer_id_idx" ON "organizer_payouts"("organizer_id");
CREATE INDEX "organizer_payouts_event_id_idx" ON "organizer_payouts"("event_id");
CREATE INDEX "organizer_payouts_order_id_idx" ON "organizer_payouts"("order_id");
CREATE INDEX "organizer_payouts_status_idx" ON "organizer_payouts"("status");
CREATE INDEX "revenue_recognitions_order_id_idx" ON "revenue_recognitions"("order_id");
CREATE INDEX "revenue_recognitions_status_idx" ON "revenue_recognitions"("status");
CREATE INDEX "revenue_recognitions_event_date_idx" ON "revenue_recognitions"("event_date");
CREATE INDEX "accounting_audit_logs_entity_type_entity_id_idx" ON "accounting_audit_logs"("entity_type", "entity_id");
CREATE INDEX "accounting_audit_logs_action_idx" ON "accounting_audit_logs"("action");
CREATE INDEX "accounting_audit_logs_created_at_idx" ON "accounting_audit_logs"("created_at");

ALTER TABLE "user_billing_profiles" ADD CONSTRAINT "user_billing_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_reconciliations" ADD CONSTRAINT "payment_reconciliations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organizer_payouts" ADD CONSTRAINT "organizer_payouts_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organizer_payouts" ADD CONSTRAINT "organizer_payouts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organizer_payouts" ADD CONSTRAINT "organizer_payouts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "revenue_recognitions" ADD CONSTRAINT "revenue_recognitions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
