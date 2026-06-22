export const PRIZE_POOL_SHARE = 0.8;

export function calculatePrizePerWinner(
  totalPaid: number,
  winnerCount: number,
): number {
  if (winnerCount <= 0) return 0;
  return (totalPaid / winnerCount) * PRIZE_POOL_SHARE;
}

export function sumPaidPredictionAmounts(
  predictions: Array<{ payment: { amount: number } | null }>,
): number {
  return predictions.reduce((sum, prediction) => sum + (prediction.payment?.amount ?? 0), 0);
}
