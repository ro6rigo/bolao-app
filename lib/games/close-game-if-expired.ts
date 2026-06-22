import { GAME_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";
import { isBettingOpen } from "@/lib/games/betting-window";

type GameToClose = {
  id: string;
  matchDate: Date;
  status: string;
};

export async function closeGameIfBettingExpired(game: GameToClose): Promise<boolean> {
  if (game.status !== GAME_STATUS.OPEN) {
    return false;
  }

  if (isBettingOpen(game.matchDate)) {
    return false;
  }

  await db.game.update({
    where: { id: game.id },
    data: {
      status: GAME_STATUS.CLOSED,
      isActive: false,
    },
  });

  return true;
}
