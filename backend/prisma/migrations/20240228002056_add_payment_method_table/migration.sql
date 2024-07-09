/*
  Warnings:

  - You are about to drop the column `payment_method` on the `ticket` table. All the data in the column will be lost.
  - Added the required column `payment_method_id` to the `ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ticket` DROP COLUMN `payment_method`,
    ADD COLUMN `payment_method_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `payment_method` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ticket` ADD CONSTRAINT `ticket_payment_method_id_fkey` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_method`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
