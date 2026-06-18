import { NextResponse } from "next/server";
import { refreshPaymentByMpId } from "@/lib/payments";
import {
  isMercadoPagoWebhookValidationEnabled,
  validateMercadoPagoWebhookSignature,
} from "@/lib/mercadopago-webhook";

type WebhookBody = {
  type?: string;
  action?: string;
  data?: {
    id?: string | number;
  };
};

function extractPaymentId(
  body: WebhookBody,
  searchParams: URLSearchParams,
): string | null {
  if (body.type === "payment" && body.data?.id) {
    return String(body.data.id);
  }

  if (searchParams.get("topic") === "payment" && searchParams.get("id")) {
    return searchParams.get("id");
  }

  return null;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const rawBody = await request.text();
  let body: WebhookBody = {};

  try {
    body = rawBody ? (JSON.parse(rawBody) as WebhookBody) : {};
  } catch {
    body = {};
  }

  const dataIdFromBody =
    body.type === "payment" && body.data?.id
      ? String(body.data.id)
      : null;

  if (isMercadoPagoWebhookValidationEnabled()) {
    const isValid = validateMercadoPagoWebhookSignature({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataIdFromQuery: url.searchParams.get("data.id"),
      dataIdFromBody,
    });

    if (!isValid) {
      console.warn("Webhook Mercado Pago: assinatura inválida ou ausente");
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }
  }

  try {
    const paymentId = extractPaymentId(body, url.searchParams);
    if (paymentId) {
      await refreshPaymentByMpId(paymentId);
    }
  } catch (error) {
    console.error("Erro no webhook Mercado Pago:", error);
  }

  return NextResponse.json({ received: true });
}
