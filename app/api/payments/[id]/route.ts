import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { refreshPaymentFromMercadoPago } from "@/lib/payments";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const payment = await db.payment.findUnique({ where: { id } });
    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 },
      );
    }

    const updatedPayment =
      payment.status === "pending"
        ? await refreshPaymentFromMercadoPago(id)
        : payment;

    if (!updatedPayment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: updatedPayment.id,
      status: updatedPayment.status,
      statusDetail: updatedPayment.statusDetail,
      amount: updatedPayment.amount,
      qrCode: updatedPayment.qrCode,
      qrCodeBase64: updatedPayment.qrCodeBase64,
      createdAt: updatedPayment.createdAt,
      updatedAt: updatedPayment.updatedAt,
    });
  } catch (error) {
    console.error("Erro ao consultar pagamento:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao consultar pagamento",
      },
      { status: 500 },
    );
  }
}
