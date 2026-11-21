import { centenaReversedInv, milharReversed } from "@/lib/games/milhar-options";
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

/** Dezena invertida do palpite (ex.: 29 → 92). */
export function dezenaInvertidaFromBet(betNumber: string): string | null {
  const bet = normalizeDezenaBet(betNumber);
  if (!bet) return null;
  return bet.split("").reverse().join("");
}

/**
 * Dezena invertida: a dezena sorteadA deve ser o palpite com dígitos invertidos
 * (ex.: palpite 29 → acerta milhar 1292-12, dezena 92; não acerta 5629-8, dezena 29).
 */
export function matchesDezenaInvertidaBet(betNumber: string, prize: DrawPrize): boolean {
  const target = dezenaInvertidaFromBet(betNumber);
  if (!target) return false;
  return dezenaFromDrawMilhar(prize.milhar) === target;
}

/** Milhar invertida: milhar sorteado = palpite com 4 dígitos invertidos (1234 → 4321). */
export function milharInvertidaTargetFromBet(betNumber: string): string | null {
  try {
    return milharReversed(betNumber);
  } catch {
    return null;
  }
}

export function matchesMilharInvertidaBet(betNumber: string, prize: DrawPrize): boolean {
  const target = milharInvertidaTargetFromBet(betNumber);
  if (!target) return false;
  return normalizeDrawMilhar(prize.milhar) === target;
}

/**
 * Centena invertida (palpite em milhar de 4 dígitos): 3 primeiros invertidos (1234 → 321),
 * igual ao MC INV — conferência na centena sorteada (3 últimos do milhar).
 */
export function centenaInvertidaTargetFromMilharBet(betNumber: string): string | null {
  try {
    return centenaReversedInv(betNumber);
  } catch {
    return null;
  }
}

export function matchesCentenaInvertidaFromMilharBet(betNumber: string, prize: DrawPrize): boolean {
  const target = centenaInvertidaTargetFromMilharBet(betNumber);
  if (!target) return false;
  return centenaFromDrawMilhar(prize.milhar) === target;
}

/** Milhar e centena invertida: acerta milhar invertido OU centena invertida do palpite. */
export function matchesMilharECentenaInvBet(betNumber: string, prize: DrawPrize): boolean {
  return (
    matchesMilharInvertidaBet(betNumber, prize) ||
    matchesCentenaInvertidaFromMilharBet(betNumber, prize)
  );
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