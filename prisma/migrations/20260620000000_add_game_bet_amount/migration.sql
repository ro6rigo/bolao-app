-- AlterTable (idempotente — seguro se a coluna já existir no init)
ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "betAmount" DOUBLE PRECISION NOT NULL DEFAULT 1;
