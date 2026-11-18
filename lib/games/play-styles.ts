import { formatDezenaBetSummary, parseDezenaBetDetails } from "@/lib/games/dezena-options";
import { formatGrupoBetSummary, parseGrupoBetDetails } from "@/lib/games/grupo-options";
import { formatMilharBetSummary, parseMilharBetDetails } from "@/lib/games/milhar-options";

export const PLAY_STYLES = [
  "MILHAR",
  "CENTENA",
  "MILHAR E CENTENA",
  "DEZENA",
  "DUQUE DE DEZENA",
  "TERNO DE DEZENA",
  "TERNO DEZENA CRUZADO",
  "PASSE",
  "GRUPO",
  "DUPLA DE GRUPO",
  "TERNO DE GRUPO",
  "TERNO DE GRUPO CRUZADO",
  "QUADRA DE GRUPO",
  "QUINA DE GRUPO",
  "SURPRESINHA",
  "MILHAR INVERTIDA",
  "MILHAR E CENTENA INV",
  "DEZENA INVERTIDA",
] as const;

export type PlayStyle = (typeof PLAY_STYLES)[number];

export function isPlayStyle(value: string): value is PlayStyle {
  return (PLAY_STYLES as readonly string[]).includes(value);
}

export function formatPalpite(prediction: {
  playStyle?: string | null;
  betNumber?: string | null;
  betDetails?: unknown;
  homeScore?: number | null;
  awayScore?: number | null;
}): string {
  if (prediction.playStyle === "MILHAR") {
    const summary = formatMilharBetSummary(parseMilharBetDetails(prediction.betDetails));
    if (summary) return summary;
  }

  if (prediction.playStyle === "GRUPO") {
    const summary = formatGrupoBetSummary(parseGrupoBetDetails(prediction.betDetails));
    if (summary) return summary;
  }

  if (prediction.playStyle === "DEZENA") {
    const summary = formatDezenaBetSummary(parseDezenaBetDetails(prediction.betDetails));
    if (summary) return summary;
  }

  if (prediction.playStyle && prediction.betNumber) {
    return `${prediction.playStyle} — ${prediction.betNumber}`;
  }

  if (prediction.homeScore != null && prediction.awayScore != null) {
    return `${prediction.homeScore} x ${prediction.awayScore}`;
  }

  return "—";
}
