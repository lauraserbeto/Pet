-- Align existing and future orders with the Sprint 2 simulated-payment flow.
-- PED/PAG states start as AGUARDANDO_PAGAMENTO and move to PAGO through
-- POST /orders/:id/pay.
UPDATE "orders"
SET "status" = 'AGUARDANDO_PAGAMENTO'
WHERE "status" = 'PENDING';

ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'AGUARDANDO_PAGAMENTO';
