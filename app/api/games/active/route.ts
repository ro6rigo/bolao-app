import { NextResponse } from "next/server";
import { GAME_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";
import {
  fetchMatchById,
  getTeamCrests,
} from "@/lib/football-data/client";

export async function GET() {
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
    homeTeamCrest,
    awayTeamCrest,
    competition,
  });
}
