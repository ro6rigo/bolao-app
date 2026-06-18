import { NextResponse } from "next/server";
import { GAME_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";

export async function GET() {
  const game = await db.game.findFirst({
    where: { isActive: true, status: GAME_STATUS.OPEN },
  });
  return NextResponse.json(game);
}
