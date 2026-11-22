CREATE TABLE "appointment_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appointment_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
    "amount" DECIMAL(10,2) NOT NULL,
    "paid_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refunded_at" TIMESTAMPTZ,
    CONSTRAINT "appointment_payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "appointment_payments_amount_check" CHECK ("amount" > 0),
    CONSTRAINT "appointment_payments_status_check" CHECK (
      ("status" = 'APPROVED' AND "refunded_at" IS NULL) OR
      ("status" = 'REFUNDED' AND "refunded_at" IS NOT NULL)
    )
);
CREATE UNIQUE INDEX "appointment_payments_appointment_id_key" ON "appointment_payments"("appointment_id");
ALTER TABLE "appointment_payments" ADD CONSTRAINT "appointment_payments_appointment_id_fkey"
  FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
