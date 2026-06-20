import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { GAME_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireUser();

    const games = await db.game.findMany({
      where: { status: GAME_STATUS.FINISHED },
      orderBy: { matchDate: "desc" },
      select: {
        id: true,
        homeTeam: true,
        awayTeam: true,
        homeScore: true,
        awayScore: true,
        matchDate: true,
        _count: {
          select: {
            predictions: { where: { isPaid: true } },
          },
        },
      },
    });

    const winnerCounts = await db.prediction.groupBy({
      by: ["gameId"],
      where: { isPaid: true, isCorrect: true },
      _count: { _all: true },
    });

    const winnersByGame = new Map(
      winnerCounts.map((row) => [row.gameId, row._count._all]),
    );

    return NextResponse.json(
      games.map((game) => ({
        id: game.id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        matchDate: game.matchDate,
        paidPredictions: game._count.predictions,
        winners: winnersByGame.get(game.id) ?? 0,
      })),
    );
  } catch {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
}
