-- CreateEnum
CREATE TYPE "ticket_status" AS ENUM ('valid', 'used', 'cancelled');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('awaiting_payment', 'paid', 'expired', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "charge_origin_type" AS ENUM ('order');

-- CreateEnum
CREATE TYPE "charge_method" AS ENUM ('card', 'pix');

-- CreateEnum
CREATE TYPE "charge_status" AS ENUM ('pending', 'authorized', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded');

-- CreateEnum
CREATE TYPE "payment_provider" AS ENUM ('fake');

-- CreateEnum
CREATE TYPE "refund_reason" AS ENUM ('buyer_request', 'event_cancelled', 'late_payment', 'duplicate');

-- CreateEnum
CREATE TYPE "refund_status" AS ENUM ('pending', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "dispute_status" AS ENUM ('open', 'won', 'lost');

-- DropForeignKey
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_payment_method_id_fkey";

-- AlterTable
ALTER TABLE "ticket" ADD COLUMN     "code" TEXT,
ADD COLUMN     "order_item_id" UUID,
ADD COLUMN     "status" "ticket_status" NOT NULL DEFAULT 'valid',
ADD COLUMN     "used_at" TIMESTAMP(3),
ALTER COLUMN "payment_method_id" DROP NOT NULL;

-- Ingressos anteriores aos pedidos ganham um código aleatório
UPDATE "ticket" SET "code" = md5(random()::text || "id"::text);
ALTER TABLE "ticket" ALTER COLUMN "code" SET NOT NULL;

-- CreateTable
CREATE TABLE "order" (
    "id" UUID NOT NULL,
    "buyer_id" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,
    "status" "order_status" NOT NULL,
    "subtotal_cents" INTEGER NOT NULL,
    "discount_cents" INTEGER NOT NULL DEFAULT 0,
    "total_cents" INTEGER NOT NULL,
    "platform_fee_cents" INTEGER NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'BRL',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "paid_charge_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "lot_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charge" (
    "id" UUID NOT NULL,
    "origin_type" "charge_origin_type" NOT NULL,
    "origin_id" UUID NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "method" "charge_method" NOT NULL,
    "status" "charge_status" NOT NULL,
    "provider" "payment_provider" NOT NULL,
    "provider_charge_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "pix_qr_code" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund" (
    "id" UUID NOT NULL,
    "charge_id" UUID NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "reason" "refund_reason" NOT NULL,
    "status" "refund_status" NOT NULL,
    "provider_refund_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute" (
    "id" UUID NOT NULL,
    "charge_id" UUID NOT NULL,
    "provider_dispute_id" TEXT NOT NULL,
    "status" "dispute_status" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_event" (
    "id" UUID NOT NULL,
    "provider" "payment_provider" NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,

    CONSTRAINT "webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_message" (
    "consumer" TEXT NOT NULL,
    "message_id" UUID NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_message_pkey" PRIMARY KEY ("consumer","message_id")
);

-- CreateIndex
CREATE INDEX "order_buyer_id_idx" ON "order"("buyer_id");

-- CreateIndex
CREATE INDEX "order_event_id_status_idx" ON "order"("event_id", "status");

-- CreateIndex
CREATE INDEX "order_status_expires_at_idx" ON "order"("status", "expires_at");

-- CreateIndex
CREATE INDEX "order_item_order_id_idx" ON "order_item"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "charge_idempotency_key_key" ON "charge"("idempotency_key");

-- CreateIndex
CREATE INDEX "charge_origin_type_origin_id_idx" ON "charge"("origin_type", "origin_id");

-- CreateIndex
CREATE UNIQUE INDEX "charge_provider_provider_charge_id_key" ON "charge"("provider", "provider_charge_id");

-- CreateIndex
CREATE UNIQUE INDEX "refund_idempotency_key_key" ON "refund"("idempotency_key");

-- CreateIndex
CREATE INDEX "refund_charge_id_idx" ON "refund"("charge_id");

-- CreateIndex
CREATE INDEX "refund_provider_refund_id_idx" ON "refund"("provider_refund_id");

-- CreateIndex
CREATE UNIQUE INDEX "dispute_provider_dispute_id_key" ON "dispute"("provider_dispute_id");

-- CreateIndex
CREATE INDEX "dispute_charge_id_idx" ON "dispute"("charge_id");

-- CreateIndex
CREATE INDEX "webhook_event_processed_at_received_at_idx" ON "webhook_event"("processed_at", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_event_provider_provider_event_id_key" ON "webhook_event"("provider", "provider_event_id");

-- CreateIndex
CREATE INDEX "outbox_published_at_created_at_idx" ON "outbox"("published_at", "created_at");

-- CreateIndex
CREATE INDEX "outbox_processed_at_published_at_idx" ON "outbox"("processed_at", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_code_key" ON "ticket"("code");

-- CreateIndex
CREATE INDEX "ticket_order_item_id_idx" ON "ticket"("order_item_id");

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_method"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- O Prisma não modela CHECK
ALTER TABLE "order" ADD CONSTRAINT "order_cents_check" CHECK ("subtotal_cents" >= 0 AND "total_cents" >= 0);
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_quantity_check" CHECK ("quantity" > 0);
ALTER TABLE "charge" ADD CONSTRAINT "charge_amount_cents_check" CHECK ("amount_cents" > 0);
ALTER TABLE "refund" ADD CONSTRAINT "refund_amount_cents_check" CHECK ("amount_cents" > 0);
