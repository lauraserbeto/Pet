CREATE TABLE "payment_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "preference_id" VARCHAR(150),
    "external_id" VARCHAR(100),
    "checkout_url" TEXT,
    "status" VARCHAR(40) NOT NULL DEFAULT 'CREATED',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "gateway_updated_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payment_attempts_positive_amount" CHECK ("amount" > 0)
);

CREATE UNIQUE INDEX "payment_attempts_order_id_key" ON "payment_attempts"("order_id");
CREATE UNIQUE INDEX "payment_attempts_preference_id_key" ON "payment_attempts"("preference_id");
CREATE UNIQUE INDEX "payment_attempts_external_id_key" ON "payment_attempts"("external_id");
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_order_id_fkey"
FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
