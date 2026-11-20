import { z } from "zod";
import { betAmountSchema } from "@/lib/validations/bet";
import {
  milharToCentena,
  normalizeMilharNumber,
  splitAmountInHalf,
} from "@/lib/games/milhar-options";

const entrySchema = z.object({
  playStyle: z.string(),
  betNumber: z.string(),
  amount: betAmountSchema,
  from: z.string(),
  prizeFrom: z.number().int().min(1).max(7),
  prizeTo: z.number().int().min(1).max(7),
});

export const milharCentenaBetDetailsSchema = z.object({
  number: z.string().min(1),
  playStyle: z.literal("MILHAR E CENTENA"),
  totalAmount: betAmountSchema,
  entries: z.array(entrySchema).min(2),
});

export type MilharCentenaBetDetails = z.infer<typeof milharCentenaBetDetailsSchema>;

const SOURCE = "MILHAR E CENTENA";

/** Valor total vira 2 jogos: milhar (4 dígitos) + centena (3 últimos), metade em cada (1º prêmio). */
export function buildMilharCentenaBetDetails(
  betNumber: string,
  stakeAmount: number,
): MilharCentenaBetDetails {
  const milhar = normalizeMilharNumber(betNumber);
  const centena = milharToCentena(betNumber);
  const [milharAmount, centenaAmount] = splitAmountInHalf(stakeAmount);

  return milharCentenaBetDetailsSchema.parse({
    number: milhar,
    playStyle: SOURCE,
    totalAmount: stakeAmount,
    entries: [
      {
        playStyle: "MILHAR",
        betNumber: milhar,
        amount: milharAmount,
        from: SOURCE,
        prizeFrom: 1,
        prizeTo: 1,
      },
      {
        playStyle: "CENTENA",
        betNumber: centena,
        amount: centenaAmount,
        from: SOURCE,
        prizeFrom: 1,
        prizeTo: 1,
      },
    ],
  });
}

function legacyToExpanded(value: Record<string, unknown>): unknown {
  if (
    value.playStyle === SOURCE &&
    Array.isArray(value.entries) &&
    value.entries.length === 1 &&
    (value.entries[0] as { playStyle?: string })?.playStyle === SOURCE
  ) {
    const amount = Number(value.totalAmount);
    const number = String(value.number ?? "");
    if (Number.isFinite(amount) && amount > 0) {
      try {
        return buildMilharCentenaBetDetails(number, amount);
      } catch {
        return value;
      }
    }
  }
  return value;
}

export function parseMilharCentenaBetDetails(value: unknown): MilharCentenaBetDetails | null {
  if (value && typeof value === "object") {
    const normalized = legacyToExpanded(value as Record<string, unknown>);
    const parsed = milharCentenaBetDetailsSchema.safeParse(normalized);
    return parsed.success ? parsed.data : null;
  }
  return null;
}

function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatMilharCentenaBetSummary(
  details: MilharCentenaBetDetails | null,
): string | null {
  if (!details) return null;
  const parts = details.entries.map(
    (e) => `${e.playStyle} ${e.betNumber} ${formatMoney(e.amount)} (1º)`,
  );
  return `Nº ${details.number} — ${parts.join(" + ")}`;
}

export function isMilharCentenaPlayStyle(playStyle: string): boolean {
  return playStyle === SOURCE;
}