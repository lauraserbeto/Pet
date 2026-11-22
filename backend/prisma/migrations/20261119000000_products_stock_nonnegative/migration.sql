-- E-08: protege todas as novas gravações sem corrigir dados históricos às cegas.
ALTER TABLE "products" ADD CONSTRAINT "products_stock_nonnegative"
  CHECK ("stock_quantity" >= 0) NOT VALID;

-- Em base limpa, valida imediatamente. Negativos legados exigem conciliação
-- explícita antes de VALIDATE CONSTRAINT; não são apagados ou zerados aqui.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "products" WHERE "stock_quantity" < 0) THEN
    ALTER TABLE "products" VALIDATE CONSTRAINT "products_stock_nonnegative";
  END IF;
END $$;
