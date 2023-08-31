/*
  Warnings:

  - Added the required column `type_id` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "event_types" (
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
    "type_id" TEXT NOT NULL,
    CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "events_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "event_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_events" ("description", "id", "name", "photo", "start_date", "user_id") SELECT "description", "id", "name", "photo", "start_date", "user_id" FROM "events";
DROP TABLE "events";
ALTER TABLE "new_events" RENAME TO "events";
CREATE INDEX "events_user_id_type_id_idx" ON "events"("user_id", "type_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
