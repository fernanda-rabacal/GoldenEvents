/*
  Warnings:

  - You are about to drop the column `category` on the `event_categories` table. All the data in the column will be lost.
  - Added the required column `name` to the `event_categories` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_event_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "photo" TEXT NOT NULL
);
INSERT INTO "new_event_categories" ("id", "photo") SELECT "id", "photo" FROM "event_categories";
DROP TABLE "event_categories";
ALTER TABLE "new_event_categories" RENAME TO "event_categories";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
