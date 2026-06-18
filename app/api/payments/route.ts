import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import {
  getCollectorProfile,
  validatePayerEmailForCollector,
} from "@/lib/mercadopago-collector";
import { createPixPayment } from "@/lib/mercadopago";
import { parseMercadoPagoError } from "@/lib/mercadopago-errors";
import { createPaymentSchema } from "@/lib/validations/payment";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createPaymentSchema.parse(body);

    const collector = await getCollectorProfile(process.env.MP_ACCESS_TOKEN!);
    const payerEmailError = validatePayerEmailForCollector(
      data.email,
      collector,
    );

    if (payerEmailError) {
      return NextResponse.json({ error: payerEmailError }, { status: 400 });
    }

    const mpPayment = await createPixPayment({
      amount: data.amount,
      description: data.description,
      payer: {
        email: data.email,
        name: data.name,
        cpf: data.cpf,
      },
    });

    const payment = await db.payment.create({
      data: {
        mpPaymentId: mpPayment.mpPaymentId,
        amount: data.amount,
        description: data.description,
        payerEmail: data.email,
        payerName: data.name,
        payerDocument: data.cpf,
        status: mpPayment.status,
        statusDetail: mpPayment.statusDetail,
        qrCode: mpPayment.qrCode,
        qrCodeBase64: mpPayment.qrCodeBase64,
      },
    });

    return NextResponse.json({
      id: payment.id,
      status: payment.status,
      qrCode: payment.qrCode,
      qrCodeBase64: payment.qrCodeBase64,
      amount: payment.amount,
    });
  } catch (error) {
    console.error("Erro ao criar pagamento Pix:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: parseMercadoPagoError(error),
      },
      { status: 500 },
    );
  }
}
