import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Não disponível em produção" }, { status: 403 });
  }

  const { id } = await context.params;
  const payment = await db.payment.findUnique({ where: { id } });

  if (!payment) {
    return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 });
  }

  if (payment.status === "approved") {
    return NextResponse.json({ id: payment.id, status: payment.status });
  }

  const updated = await db.payment.update({
    where: { id },
    data: {
      status: "approved",
      statusDetail: "accredited",
    },
  });

  await db.prediction.updateMany({
    where: { paymentId: id },
    data: { isPaid: true },
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    simulated: true,
  });
}
