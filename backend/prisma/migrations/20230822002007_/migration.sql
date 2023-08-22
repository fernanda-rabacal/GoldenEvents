/*
  Warnings:

  - You are about to drop the `event_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `type_id` on the `events` table. All the data in the column will be lost.
  - Added the required column `category_id` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "event_types";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "event_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "photo" TEXT NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "events_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "event_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_events" ("description", "id", "name", "photo", "start_date", "user_id") SELECT "description", "id", "name", "photo", "start_date", "user_id" FROM "events";
DROP TABLE "events";
ALTER TABLE "new_events" RENAME TO "events";
CREATE INDEX "events_user_id_category_id_idx" ON "events"("user_id", "category_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
