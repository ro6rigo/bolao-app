import { NextResponse } from "next/server";
import { GAME_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";
import {
  getBetCloseMinutesBefore,
  getBettingClosesAt,
  isBettingOpen,
} from "@/lib/games/betting-window";
import { closeGameIfBettingExpired } from "@/lib/games/close-game-if-expired";

export async function GET() {
  try {
    const activeGames = await db.game.findMany({
      where: { isActive: true, status: GAME_STATUS.OPEN },
      orderBy: { matchDate: "asc" },
    });

    if (activeGames.length === 0) {
      return NextResponse.json([]);
    }

    const closeMinutesBefore = getBetCloseMinutesBefore();
    const now = new Date();
    const openGames = [];

    for (const game of activeGames) {
      await closeGameIfBettingExpired(game);
      if (!isBettingOpen(game.matchDate, now, closeMinutesBefore)) {
        continue;
      }

      const bettingClosesAt = getBettingClosesAt(game.matchDate, closeMinutesBefore);
      openGames.push({
        ...game,
        betAmount: game.betAmount ?? 1,
        bettingClosesAt: bettingClosesAt.toISOString(),
        bettingCloseMinutesBefore: closeMinutesBefore,
        bettingOpen: true,
      });
    }

    return NextResponse.json(openGames);
  } catch (error) {
    console.error("Erro em /api/games/active:", error);
    const message = error instanceof Error ? error.message : "Erro ao carregar jogo";
    const needsMigration = message.includes("betAmount");
    return NextResponse.json(
      {
        error: needsMigration
          ? "Banco desatualizado. Rode: npm run db:generate && npm run db:migrate:deploy"
          : "Erro ao carregar jogos ativos",
      },
      { status: 500 },
    );
  }
}