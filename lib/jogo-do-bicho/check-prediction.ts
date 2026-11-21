import type { DrawPrize } from "@/lib/jogo-do-bicho/types";
import {
  centenaFromDrawMilhar,
  dezenaFromDrawMilhar,
  matchesCentenaBet,
  matchesDezenaBet,
  matchesDezenaInvertidaBet,
  matchesGrupoBet,
  matchesMilharBet,
  matchesMilharECentenaInvBet,
  matchesMilharInvertidaBet,
  normalizeDrawMilhar,
  normalizeGrupoValue,
} from "@/lib/jogo-do-bicho/draw-match";
import { parseDezenaBetDetails } from "@/lib/games/dezena-options";
import { parseGrupoBetDetails } from "@/lib/games/grupo-options";
import { parseMilharBetDetails, type MilharBetEntry } from "@/lib/games/milhar-options";
import type { PlayStyle } from "@/lib/games/play-styles";

function mainPrizes(prizes: DrawPrize[]): DrawPrize[] {
  return prizes.filter((p) => p.position >= 1 && p.position <= 5);
}

export function prizesInRange(prizes: DrawPrize[], prizeFrom: number, prizeTo: number): DrawPrize[] {
  return prizes.filter((p) => p.position >= prizeFrom && p.position <= prizeTo);
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function sameLength(value: string, length: number): string {
  return digitsOnly(value).padStart(length, "0").slice(-length);
}

/** Conferência exata sobre a lista de prêmios já filtrada (faixa). */
export function isPredictionCorrectOnPrizes(
  playStyle: PlayStyle | string,
  betNumber: string,
  prizes: DrawPrize[],
): boolean {
  if (prizes.length === 0) return false;

  const bet = digitsOnly(betNumber);
  if (!bet) return false;

  switch (playStyle) {
    case "MILHAR":
      return prizes.some((prize) => matchesMilharBet(betNumber, prize));
    case "CENTENA":
      return prizes.some((prize) => matchesCentenaBet(betNumber, prize));
    case "MILHAR E CENTENA": {
      const milhar = sameLength(bet, 4);
      const centena = sameLength(bet, 3);
      return prizes.some(
        (prize) =>
          normalizeDrawMilhar(prize.milhar) === milhar ||
          centenaFromDrawMilhar(prize.milhar) === centena,
      );
    }
    case "DEZENA":
      return prizes.some((prize) => matchesDezenaBet(betNumber, prize));
    case "GRUPO":
      return prizes.some((prize) => matchesGrupoBet(betNumber, prize));
    case "MILHAR INVERTIDA":
      return prizes.some((prize) => matchesMilharInvertidaBet(betNumber, prize));
    case "MILHAR E CENTENA INV":
      return prizes.some((prize) => matchesMilharECentenaInvBet(betNumber, prize));
    case "DEZENA INVERTIDA":
      return prizes.some((prize) => matchesDezenaInvertidaBet(betNumber, prize));
  }

  return false;
}

export function isPredictionCorrect(
  playStyle: PlayStyle | string,
  betNumber: string,
  prizes: DrawPrize[],
): boolean {
  return isPredictionCorrectOnPrizes(playStyle, betNumber, mainPrizes(prizes));
}

export function isMilharBetEntryCorrect(entry: MilharBetEntry, prizes: DrawPrize[]): boolean {
  const scoped = prizesInRange(prizes, entry.prizeFrom, entry.prizeTo);
  return isPredictionCorrectOnPrizes(entry.playStyle, entry.betNumber, scoped);
}

export type MilharBetLineLike = {
  playStyle: string;
  betNumber: string;
  prizeFrom: number;
  prizeTo: number;
};

export function isMilharBetLineCorrect(line: MilharBetLineLike, prizes: DrawPrize[]): boolean {
  const scoped = prizesInRange(prizes, line.prizeFrom, line.prizeTo);
  return isPredictionCorrectOnPrizes(line.playStyle, line.betNumber, scoped);
}

export function isMilharBetCorrect(betDetails: unknown, prizes: DrawPrize[]): boolean {
  const details = parseMilharBetDetails(betDetails);
  if (!details) return false;
  return details.entries.some((entry) => isMilharBetEntryCorrect(entry, prizes));
}

export function isGrupoBetCorrect(betDetails: unknown, prizes: DrawPrize[]): boolean {
  const details = parseGrupoBetDetails(betDetails);
  if (!details) return false;
  return details.entries.some((entry) => isMilharBetEntryCorrect(entry, prizes));
}

export function isDezenaBetCorrect(betDetails: unknown, prizes: DrawPrize[]): boolean {
  const details = parseDezenaBetDetails(betDetails);
  if (!details) return false;
  return details.entries.some((entry) => isMilharBetEntryCorrect(entry, prizes));
}

export function formatDrawSummary(prizes: DrawPrize[]): string {
  const main = mainPrizes(prizes);
  if (main.length === 0) return "sem prêmios";
  return main.map((p) => `${p.milhar}-${p.grupo}`).join(", ");
}

/** Exportado para testes e documentação da regra de grupo. */
export { normalizeGrupoValue };