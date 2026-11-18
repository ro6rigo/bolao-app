import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { GAME_STATUS } from "@/lib/constants";
import { findGamesOnDate } from "@/lib/games/game-day";
import { db } from "@/lib/db";

const daySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = daySchema.parse(await request.json());

    const dayGames = await findGamesOnDate(body.date);
    if (dayGames.length === 0) {
      return NextResponse.json({ error: "Dia não cadastrado" }, { status: 404 });
    }

    await db.game.updateMany({ data: { isActive: false } });

    await db.game.updateMany({
      where: { id: { in: dayGames.map((game) => game.id) } },
      data: { isActive: true, status: GAME_STATUS.OPEN },
    });

    return NextResponse.json({ date: body.date, activated: dayGames.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const body = daySchema.parse(await request.json());

    const dayGames = await findGamesOnDate(body.date);
    if (dayGames.length === 0) {
      return NextResponse.json({ error: "Dia não cadastrado" }, { status: 404 });
    }

    await db.game.deleteMany({
      where: { id: { in: dayGames.map((game) => game.id) } },
    });

    return NextResponse.json({ date: body.date, deleted: dayGames.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 400 },
    );
  }
}