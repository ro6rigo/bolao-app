import { EXTRACTION_CODES, type ExtractionCode } from "@/lib/jogo-do-bicho/extractions";
import { parseCaptionDate } from "@/lib/jogo-do-bicho/parse-caption";
import type { DeuNoPosteTable, DrawPrize } from "@/lib/jogo-do-bicho/types";

const MAIN_TABLE_RE = /<table class="twelve"[^>]*>([\s\S]*?)<\/table>/i;

function decodeHtml(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'");
}

function cellToPrize(position: number, html: string): DrawPrize | null {
  const raw = decodeHtml(html.replace(/<[^>]+>/g, "").trim());
  const match = raw.match(/^(\d{3,4})-(\d{1,2})$/);
  if (!match) return null;

  const milhar = match[1];
  const grupo = match[2];
  if (milhar === "0000" || milhar === "000") return null;

  return { position, milhar, grupo, raw };
}

function parseTableBlock(tableHtml: string): DeuNoPosteTable | null {
  const captionMatch = tableHtml.match(/<caption[^>]*>([\s\S]*?)<\/caption>/i);
  if (!captionMatch) return null;

  const caption = decodeHtml(captionMatch[1].replace(/<[^>]+>/g, "").trim());
  const date = parseCaptionDate(caption);
  if (!date) return null;

  const headerMatch = tableHtml.match(/<thead[^>]*>[\s\S]*?<\/thead>/i);
  if (!headerMatch) return null;

  const headerCells = [...headerMatch[0].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) =>
    decodeHtml(m[1].replace(/<[^>]+>/g, "").trim()),
  );

  const codes: ExtractionCode[] = [];
  for (const label of headerCells) {
    const upper = label.toUpperCase();
    if ((EXTRACTION_CODES as readonly string[]).includes(upper)) {
      codes.push(upper as ExtractionCode);
    }
  }
  if (codes.length === 0) return null;

  const bodyMatch = tableHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!bodyMatch) return null;

  const columns: DeuNoPosteTable["columns"] = {};
  for (const code of codes) {
    columns[code] = [];
  }

  const rows = [...bodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const row of rows) {
    const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)];
    if (cells.length < 2) continue;

    const position = Number(decodeHtml(cells[0][1].replace(/<[^>]+>/g, "").trim()));
    if (!Number.isFinite(position)) continue;

    for (let i = 0; i < codes.length; i++) {
      const cellHtml = cells[i + 1]?.[1];
      if (!cellHtml) continue;
      const prize = cellToPrize(position, cellHtml);
      if (prize) columns[codes[i]]?.push(prize);
    }
  }

  return { date, caption, columns };
}

export function parseDeuNoPosteHtml(html: string): DeuNoPosteTable {
  const tableMatch = html.match(MAIN_TABLE_RE);
  if (!tableMatch) {
    throw new Error("Tabela do Deu no Poste não encontrada na página");
  }

  const table = parseTableBlock(tableMatch[0]);
  if (!table) {
    throw new Error("Não foi possível ler a tabela amarela do Deu no Poste");
  }

  return table;
}

export function getExtractionColumn(table: DeuNoPosteTable, code: ExtractionCode): DrawPrize[] {
  const prizes = table.columns[code] ?? [];
  return prizes.sort((a, b) => a.position - b.position);
}

export function isExtractionReady(prizes: DrawPrize[]): boolean {
  return prizes.some((p) => p.position >= 1 && p.position <= 5);
}