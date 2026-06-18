import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { fetchMatchById } from "@/lib/football-data/client";
import { betAmountSchema } from "@/lib/validations/bet";
import { GAME_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";

const createSchema = z.object({
  externalMatchId: z.number().int().positive(),
  betAmount: betAmountSchema,
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

    const existing = await db.game.findUnique({
      where: { externalMatchId: body.externalMatchId },
    });
    if (existing) {
      return NextResponse.json({ error: "Jogo já cadastrado" }, { status: 409 });
    }

    const match = await fetchMatchById(body.externalMatchId);
    if (!match) {
      return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 });
    }

    const game = await db.game.create({
      data: {
        externalMatchId: body.externalMatchId,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        matchDate: new Date(match.utcDate),
        betAmount: body.betAmount,
        status: GAME_STATUS.OPEN,
        isActive: false,
      },
    });

    return NextResponse.json(game);
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
