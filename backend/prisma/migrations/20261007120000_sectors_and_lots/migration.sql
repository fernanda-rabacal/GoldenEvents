-- Ingressos antigos não têm lote: aplique com o banco recriado (prisma migrate reset)

-- AlterTable
ALTER TABLE "event" DROP COLUMN "price",
ADD COLUMN     "min_price" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ticket" ADD COLUMN     "lot_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "sector" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lot" (
    "id" SERIAL NOT NULL,
    "sector_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quantity_left" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "sales_start" TIMESTAMP(3),
    "sales_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sector_event_id_idx" ON "sector"("event_id");

-- CreateIndex
CREATE INDEX "lot_sector_id_idx" ON "lot"("sector_id");

-- CreateIndex
CREATE INDEX "ticket_lot_id_idx" ON "ticket"("lot_id");

-- AddForeignKey
ALTER TABLE "sector" ADD CONSTRAINT "sector_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot" ADD CONSTRAINT "lot_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- O Prisma não modela CHECK: garante no banco que o estoque do lote nunca fica negativo
ALTER TABLE "lot" ADD CONSTRAINT "lot_price_check" CHECK ("price" >= 0);
ALTER TABLE "lot" ADD CONSTRAINT "lot_quantity_left_check" CHECK ("quantity_left" >= 0 AND "quantity_left" <= "quantity");
