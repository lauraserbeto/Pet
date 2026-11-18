-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "author_id" UUID NOT NULL,
    "product_id" UUID,
    "provider_id" UUID,
    "order_id" UUID,
    "appointment_id" UUID,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unicidade por item do pedido (order_id + product_id)
CREATE UNIQUE INDEX "reviews_order_id_product_id_key" ON "reviews"("order_id", "product_id") WHERE "order_id" IS NOT NULL AND "product_id" IS NOT NULL;

-- CreateIndex: Unicidade por agendamento
CREATE UNIQUE INDEX "reviews_appointment_id_key" ON "reviews"("appointment_id") WHERE "appointment_id" IS NOT NULL;

-- CreateIndex: Índices compostos para listagem ordenada por alvo
CREATE INDEX "reviews_product_id_created_at_idx" ON "reviews"("product_id", "created_at" DESC);
CREATE INDEX "reviews_provider_id_created_at_idx" ON "reviews"("provider_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CheckConstraint: Alvo polimórfico - exatamente um preenchido (product_id XOR provider_id)
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_target_xor_check"
    CHECK (
        (product_id IS NOT NULL AND provider_id IS NULL) OR
        (product_id IS NULL AND provider_id IS NOT NULL)
    );

-- CheckConstraint: Origem da transação - exatamente uma preenchida (order_id XOR appointment_id)
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_origin_xor_check"
    CHECK (
        (order_id IS NOT NULL AND appointment_id IS NULL) OR
        (order_id IS NULL AND appointment_id IS NOT NULL)
    );

-- CheckConstraint: Nota entre 1 e 5
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_range_check"
    CHECK (rating >= 1 AND rating <= 5);
