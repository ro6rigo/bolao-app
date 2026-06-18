import { createHmac, timingSafeEqual } from "crypto";

function normalizeSecret(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/^["']+|["']+$/g, "");
}

export function getMercadoPagoWebhookSecret(): string | null {
  const secret = normalizeSecret(process.env.MP_WEBHOOK_SECRET);
  return secret || null;
}

export function isMercadoPagoWebhookValidationEnabled(): boolean {
  return Boolean(getMercadoPagoWebhookSecret());
}

type SignatureParts = {
  ts?: string;
  v1?: string;
};

function parseSignatureHeader(header: string | null): SignatureParts {
  if (!header) return {};

  const parts: SignatureParts = {};
  for (const segment of header.split(",")) {
    const [key, ...valueParts] = segment.split("=");
    const value = valueParts.join("=").trim();
    const trimmedKey = key?.trim();
    if (trimmedKey === "ts") parts.ts = value;
    if (trimmedKey === "v1") parts.v1 = value;
  }
  return parts;
}

function normalizeDataId(dataId: string | null): string {
  if (!dataId) return "";
  return /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
}

function buildManifest(input: {
  dataId: string;
  requestId: string | null;
  ts: string | undefined;
}): string {
  let manifest = "";

  if (input.dataId) {
    manifest += `id:${input.dataId};`;
  }
  if (input.requestId) {
    manifest += `request-id:${input.requestId};`;
  }
  if (input.ts) {
    manifest += `ts:${input.ts};`;
  }

  return manifest;
}

export type WebhookValidationInput = {
  xSignature: string | null;
  xRequestId: string | null;
  dataIdFromQuery: string | null;
  dataIdFromBody: string | null;
};

export function validateMercadoPagoWebhookSignature(
  input: WebhookValidationInput,
): boolean {
  const secret = getMercadoPagoWebhookSecret();
  if (!secret) {
    return true;
  }

  const { ts, v1 } = parseSignatureHeader(input.xSignature);
  if (!v1) {
    return false;
  }

  const dataId = normalizeDataId(
    input.dataIdFromQuery ?? input.dataIdFromBody ?? "",
  );
  const manifest = buildManifest({
    dataId,
    requestId: input.xRequestId,
    ts,
  });

  if (!manifest) {
    return false;
  }

  const computed = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(computed, "utf8"),
      Buffer.from(v1, "utf8"),
    );
  } catch {
    return false;
  }
}
