/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `event` DROP COLUMN `deleted_at`,
    ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true;
