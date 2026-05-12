-- Migration manual: adiciona is_default em addresses e índice parcial único.
-- Aplicar em ordem:
--   1) Em dev/local: `npx prisma migrate dev --name add_address_default`
--      (Prisma criará apenas a coluna; rode o trecho 2 manualmente para o índice parcial)
--   2) OU aplicar este arquivo direto via psql / cliente SQL.

-- ============================================================
-- 1. Coluna is_default
-- ============================================================
ALTER TABLE "addresses"
  ADD COLUMN IF NOT EXISTS "is_default" BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- 2. Backfill: marca o endereço mais antigo de cada usuário como default
-- ============================================================
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) AS rn
  FROM "addresses"
)
UPDATE "addresses" a
   SET is_default = true
  FROM ranked r
 WHERE a.id = r.id
   AND r.rn = 1
   AND NOT EXISTS (
     SELECT 1 FROM "addresses" b
      WHERE b.user_id = a.user_id AND b.is_default = true
   );

-- ============================================================
-- 3. Índice parcial único: garante no máximo 1 default por usuário
--    (Prisma DSL não expressa unique parcial; aplicar via SQL)
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS "addresses_user_id_default_unique"
  ON "addresses" ("user_id")
  WHERE "is_default" = true;
