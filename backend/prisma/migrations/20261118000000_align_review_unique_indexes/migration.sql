-- Preserve a migration original já publicada. Índices convencionais UNIQUE
-- permitem múltiplos NULLs no PostgreSQL e correspondem aos @@unique do Prisma.
BEGIN;
DROP INDEX "reviews_order_id_product_id_key";
DROP INDEX "reviews_appointment_id_key";
CREATE UNIQUE INDEX "reviews_order_id_product_id_key" ON "reviews"("order_id", "product_id");
CREATE UNIQUE INDEX "reviews_appointment_id_key" ON "reviews"("appointment_id");
COMMIT;
