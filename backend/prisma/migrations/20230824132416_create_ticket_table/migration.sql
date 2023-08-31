/*
  Warnings:

  - Added the required column `cpf` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_at` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `capacity` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_at` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "buy_date" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL,
    "updated_at" DATETIME,
    "deleted_at" DATETIME,
    CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL,
    "updated_at" DATETIME,
    "deleted_at" DATETIME
);
INSERT INTO "new_users" ("email", "id", "name", "password") SELECT "email", "id", "name", "password" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE TABLE "new_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "events_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "event_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_events" ("category_id", "description", "id", "name", "photo", "start_date", "user_id") SELECT "category_id", "description", "id", "name", "photo", "start_date", "user_id" FROM "events";
DROP TABLE "events";
ALTER TABLE "new_events" RENAME TO "events";
CREATE INDEX "events_user_id_category_id_idx" ON "events"("user_id", "category_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE INDEX "tickets_user_id_event_id_idx" ON "tickets"("user_id", "event_id");
