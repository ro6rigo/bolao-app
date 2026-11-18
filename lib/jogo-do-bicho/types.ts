import type { ExtractionCode } from "@/lib/jogo-do-bicho/extractions";

export type DrawPrize = {
  position: number;
  milhar: string;
  grupo: string;
  raw: string;
};

export type DeuNoPosteTable = {
  /** YYYY-MM-DD em America/Sao_Paulo */
  date: string;
  caption: string;
  columns: Partial<Record<ExtractionCode, DrawPrize[]>>;
};