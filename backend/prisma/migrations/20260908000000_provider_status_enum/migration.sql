-- Normalize legacy free-text provider statuses before converting the column to
-- a PostgreSQL enum. The ALTER TYPE would fail if ATIVO/ACTIVE or unknown
-- values were still present.
UPDATE "providers"
SET "status" = CASE
    WHEN "status" IN ('APROVADO', 'ATIVO', 'ACTIVE') THEN 'APROVADO'
    WHEN "status" = 'REJEITADO' THEN 'REJEITADO'
    WHEN "status" = 'EM_REVISAO' THEN 'EM_REVISAO'
    ELSE 'PENDENTE'
END
WHERE "status" IS NULL
   OR "status" NOT IN ('PENDENTE', 'APROVADO', 'REJEITADO', 'EM_REVISAO')
   OR "status" IN ('ATIVO', 'ACTIVE');

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO', 'EM_REVISAO');

-- AlterTable
ALTER TABLE "providers" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "providers" ALTER COLUMN "status" TYPE "ProviderStatus" USING ("status"::"ProviderStatus");
ALTER TABLE "providers" ALTER COLUMN "status" SET DEFAULT 'PENDENTE';
ALTER TABLE "providers" ALTER COLUMN "status" SET NOT NULL;
