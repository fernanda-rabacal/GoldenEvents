-- Guarda o CPF só com dígitos, como o cadastro passa a fazer
UPDATE "user" SET "document" = REGEXP_REPLACE("document", '\D', '', 'g');

-- CreateIndex
CREATE UNIQUE INDEX "user_document_key" ON "user"("document");
