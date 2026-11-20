import type { DrawPrize } from "@/lib/jogo-do-bicho/types";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Milhar sorteado com 4 dígitos (ex.: 1234). */
export function normalizeDrawMilhar(milhar: string): string {
  return digitsOnly(milhar).padStart(4, "0").slice(-4);
}

/** Centena = 3 últimos dígitos do milhar (ex.: 1234 → 234). */
export function centenaFromDrawMilhar(milhar: string): string {
  return normalizeDrawMilhar(milhar).slice(-3);
}

/** Dezena = 2 últimos dígitos do milhar (ex.: 1234 → 34). */
export function dezenaFromDrawMilhar(milhar: string): string {
  return normalizeDrawMilhar(milhar).slice(-2);
}

/** Grupo do resultado (ex.: “1234-10” → 10), não derivado do milhar. */
export function normalizeGrupoValue(value: string): string | null {
  const n = Number(digitsOnly(value));
  if (!Number.isFinite(n) || n < 1 || n > 25) return null;
  return String(n);
}

function normalizeMilharBet(bet: string): string | null {
  const d = digitsOnly(bet);
  if (!d) return null;
  return d.padStart(4, "0").slice(-4);
}

function normalizeCentenaBet(bet: string): string | null {
  const d = digitsOnly(bet);
  if (!d) return null;
  return d.padStart(3, "0").slice(-3);
}

function normalizeDezenaBet(bet: string): string | null {
  const d = digitsOnly(bet);
  if (!d) return null;
  return d.padStart(2, "0").slice(-2);
}

/** Palpite milhar × resultado `milhar-grupo`. */
export function matchesMilharBet(betNumber: string, prize: DrawPrize): boolean {
  const bet = normalizeMilharBet(betNumber);
  if (!bet) return false;
  return normalizeDrawMilhar(prize.milhar) === bet;
}

/** Palpite centena × 3 últimos dígitos do milhar sorteado. */
export function matchesCentenaBet(betNumber: string, prize: DrawPrize): boolean {
  const bet = normalizeCentenaBet(betNumber);
  if (!bet) return false;
  return centenaFromDrawMilhar(prize.milhar) === bet;
}

/** Palpite dezena × 2 últimos dígitos do milhar sorteado. */
export function matchesDezenaBet(betNumber: string, prize: DrawPrize): boolean {
  const bet = normalizeDezenaBet(betNumber);
  if (!bet) return false;
  return dezenaFromDrawMilhar(prize.milhar) === bet;
}

/** Palpite grupo × campo grupo do resultado (ex.: 10 em 1234-10). */
export function matchesGrupoBet(betNumber: string, prize: DrawPrize): boolean {
  const bet = normalizeGrupoValue(betNumber);
  const drawGrupo = normalizeGrupoValue(prize.grupo);
  if (!bet || !drawGrupo) return false;
  return bet === drawGrupo;
}

export function prizeMatchesPlayStyle(
  playStyle: string,
  betNumber: string,
  prize: DrawPrize,
): boolean {
  switch (playStyle) {
    case "MILHAR":
      return matchesMilharBet(betNumber, prize);
    case "CENTENA":
      return matchesCentenaBet(betNumber, prize);
    case "DEZENA":
      return matchesDezenaBet(betNumber, prize);
    case "GRUPO":
      return matchesGrupoBet(betNumber, prize);
    default:
      return false;
  }
}