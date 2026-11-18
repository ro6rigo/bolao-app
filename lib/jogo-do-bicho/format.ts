import { EXTRACTION_LABELS, type ExtractionCode } from "@/lib/jogo-do-bicho/extractions";
import type { DrawPrize } from "@/lib/jogo-do-bicho/types";

export function parseDrawResults(value: unknown): DrawPrize[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is DrawPrize =>
      typeof item === "object" &&
      item != null &&
      typeof (item as DrawPrize).position === "number" &&
      typeof (item as DrawPrize).milhar === "string",
  );
}

export function formatGameDrawResult(
  drawCode: string | null | undefined,
  drawResults: unknown,
): string | null {
  if (!drawCode) return null;
  const prizes = parseDrawResults(drawResults);
  if (prizes.length === 0) return null;

  const label = EXTRACTION_LABELS[drawCode as ExtractionCode] ?? drawCode;
  const summary = prizes
    .filter((p) => p.position >= 1 && p.position <= 5)
    .map((p) => `${p.milhar}-${p.grupo}`)
    .join(", ");

  return `${label}: ${summary}`;
}