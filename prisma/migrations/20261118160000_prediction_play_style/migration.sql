-- Palpite por estilo de jogo e número, sem placar obrigatório.
ALTER TABLE "Prediction" ADD COLUMN "playStyle" TEXT;
ALTER TABLE "Prediction" ADD COLUMN "betNumber" TEXT;
ALTER TABLE "Prediction" ALTER COLUMN "homeScore" DROP NOT NULL;
ALTER TABLE "Prediction" ALTER COLUMN "awayScore" DROP NOT NULL;
