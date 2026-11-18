-- CreateTable
CREATE TABLE "PredictionBetLine" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "playStyle" TEXT NOT NULL,
    "betNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "prizeFrom" INTEGER NOT NULL DEFAULT 1,
    "prizeTo" INTEGER NOT NULL DEFAULT 1,
    "source" TEXT,

    CONSTRAINT "PredictionBetLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PredictionBetLine_predictionId_idx" ON "PredictionBetLine"("predictionId");

-- AddForeignKey
ALTER TABLE "PredictionBetLine" ADD CONSTRAINT "PredictionBetLine_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;