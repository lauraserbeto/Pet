-- E-05 (AUD-04, P4): o pedido guarda uma cópia do endereço de entrega escolhido
-- no checkout. Pedidos anteriores ficam com NULL.

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "shipping_address" JSONB;
