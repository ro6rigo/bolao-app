type MercadoPagoApiError = {
  message?: string;
  error?: string;
  status?: number;
  cause?: Array<{ code?: string; description?: string; message?: string }>;
};

function normalizeAccessToken(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/^["']+|["']+$/g, "");
}

export function getMercadoPagoAccessToken(): string {
  assertMercadoPagoConfigured();
  return normalizeAccessToken(process.env.MP_ACCESS_TOKEN);
}

export function isMercadoPagoConfigured(): boolean {
  const token = normalizeAccessToken(process.env.MP_ACCESS_TOKEN);
  return Boolean(token && token !== "TEST-xxxxxxxx" && !token.includes("xxxx"));
}

export function assertMercadoPagoConfigured(): void {
  if (!isMercadoPagoConfigured()) {
    throw new Error(
      "Configure MP_ACCESS_TOKEN no .env.local (dev) ou nas Environment Variables da Vercel (produção) com o Access Token do painel Mercado Pago.",
    );
  }
}

export function parseMercadoPagoError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const mpError = error as MercadoPagoApiError;
    const causeMessage = mpError.cause
      ?.map((item) => item.description ?? item.message ?? item.code)
      .filter(Boolean)
      .join("; ");

    if (causeMessage) {
      if (causeMessage.includes("Payer email forbidden")) {
        return "E-mail do pagador não permitido. Use test_user_{UserID}@testuser.com, onde {UserID} é o User ID do Comprador de teste no painel MP. Não use seu e-mail real.";
      }
      if (causeMessage.includes("Invalid users involved")) {
        return "Combinação inválida de contas. Use Access Token de TESTE (TEST-...) da aplicação e e-mail test_user_{UserID}@testuser.com do Comprador de teste.";
      }
      return causeMessage;
    }

    if (mpError.message) {
      if (mpError.message === "authorization value not present") {
        return "Access Token do Mercado Pago inválido ou ausente. Verifique MP_ACCESS_TOKEN no .env.local.";
      }
      return mpError.message;
    }

    if (mpError.error) {
      return mpError.error;
    }
  }

  return "Erro ao processar pagamento no Mercado Pago";
}
