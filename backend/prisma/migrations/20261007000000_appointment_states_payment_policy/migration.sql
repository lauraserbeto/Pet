-- AGD-1 — política de cobrança do parceiro + máquina de estados do agendamento.

-- CreateEnum
CREATE TYPE "PaymentPolicy" AS ENUM ('PRESENCIAL', 'PRE_PAGO');

-- AlterTable
ALTER TABLE "providers" ADD COLUMN     "payment_policy" "PaymentPolicy" NOT NULL DEFAULT 'PRESENCIAL';

-- AlterTable
ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'PENDENTE',
ALTER COLUMN "status" SET DATA TYPE VARCHAR(30);

-- Traduz os status legados em inglês para os valores canônicos em português.
-- A tabela está vazia hoje (os modelos nunca foram usados por endpoint), mas a
-- migration precisa ser correta em qualquer ambiente — inclusive num banco que
-- já tenha recebido dados de teste.
UPDATE "appointments"
SET "status" = CASE
    WHEN "status" IN ('PENDING', 'PENDENTE') THEN 'PENDENTE'
    WHEN "status" IN ('AWAITING_CONFIRMATION', 'AGUARDANDO_CONFIRMACAO') THEN 'AGUARDANDO_CONFIRMACAO'
    WHEN "status" IN ('CONFIRMED', 'CONFIRMADO') THEN 'CONFIRMADO'
    WHEN "status" IN ('COMPLETED', 'CONCLUIDO') THEN 'CONCLUIDO'
    WHEN "status" IN ('REJECTED', 'RECUSADO') THEN 'RECUSADO'
    WHEN "status" IN ('CANCELLED', 'CANCELED', 'CANCELADO') THEN 'CANCELADO'
    ELSE 'PENDENTE'
END
WHERE "status" NOT IN (
    'PENDENTE', 'AGUARDANDO_CONFIRMACAO', 'CONFIRMADO', 'CONCLUIDO', 'RECUSADO', 'CANCELADO'
);
