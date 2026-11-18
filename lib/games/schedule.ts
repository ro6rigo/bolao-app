const SAO_PAULO_OFFSET = "-03:00";

/** Horários por dia da semana (America/Sao_Paulo). 0 = domingo. */
const WEEKDAY_SLOTS: Record<number, readonly string[]> = {
  0: ["11:00", "14:00", "16:00"],
  1: ["11:00", "14:00", "16:00", "18:00", "21:00"],
  2: ["11:00", "14:00", "16:00", "18:00", "21:00"],
  3: ["11:00", "14:00", "16:00", "19:00", "21:00"],
  4: ["11:00", "14:00", "16:00", "18:00", "21:00"],
  5: ["11:00", "14:00", "16:00", "18:00", "21:00"],
  6: ["11:00", "14:00", "16:00", "19:00", "21:00"],
};

const WEEKDAY_NAMES = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export function todayInSaoPaulo(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function getWeekdayInSaoPaulo(date: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
  }).formatToParts(slotToDate(date, "12:00"));

  const token = parts.find((part) => part.type === "weekday")?.value ?? "";
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[token] ?? 0;
}

export function weekdayLabel(date: string): string {
  return WEEKDAY_NAMES[getWeekdayInSaoPaulo(date)] ?? "";
}

export function getSlotsForDate(date: string): readonly string[] {
  return WEEKDAY_SLOTS[getWeekdayInSaoPaulo(date)] ?? [];
}

export function slotToDate(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${SAO_PAULO_OFFSET}`);
}

export function formatSlotInSaoPaulo(value: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${read("year")}-${read("month")}-${read("day")}`,
    time: `${read("hour")}:${read("minute")}`,
  };
}

export function getMatchDatesForDay(date: string): Date[] {
  return getSlotsForDate(date).map((time) => slotToDate(date, time));
}

export function getDayBoundsInSaoPaulo(date: string): { start: Date; end: Date } {
  return {
    start: slotToDate(date, "00:00"),
    end: slotToDate(date, "23:59"),
  };
}