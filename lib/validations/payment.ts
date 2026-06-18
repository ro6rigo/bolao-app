import { z } from "zod";

import { betAmountSchema } from "@/lib/validations/bet";

import { cpfSchema } from "@/lib/validations/cpf";

export const createPaymentSchema = z.object({
  amount: betAmountSchema,
  email: z.string().email("E-mail inválido"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cpf: cpfSchema,
  description: z.string().optional().default("Pagamento via Pix"),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const paymentStatusSchema = z.enum([
  "pending",
  "approved",
  "authorized",
  "in_process",
  "in_mediation",
  "rejected",
  "cancelled",
  "refunded",
  "charged_back",
]);

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
