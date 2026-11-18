const MONTHS: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  março: 3,
  marco: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

export function parseCaptionDate(caption: string): string | null {
  const match = caption.match(/(\d{1,2})\s+de\s+([\p{L}]+)\s+de\s+(\d{4})/iu);
  if (!match) return null;

  const day = Number(match[1]);
  const monthName = match[2].normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const year = Number(match[3]);
  const month = MONTHS[monthName];
  if (!month || !Number.isFinite(day) || !Number.isFinite(year)) return null;

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}