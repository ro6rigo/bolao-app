-- Jogos abertos por dia e horário não dependem de uma partida externa.
ALTER TABLE "Game" ALTER COLUMN "externalMatchId" DROP NOT NULL;
