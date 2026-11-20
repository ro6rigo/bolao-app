import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
// Pix / Mercado Pago — temporariamente desativado (variáveis de ambiente)
import { GAME_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";
import { closeGameIfBettingExpired } from "@/lib/games/close-game-if-expired";
import {
  formatBettingCloseMessage,
  getBetCloseMinutesBefore,
  isBettingOpen,
} from "@/lib/games/betting-window";
import { betLinesFromDetails } from "@/lib/games/bet-lines";
import {
  buildDezenaBetDetails,
  dezenaExtraCodeSchema,
  normalizeDezenaNumber,
} from "@/lib/games/dezena-options";
import {
  buildGrupoBetDetails,
  grupoExtraCodeSchema,
  normalizeGrupoNumber,
} from "@/lib/games/grupo-options";
import {
  buildMilharBetDetails,
  milharExtraCodeSchema,
} from "@/lib/games/milhar-options";
import { isPlayStyle } from "@/lib/games/play-styles";
import { buildMilharCentenaBetDetails } from "@/lib/games/milhar-centena-options";
import {
  buildSimpleBetDetails,
  isPlainSimpleStakeStyle,
  isStructuredPalpiteStyle,
} from "@/lib/games/simple-bet-details";
import { betAmountSchema } from "@/lib/validations/bet";
import type { Prisma } from "@prisma/client";

const baseSchema = z.object({
  gameId: z.string(),
  playStyle: z.string().refine(isPlayStyle, "Estilo de jogo inválido"),
  betNumber: z
    .string()
    .trim()
    .regex(/^\d+$/, "Digite apenas números")
    .max(20, "Número muito longo"),
  milharAmount: betAmountSchema.optional(),
  grupoAmount: betAmountSchema.optional(),
  dezenaAmount: betAmountSchema.optional(),
  stakeAmount: betAmountSchema.optional(),
  extras: z
    .array(
      z.object({
        code: milharExtraCodeSchema,
        amount: betAmountSchema,
      }),
    )
    .optional(),
  grupoExtras: z
    .array(
      z.object({
        code: grupoExtraCodeSchema,
        amount: betAmountSchema,
      }),
    )
    .optional(),
  dezenaExtras: z
    .array(
      z.object({
        code: dezenaExtraCodeSchema,
        amount: betAmountSchema,
      }),
    )
    .optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = baseSchema.parse(await request.json());

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    if (!user.cpf) {
      return NextResponse.json(
        { error: "Cadastre seu CPF em Meu perfil antes de palpitar." },
        { status: 400 },
      );
    }

    if (body.playStyle === "MILHAR" && body.milharAmount == null) {
      return NextResponse.json({ error: "Informe o valor do milhar" }, { status: 400 });
    }

    if (body.playStyle === "GRUPO" && body.grupoAmount == null) {
      return NextResponse.json({ error: "Informe o valor do grupo" }, { status: 400 });
    }

    if (body.playStyle === "GRUPO") {
      try {
        normalizeGrupoNumber(body.betNumber);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Grupo inválido" },
          { status: 400 },
        );
      }
    }

    if (body.playStyle === "DEZENA" && body.dezenaAmount == null) {
      return NextResponse.json({ error: "Informe o valor da dezena" }, { status: 400 });
    }

    if (body.playStyle === "DEZENA") {
      try {
        normalizeDezenaNumber(body.betNumber);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Dezena inválida" },
          { status: 400 },
        );
      }
    }

    if (!isStructuredPalpiteStyle(body.playStyle) && body.stakeAmount == null) {
      return NextResponse.json({ error: "Informe o valor da aposta" }, { status: 400 });
    }

    const game = await db.game.findFirst({
      where: { id: body.gameId, isActive: true, status: GAME_STATUS.OPEN },
    });
    if (!game) {
      return NextResponse.json({ error: "Nenhum jogo aberto para palpite" }, { status: 400 });
    }

    await closeGameIfBettingExpired(game);

    const closeMinutesBefore = getBetCloseMinutesBefore();
    if (!isBettingOpen(game.matchDate, new Date(), closeMinutesBefore)) {
      return NextResponse.json(
        { error: formatBettingCloseMessage(game.matchDate, closeMinutesBefore) },
        { status: 400 },
      );
    }

    const betDetails =
      body.playStyle === "MILHAR" && body.milharAmount != null
        ? buildMilharBetDetails(body.betNumber, body.milharAmount, body.extras ?? [])
        : body.playStyle === "GRUPO" && body.grupoAmount != null
          ? buildGrupoBetDetails(body.betNumber, body.grupoAmount, body.grupoExtras ?? [])
          : body.playStyle === "DEZENA" && body.dezenaAmount != null
            ? buildDezenaBetDetails(body.betNumber, body.dezenaAmount, body.dezenaExtras ?? [])
            : body.stakeAmount != null && body.playStyle === "MILHAR E CENTENA"
              ? buildMilharCentenaBetDetails(body.betNumber, body.stakeAmount)
              : body.stakeAmount != null && isPlainSimpleStakeStyle(body.playStyle)
                ? buildSimpleBetDetails(body.playStyle, body.betNumber, body.stakeAmount)
                : null;

    if (!betDetails) {
      return NextResponse.json({ error: "Informe o valor da aposta" }, { status: 400 });
    }

    const amount = betDetails.totalAmount;

    const betLineRows =
      betDetails != null
        ? betLinesFromDetails(betDetails).map((line) => ({
            playStyle: line.playStyle,
            betNumber: line.betNumber,
            amount: line.amount,
            prizeFrom: line.prizeFrom,
            prizeTo: line.prizeTo,
            source: line.source,
          }))
        : [];

    const prediction = await db.prediction.create({
      data: {
        userId: user.id,
        gameId: game.id,
        playStyle: body.playStyle,
        betNumber: body.betNumber,
        betDetails: betDetails as Prisma.InputJsonValue | undefined,
        isPaid: true,
        ...(betLineRows.length > 0
          ? { betLines: { create: betLineRows } }
          : {}),
      },
    });

    return NextResponse.json({
      predictionId: prediction.id,
      skipPix: true,
      amount,
      betDetails,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao confirmar palpite" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await requireUser();
    const predictions = await db.prediction.findMany({
      where: { userId: session.userId },
      include: {
        game: true,
        payment: { select: { status: true, amount: true } },
      },
      orderBy: { id: "desc" },
    });
    return NextResponse.json(predictions);
  } catch {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
}