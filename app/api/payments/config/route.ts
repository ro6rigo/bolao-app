import { NextResponse } from "next/server";
import {
  getCollectorProfile,
  validatePayerEmailForCollector,
} from "@/lib/mercadopago-collector";
import { getMercadoPagoAccessToken, isMercadoPagoConfigured } from "@/lib/mercadopago-errors";

export async function GET() {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json({
      configured: false,
      mode: "unconfigured",
      hint: "Configure MP_ACCESS_TOKEN no .env.local ou na Vercel.",
    });
  }

  const collector = await getCollectorProfile(getMercadoPagoAccessToken());

  return NextResponse.json({
    configured: true,
    mode: collector.isTestCollector ? "test_seller" : "real_seller_test_token",
    collector: {
      id: collector.id,
      email: collector.email,
      nickname: collector.nickname,
    },
    hint: collector.isTestCollector
      ? "Use e-mail test_user_{UserID}@testuser.com do Comprador de teste."
      : `Token vinculado à conta real ${collector.email}. Use e-mail fictício diferente (ex.: comprador.exemplo@email.com), nome APRO e CPF 12345678909.`,
    suggestedPayerEmail: collector.isTestCollector
      ? ""
      : "comprador.exemplo@email.com",
  });
}
