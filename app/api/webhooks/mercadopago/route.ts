import { NextResponse } from "next/server";
import { refreshPaymentByMpId } from "@/lib/payments";

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
  try {
    const url = new URL(request.url);
    let body: WebhookBody = {};

    try {
      body = (await request.json()) as WebhookBody;
    } catch {
      body = {};
    }

    const paymentId = extractPaymentId(body, url.searchParams);
    if (paymentId) {
      await refreshPaymentByMpId(paymentId);
    }
  } catch (error) {
    console.error("Erro no webhook Mercado Pago:", error);
  }

  return NextResponse.json({ received: true });
}
