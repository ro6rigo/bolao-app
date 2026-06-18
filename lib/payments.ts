import { db } from "@/lib/db";
import { syncPaymentStatus } from "@/lib/mercadopago";

export async function refreshPaymentFromMercadoPago(paymentId: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) {
    return null;
  }

  if (payment.status !== "pending") {
    return payment;
  }

  const mpPayment = await syncPaymentStatus(payment.mpPaymentId);

  if (
    mpPayment.status !== payment.status ||
    mpPayment.statusDetail !== payment.statusDetail
  ) {
    const updated = await db.payment.update({
      where: { id: paymentId },
      data: {
        status: mpPayment.status,
        statusDetail: mpPayment.statusDetail,
      },
    });

    if (mpPayment.status === "approved") {
      await db.prediction.updateMany({
        where: { paymentId: payment.id },
        data: { isPaid: true },
      });
    }

    return updated;
  }

  return payment;
}

export async function refreshPaymentByMpId(mpPaymentId: string) {
  const payment = await db.payment.findUnique({ where: { mpPaymentId } });
  if (!payment) {
    return null;
  }

  return refreshPaymentFromMercadoPago(payment.id);
}
