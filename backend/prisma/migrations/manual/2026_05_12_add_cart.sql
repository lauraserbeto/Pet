-- Migration manual: cria carts e cart_items.
-- Aplicar via `prisma migrate dev --name add_cart` OU executar este SQL direto.

-- ============================================================
-- 1. Tabela carts
-- ============================================================
CREATE TABLE IF NOT EXISTS "carts" (
  "id"         uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id"    uuid NOT NULL UNIQUE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "carts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- ============================================================
-- 2. Tabela cart_items
-- ============================================================
CREATE TABLE IF NOT EXISTS "cart_items" (
  "id"                  uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "cart_id"             uuid NOT NULL,
  "product_id"          uuid NOT NULL,
  "quantity"            integer NOT NULL CHECK ("quantity" > 0),
  "unit_price_snapshot" numeric(10,2) NOT NULL,
  "added_at"            timestamptz NOT NULL DEFAULT now(),
  "updated_at"          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "cart_items_cart_id_fkey"
    FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE,
  CONSTRAINT "cart_items_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "cart_items_cart_product_unique"
  ON "cart_items" ("cart_id", "product_id");

CREATE INDEX IF NOT EXISTS "cart_items_cart_id_idx"
  ON "cart_items" ("cart_id");
