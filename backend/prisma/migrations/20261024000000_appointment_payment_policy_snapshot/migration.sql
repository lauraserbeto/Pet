-- E-04 (DEC-A): a política de cobrança vigente na reserva passa a ser gravada no
-- próprio agendamento, e as consultas de conflito de horário ganham índices.

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "payment_policy" "PaymentPolicy" NOT NULL DEFAULT 'PRESENCIAL';

-- CreateIndex
CREATE INDEX "appointments_provider_id_start_time_idx" ON "appointments"("provider_id", "start_time");

-- CreateIndex
CREATE INDEX "appointments_pet_id_start_time_idx" ON "appointments"("pet_id", "start_time");


-- Agendamentos existentes herdam a política atual do parceiro (em produção não
-- havia agendamentos em 24/10/2026; o UPDATE garante o mesmo resultado em
-- qualquer outro ambiente).
UPDATE "appointments" AS a
SET "payment_policy" = p."payment_policy"
FROM "providers" AS p
WHERE a."provider_id" = p."id";
