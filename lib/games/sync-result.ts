import { GAME_STATUS } from "@/lib/constants";
import {
  fetchMatchById,
  getFullTimeScore,
  isMatchFinished,
} from "@/lib/football-data/client";
import {
  isDezenaBetCorrect,
  isGrupoBetCorrect,
  isMilharBetCorrect,
  isMilharBetEntryCorrect,
  isMilharBetLineCorrect,
  isPredictionCorrect,
} from "@/lib/jogo-do-bicho/check-prediction";
import { parseMilharCentenaBetDetails } from "@/lib/games/milhar-centena-options";
import { parseSimpleBetDetails } from "@/lib/games/simple-bet-details";
import { fetchExtractionForDate } from "@/lib/jogo-do-bicho/deu-no-poste";
import { extractionCodeForTime, EXTRACTION_LABELS } from "@/lib/jogo-do-bicho/extractions";
import type { DrawPrize } from "@/lib/jogo-do-bicho/types";
import { formatSlotInSaoPaulo } from "@/lib/games/schedule";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function syncGameResult(gameId: string) {
  const game = await db.game.findUnique({ where: { id: gameId } });
  if (!game) throw new Error("Jogo não encontrado");

  if (game.externalMatchId != null) {
    return syncFootballGameResult(gameId, game.externalMatchId);
  }

  const { date, time } = formatSlotInSaoPaulo(game.matchDate);
  const drawCode = extractionCodeForTime(time);
  if (!drawCode) {
    throw new Error(`Horário ${time} não tem extração mapeada no Deu no Poste`);
  }

  const { prizes } = await fetchExtractionForDate(date, drawCode);

  await db.game.update({
    where: { id: gameId },
    data: {
      drawCode,
      drawResults: prizes as unknown as Prisma.InputJsonValue,
      status: GAME_STATUS.FINISHED,
      isActive: false,
    },
  });

  await scorePredictions(gameId, prizes);

  return {
    drawCode,
    drawLabel: EXTRACTION_LABELS[drawCode],
    prizes,
  };
}

async function syncFootballGameResult(gameId: string, externalMatchId: number) {
  const match = await fetchMatchById(externalMatchId);
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

function scoreStructuredPrediction(
  prediction: {
    playStyle: string | null;
    betDetails: unknown;
    betLines: Array<{
      playStyle: string;
      betNumber: string;
      prizeFrom: number;
      prizeTo: number;
    }>;
  },
  prizes: DrawPrize[],
): boolean {
  if (prediction.betLines.length > 0) {
    return prediction.betLines.some((line) => isMilharBetLineCorrect(line, prizes));
  }
  if (!prediction.betDetails) return false;
  if (prediction.playStyle === "GRUPO") {
    return isGrupoBetCorrect(prediction.betDetails, prizes);
  }
  if (prediction.playStyle === "DEZENA") {
    return isDezenaBetCorrect(prediction.betDetails, prizes);
  }
  if (prediction.playStyle === "MILHAR") {
    return isMilharBetCorrect(prediction.betDetails, prizes);
  }
  const milharCentena = parseMilharCentenaBetDetails(prediction.betDetails);
  if (milharCentena) {
    return milharCentena.entries.some((entry) => isMilharBetEntryCorrect(entry, prizes));
  }
  const simple = parseSimpleBetDetails(prediction.betDetails);
  if (simple) {
    return simple.entries.some((entry) => isMilharBetEntryCorrect(entry, prizes));
  }
  return isMilharBetCorrect(prediction.betDetails, prizes);
}

async function scorePredictions(gameId: string, prizes: DrawPrize[]) {
  const predictions = await db.prediction.findMany({
    where: { gameId, isPaid: true },
    include: { betLines: true },
  });

  for (const prediction of predictions) {
    if (!prediction.playStyle || !prediction.betNumber) {
      await db.prediction.update({
        where: { id: prediction.id },
        data: { isCorrect: false },
      });
      continue;
    }

    const isCorrect =
      prediction.betLines.length > 0 || prediction.betDetails
        ? scoreStructuredPrediction(prediction, prizes)
        : isPredictionCorrect(prediction.playStyle, prediction.betNumber, prizes);

    await db.prediction.update({
      where: { id: prediction.id },
      data: { isCorrect },
    });
  }
}