import { db } from "@/lib/db";
import { formatSlotInSaoPaulo, getDayBoundsInSaoPaulo, getMatchDatesForDay } from "@/lib/games/schedule";

export async function findGamesOnDate(date: string) {
  const { start, end } = getDayBoundsInSaoPaulo(date);
  const games = await db.game.findMany({
    where: { matchDate: { gte: start, lte: end } },
    orderBy: { matchDate: "asc" },
  });

  return games.filter((game) => formatSlotInSaoPaulo(game.matchDate).date === date);
}

export async function dayAlreadyRegistered(date: string): Promise<boolean> {
  const games = await findGamesOnDate(date);
  return games.length > 0;
}

export function getActiveDayFromGames(
  games: Array<{ matchDate: Date; isActive: boolean }>,
): string | null {
  for (const game of games) {
    if (game.isActive) {
      return formatSlotInSaoPaulo(game.matchDate).date;
    }
  }
  return null;
}

export { getMatchDatesForDay };