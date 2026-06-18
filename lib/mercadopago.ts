import { MercadoPagoConfig, Payment } from "mercadopago";
import {
  getMercadoPagoAccessToken,
  parseMercadoPagoError,
} from "@/lib/mercadopago-errors";

function getAccessToken(): string {
  return getMercadoPagoAccessToken();
}

function getClient() {
  return new MercadoPagoConfig({
    accessToken: getAccessToken(),
  });
}

export type PixPayer = {
  email: string;
  name: string;
  cpf: string;
};

export type CreatePixPaymentInput = {
  amount: number;
  description: string;
  payer: PixPayer;
};

export type PixPaymentResult = {
  mpPaymentId: string;
  status: string;
  statusDetail: string | null;
  qrCode: string;
  qrCodeBase64: string;
};

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ") || firstName;
  return { firstName, lastName };
}

export async function createPixPayment(
  input: CreatePixPaymentInput,
): Promise<PixPaymentResult> {
  const paymentClient = new Payment(getClient());
  const { firstName, lastName } = splitName(input.payer.name);

  let result;
  try {
    result = await paymentClient.create({
      body: {
        transaction_amount: input.amount,
        description: input.description,
        payment_method_id: "pix",
        payer: {
          email: input.payer.email,
          first_name: firstName,
          last_name: lastName,
          identification: {
            type: "CPF",
            number: input.payer.cpf,
          },
        },
      },
      requestOptions: {
        idempotencyKey: crypto.randomUUID(),
      },
    });
  } catch (error) {
    throw new Error(parseMercadoPagoError(error));
  }

  const transactionData = result.point_of_interaction?.transaction_data;
  const qrCode = transactionData?.qr_code;
  const qrCodeBase64 = transactionData?.qr_code_base64;

  if (!result.id || !qrCode || !qrCodeBase64) {
    throw new Error("Resposta inválida do Mercado Pago ao criar pagamento Pix");
  }

  return {
    mpPaymentId: String(result.id),
    status: result.status ?? "pending",
    statusDetail: result.status_detail ?? null,
    qrCode,
    qrCodeBase64,
  };
}

export async function getPayment(mpPaymentId: string) {
  const paymentClient = new Payment(getClient());

  try {
    const result = await paymentClient.get({ id: mpPaymentId });

    return {
      mpPaymentId: String(result.id),
      status: result.status ?? "pending",
      statusDetail: result.status_detail ?? null,
    };
  } catch (error) {
    throw new Error(parseMercadoPagoError(error));
  }
}

export async function syncPaymentStatus(mpPaymentId: string) {
  const mpPayment = await getPayment(mpPaymentId);
  return mpPayment;
}
