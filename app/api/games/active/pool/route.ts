import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { GAME_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";
import { getGamePoolStats } from "@/lib/games/pool";

export async function GET() {
  try {
    await requireUser();

    const game = await db.game.findFirst({
      where: { isActive: true, status: GAME_STATUS.OPEN },
      select: { id: true },
    });

    if (!game) {
      return NextResponse.json({ totalPaid: 0, paidCount: 0, gameId: null });
    }

    const stats = await getGamePoolStats(game.id);

    return NextResponse.json({
      gameId: game.id,
      ...stats,
    });
  } catch {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
}
