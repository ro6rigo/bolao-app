const DEFAULT_CLOSE_MINUTES = 30;

export function getBetCloseMinutesBefore(): number {
  const raw = process.env.BET_CLOSE_MINUTES_BEFORE?.trim();
  if (!raw) return DEFAULT_CLOSE_MINUTES;

  const minutes = Number(raw);
  if (!Number.isFinite(minutes) || minutes < 0) {
    return DEFAULT_CLOSE_MINUTES;
  }

  return minutes;
}

export function getBettingClosesAt(matchDate: Date): Date {
  const offsetMs = getBetCloseMinutesBefore() * 60 * 1000;
  return new Date(matchDate.getTime() - offsetMs);
}

export function isBettingOpen(matchDate: Date, now = new Date()): boolean {
  return now.getTime() < getBettingClosesAt(matchDate).getTime();
}

export function formatBettingCloseMessage(matchDate: Date): string {
  const closesAt = getBettingClosesAt(matchDate);
  const formatted = closesAt.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
  return `Palpites encerrados. O prazo terminou às ${formatted}.`;
}
