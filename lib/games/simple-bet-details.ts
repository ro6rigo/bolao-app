import { z } from "zod";
import { betAmountSchema } from "@/lib/validations/bet";

const entrySchema = z.object({
  playStyle: z.string(),
  betNumber: z.string(),
  amount: betAmountSchema,
  from: z.string(),
  prizeFrom: z.number().int().min(1).max(7),
  prizeTo: z.number().int().min(1).max(7),
});

export const simpleBetDetailsSchema = z.object({
  number: z.string().min(1),
  playStyle: z.string().min(1),
  totalAmount: betAmountSchema,
  entries: z.array(entrySchema).min(1),
});

export type SimpleBetDetails = z.infer<typeof simpleBetDetailsSchema>;

export const STRUCTURED_PALPITE_STYLES = ["MILHAR", "GRUPO", "DEZENA"] as const;

export function isStructuredPalpiteStyle(playStyle: string): boolean {
  return (STRUCTURED_PALPITE_STYLES as readonly string[]).includes(playStyle);
}

/** Usa buildSimpleBetDetails (1 jogo) em vez de expansão dedicada. */
export function isPlainSimpleStakeStyle(playStyle: string): boolean {
  return !isStructuredPalpiteStyle(playStyle) && playStyle !== "MILHAR E CENTENA";
}

/** Palpite simples: um número, um valor, vale do 1º ao 5º prêmio. */
export function buildSimpleBetDetails(
  playStyle: string,
  betNumber: string,
  stakeAmount: number,
): SimpleBetDetails {
  const number = betNumber.trim();
  return simpleBetDetailsSchema.parse({
    number,
    playStyle,
    totalAmount: stakeAmount,
    entries: [
      {
        playStyle,
        betNumber: number,
        amount: stakeAmount,
        from: playStyle,
        prizeFrom: 1,
        prizeTo: 5,
      },
    ],
  });
}

export function parseSimpleBetDetails(value: unknown): SimpleBetDetails | null {
  const parsed = simpleBetDetailsSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function formatSimpleBetSummary(details: SimpleBetDetails | null): string | null {
  if (!details) return null;
  const entry = details.entries[0];
  if (!entry) return null;
  const formatted = details.totalAmount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return `${details.playStyle} — ${entry.betNumber} — ${formatted}`;
}