function normalizeBaseUrl(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/\/$/, "");
}

function isPublicHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return host !== "localhost" && host !== "127.0.0.1";
  } catch {
    return false;
  }
}

/**
 * URL pública HTTPS do app (Vercel ou NEXT_PUBLIC_APP_URL).
 * Retorna null se não houver URL válida para webhooks (ex.: localhost).
 */
export function getPublicAppBaseUrl(): string | null {
  const configured = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (configured && isPublicHttpsUrl(configured)) {
    return configured;
  }

  const vercel = normalizeBaseUrl(process.env.VERCEL_URL);
  if (vercel) {
    const url = vercel.startsWith("http") ? vercel : `https://${vercel}`;
    if (isPublicHttpsUrl(url)) return url;
  }

  const vercelProduction = normalizeBaseUrl(
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  );
  if (vercelProduction) {
    const url = vercelProduction.startsWith("http")
      ? vercelProduction
      : `https://${vercelProduction}`;
    if (isPublicHttpsUrl(url)) return url;
  }

  return null;
}

/** @deprecated Prefer getPublicAppBaseUrl — localhost não é aceito pelo Mercado Pago. */
export function getAppBaseUrl(): string {
  return getPublicAppBaseUrl() ?? "http://localhost:3000";
}

export function getMercadoPagoWebhookUrl(): string | null {
  const base = getPublicAppBaseUrl();
  if (!base) return null;
  return `${base}/api/webhooks/mercadopago?source_news=webhooks`;
}
