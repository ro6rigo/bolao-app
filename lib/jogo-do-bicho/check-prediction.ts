import type { DrawPrize } from "@/lib/jogo-do-bicho/types";
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

function isInvertedMilhar(bet: string, milhar: string): boolean {
  const a = sameLength(bet, 4).split("").sort().join("");
  const b = milhar.split("").sort().join("");
  return a === b;
}

/** Conferência exata sobre a lista de prêmios já filtrada (faixa). */
export function isPredictionCorrectOnPrizes(
  playStyle: PlayStyle | string,
  betNumber: string,
  prizes: DrawPrize[],
): boolean {
  if (prizes.length === 0) return false;

  const milhars = prizes.map((p) => p.milhar.padStart(4, "0"));
  const centenas = milhars.map((m) => m.slice(-3));
  const dezenas = milhars.map((m) => m.slice(-2));
  const grupos = prizes.map((p) => p.grupo);

  const bet = digitsOnly(betNumber);
  if (!bet) return false;

  switch (playStyle) {
    case "MILHAR":
      return milhars.includes(sameLength(bet, 4));
    case "CENTENA":
      return centenas.includes(sameLength(bet, 3));
    case "MILHAR E CENTENA":
      return (
        milhars.includes(sameLength(bet, 4)) || centenas.includes(sameLength(bet, 3))
      );
    case "DEZENA":
      return dezenas.includes(sameLength(bet, 2));
    case "GRUPO":
      return grupos.includes(sameLength(bet, 1)) || grupos.includes(sameLength(bet, 2));
    case "MILHAR INVERTIDA":
      return milhars.some((m) => isInvertedMilhar(bet, m));
    case "MILHAR E CENTENA INV":
      return (
        milhars.some((m) => isInvertedMilhar(bet, m)) ||
        centenas.includes(sameLength(bet, 3))
      );
    case "DEZENA INVERTIDA":
      return dezenas.some((d) => {
        const a = sameLength(bet, 2).split("").sort().join("");
        const b = d.split("").sort().join("");
        return a === b;
      });
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