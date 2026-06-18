import { GAME_STATUS } from "@/lib/constants";
import {
  fetchMatchById,
  getFullTimeScore,
  isMatchFinished,
} from "@/lib/football-data/client";
import { db } from "@/lib/db";

export async function syncGameResult(gameId: string) {
  const game = await db.game.findUnique({ where: { id: gameId } });
  if (!game) throw new Error("Jogo não encontrado");

  const match = await fetchMatchById(game.externalMatchId);
  if (!match) throw new Error("Partida não encontrada na football-data.org");

  if (!isMatchFinished(match.status)) {
    throw new Error("Partida ainda não finalizou");
  }

  const { home: homeScore, away: awayScore } = getFullTimeScore(match);

  await db.game.update({
    where: { id: gameId },
    data: {
      homeScore,
      awayScore,
      status: GAME_STATUS.FINISHED,
      isActive: false,
    },
  });

  const predictions = await db.prediction.findMany({
    where: { gameId, isPaid: true },
  });

  for (const prediction of predictions) {
    await db.prediction.update({
      where: { id: prediction.id },
      data: {
        isCorrect:
          prediction.homeScore === homeScore &&
          prediction.awayScore === awayScore,
      },
    });
  }

  return { homeScore, awayScore };
}
