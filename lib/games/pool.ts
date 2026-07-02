import { db } from "@/lib/db";
import { sumPaidPredictionAmounts } from "@/lib/games/prize";

export async function getGamePoolStats(gameId: string) {
  const paidPredictions = await db.prediction.findMany({
    where: { gameId, isPaid: true },
    include: { payment: { select: { amount: true } } },
  });

  return {
    totalPaid: sumPaidPredictionAmounts(paidPredictions),
    paidCount: paidPredictions.length,
  };
}
