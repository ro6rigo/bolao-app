import { parseDezenaBetDetails } from "@/lib/games/dezena-options";
import { parseGrupoBetDetails } from "@/lib/games/grupo-options";
import { parseMilharBetDetails } from "@/lib/games/milhar-options";
import { parseMilharCentenaBetDetails } from "@/lib/games/milhar-centena-options";
import { parseSimpleBetDetails } from "@/lib/games/simple-bet-details";

function totalFromBetDetails(value: unknown): number | null {
  for (const parse of [
    parseMilharBetDetails,
    parseGrupoBetDetails,
    parseDezenaBetDetails,
    parseMilharCentenaBetDetails,
    parseSimpleBetDetails,
  ]) {
    const details = parse(value);
    if (details) return details.totalAmount;
  }

  if (value && typeof value === "object" && "totalAmount" in value) {
    const amount = Number((value as { totalAmount: unknown }).totalAmount);
    if (Number.isFinite(amount) && amount > 0) return amount;
  }

  return null;
}

/** Valor apostado (somatório das linhas), priorizando pagamento Pix quando existir. */
export function predictionTotalAmount(prediction: {
  betDetails?: unknown;
  payment?: { amount: number } | null;
}): number | null {
  const paid = prediction.payment?.amount;
  if (paid != null && paid > 0) return paid;
  return totalFromBetDetails(prediction.betDetails);
}

export function formatPredictionTotalAmount(
  prediction: Parameters<typeof predictionTotalAmount>[0],
): string {
  const total = predictionTotalAmount(prediction);
  if (total == null) return "—";
  return total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}