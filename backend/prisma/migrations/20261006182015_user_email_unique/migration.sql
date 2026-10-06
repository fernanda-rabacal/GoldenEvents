-- Normaliza os e-mails existentes, já que o cadastro e o login passam a usar minúsculas
UPDATE "user" SET "email" = LOWER(TRIM("email"));

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
