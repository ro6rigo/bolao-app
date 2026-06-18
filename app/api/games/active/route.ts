import { NextResponse } from "next/server";
import { GAME_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";
import {
  fetchMatchById,
  getTeamCrests,
} from "@/lib/football-data/client";

export async function GET() {
  try {
    const game = await db.game.findFirst({
      where: { isActive: true, status: GAME_STATUS.OPEN },
    });

    if (!game) {
      return NextResponse.json(null);
    }

    let homeTeamCrest: string | null = null;
    let awayTeamCrest: string | null = null;
    let competition: string | null = null;

    try {
      const match = await fetchMatchById(game.externalMatchId);
      const crests = getTeamCrests(match);
      homeTeamCrest = crests.homeTeamCrest;
      awayTeamCrest = crests.awayTeamCrest;
      competition = crests.competition;
    } catch {
      // Bandeiras são opcionais — a tela funciona só com nomes dos times.
    }

    return NextResponse.json({
      ...game,
      betAmount: game.betAmount ?? 1,
      homeTeamCrest,
      awayTeamCrest,
      competition,
    });
  } catch (error) {
    console.error("Erro em /api/games/active:", error);
    const message = error instanceof Error ? error.message : "Erro ao carregar jogo";
    const needsMigration = message.includes("betAmount");
    return NextResponse.json(
      {
        error: needsMigration
          ? "Banco desatualizado. Rode: npm run db:generate && npm run db:migrate:deploy"
          : "Erro ao carregar jogo ativo",
      },
      { status: 500 },
    );
  }
}
