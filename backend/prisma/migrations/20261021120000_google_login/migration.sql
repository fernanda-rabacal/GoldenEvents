-- AlterTable
ALTER TABLE "user" ADD COLUMN     "google_id" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_google_id_key" ON "user"("google_id");
