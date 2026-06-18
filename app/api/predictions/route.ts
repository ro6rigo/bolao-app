import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import {
  getCollectorProfile,
  validatePayerEmailForCollector,
} from "@/lib/mercadopago-collector";
import { createPixPayment } from "@/lib/mercadopago";
import { parseMercadoPagoError } from "@/lib/mercadopago-errors";
import { GAME_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";

const schema = z.object({
  gameId: z.string(),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  amount: z.number().positive("Valor deve ser maior que zero"),
  cpf: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().length(11)),
});

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = schema.parse(await request.json());

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const game = await db.game.findFirst({
      where: { id: body.gameId, isActive: true, status: GAME_STATUS.OPEN },
    });
    if (!game) {
      return NextResponse.json({ error: "Nenhum jogo aberto para palpite" }, { status: 400 });
    }

    const collector = await getCollectorProfile(process.env.MP_ACCESS_TOKEN!);
    const payerEmailError = validatePayerEmailForCollector(user.email, collector);
    if (payerEmailError) {
      return NextResponse.json({ error: payerEmailError }, { status: 400 });
    }

    const mpPayment = await createPixPayment({
      amount: body.amount,
      description: `Palpite ${game.homeTeam} x ${game.awayTeam}`,
      payer: { email: user.email, name: user.name, cpf: body.cpf },
    });

    const payment = await db.payment.create({
      data: {
        userId: user.id,
        mpPaymentId: mpPayment.mpPaymentId,
        amount: body.amount,
        description: `Palpite ${game.homeTeam} x ${game.awayTeam}`,
        payerEmail: user.email,
        payerName: user.name,
        payerDocument: body.cpf,
        status: mpPayment.status,
        statusDetail: mpPayment.statusDetail,
        qrCode: mpPayment.qrCode,
        qrCodeBase64: mpPayment.qrCodeBase64,
      },
    });

    const prediction = await db.prediction.create({
      data: {
        userId: user.id,
        gameId: game.id,
        homeScore: body.homeScore,
        awayScore: body.awayScore,
        paymentId: payment.id,
        isPaid: false,
      },
    });

    return NextResponse.json({
      predictionId: prediction.id,
      paymentId: payment.id,
      status: payment.status,
      qrCode: payment.qrCode,
      qrCodeBase64: payment.qrCodeBase64,
      amount: payment.amount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: parseMercadoPagoError(error) },
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
