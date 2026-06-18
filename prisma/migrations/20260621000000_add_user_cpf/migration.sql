-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cpf" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_cpf_key" ON "User"("cpf");
