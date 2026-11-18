export type StructuredBetEntry = {
  playStyle: string;
  betNumber: string;
  amount: number;
  prizeFrom: number;
  prizeTo: number;
  from: string;
};

export function betLinesFromDetails(details: {
  entries: StructuredBetEntry[];
}): Array<{
  playStyle: string;
  betNumber: string;
  amount: number;
  prizeFrom: number;
  prizeTo: number;
  source: string | null;
}> {
  return details.entries.map((entry) => ({
    playStyle: entry.playStyle,
    betNumber: entry.betNumber,
    amount: entry.amount,
    prizeFrom: entry.prizeFrom,
    prizeTo: entry.prizeTo,
    source: entry.from,
  }));
}