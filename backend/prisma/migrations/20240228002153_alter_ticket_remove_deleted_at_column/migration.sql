/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `ticket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ticket` DROP COLUMN `deleted_at`;
