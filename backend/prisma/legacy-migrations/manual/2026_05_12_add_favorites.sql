-- Migration manual: cria a tabela de favoritos (PRODUCT / HOTEL / SITTER).
-- Aplicar via `prisma migrate dev --name add_favorites` OU executar este SQL direto.

-- ============================================================
-- 1. Enum FavoriteTargetType
-- ============================================================
DO $$ BEGIN
  CREATE TYPE "FavoriteTargetType" AS ENUM ('PRODUCT', 'HOTEL', 'SITTER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. Tabela favorites
-- ============================================================
CREATE TABLE IF NOT EXISTS "favorites" (
  "id"          uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id"     uuid NOT NULL,
  "target_type" "FavoriteTargetType" NOT NULL,
  "target_id"   uuid NOT NULL,
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "favorites_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "favorites_user_target_unique"
  ON "favorites" ("user_id", "target_type", "target_id");

CREATE INDEX IF NOT EXISTS "favorites_user_type_idx"
  ON "favorites" ("user_id", "target_type");
