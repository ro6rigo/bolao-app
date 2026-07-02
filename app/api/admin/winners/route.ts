import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { calculatePrizePerWinner } from "@/lib/games/prize";
import { getGamePoolStats } from "@/lib/games/pool";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");

    if (!gameId) {
      return NextResponse.json({ error: "gameId obrigatório" }, { status: 400 });
    }

    const { totalPaid } = await getGamePoolStats(gameId);

    const winners = await db.prediction.findMany({
      where: { gameId, isPaid: true, isCorrect: true },
      include: { user: { select: { name: true, phone: true } } },
    });

    const prizePerWinner = calculatePrizePerWinner(totalPaid, winners.length);

    return NextResponse.json({
      totalPaid,
      winnerCount: winners.length,
      prizePerWinner,
      winners: winners.map((winner) => ({
        id: winner.id,
        homeScore: winner.homeScore,
        awayScore: winner.awayScore,
        prize: prizePerWinner,
        user: winner.user,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
}
