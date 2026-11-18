import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { GAME_STATUS } from "@/lib/constants";
import { dayAlreadyRegistered, findGamesOnDate } from "@/lib/games/game-day";
import { db } from "@/lib/db";
import { getMatchDatesForDay, getSlotsForDate } from "@/lib/games/schedule";

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET() {
  try {
    await requireAdmin();
    const games = await db.game.findMany({ orderBy: { matchDate: "desc" } });
    return NextResponse.json(games);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Não autenticado") {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message === "Acesso negado") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    console.error("Erro ao listar jogos:", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("betAmount")) {
      return NextResponse.json(
        {
          error:
            "Schema desatualizado. Pare o servidor, rode npx prisma generate e reinicie.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Erro ao carregar jogos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = createSchema.parse(await request.json());

    const slots = getSlotsForDate(body.date);
    if (slots.length === 0) {
      return NextResponse.json({ error: "Sem horários para este dia" }, { status: 400 });
    }

    if (await dayAlreadyRegistered(body.date)) {
      return NextResponse.json({ error: "Este dia já está cadastrado" }, { status: 409 });
    }

    const matchDates = getMatchDatesForDay(body.date);
    await db.game.createMany({
      data: matchDates.map((matchDate) => ({
        homeTeam: "Mandante",
        awayTeam: "Visitante",
        matchDate,
        betAmount: 1,
        status: GAME_STATUS.OPEN,
        isActive: false,
      })),
    });

    const games = await findGamesOnDate(body.date);
    return NextResponse.json({ date: body.date, games, count: games.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    const isPrismaOutdated = message.includes("betAmount");
    return NextResponse.json(
      {
        error: isPrismaOutdated
          ? "Schema desatualizado. Pare o servidor, rode npx prisma generate e reinicie."
          : message,
      },
      { status: 400 },
    );
  }
}