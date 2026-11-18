export const EXTRACTION_CODES = ["PPT", "PTM", "PT", "PTV", "PTN", "FED", "COR"] as const;

export type ExtractionCode = (typeof EXTRACTION_CODES)[number];

/** Horário do jogo (America/Sao_Paulo) → coluna do Deu no Poste (RJ). */
export const TIME_TO_EXTRACTION: Record<string, ExtractionCode> = {
  "11:00": "PTM",
  "14:00": "PT",
  "16:00": "PTV",
  "18:00": "PTN",
  "19:00": "FED",
  "21:00": "COR",
};

export const EXTRACTION_LABELS: Record<ExtractionCode, string> = {
  PPT: "PPT (09:30)",
  PTM: "PTM (11:00)",
  PT: "PT (14:00)",
  PTV: "PTV (16:00)",
  PTN: "PTN (18:00)",
  FED: "Federal (19:00)",
  COR: "Corujinha (21:00)",
};

export function extractionCodeForTime(time: string): ExtractionCode | null {
  return TIME_TO_EXTRACTION[time] ?? null;
}

export function isExtractionCode(value: string): value is ExtractionCode {
  return (EXTRACTION_CODES as readonly string[]).includes(value);
}