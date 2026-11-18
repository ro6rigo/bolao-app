import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  getExtractionColumn,
  isExtractionReady,
  parseDeuNoPosteHtml,
} from "@/lib/jogo-do-bicho/parse-html";
import type { DeuNoPosteTable, DrawPrize } from "@/lib/jogo-do-bicho/types";
import type { ExtractionCode } from "@/lib/jogo-do-bicho/extractions";

const DEU_NO_POSTE_URL = "https://www.ojogodobicho.com/deu_no_poste.htm";

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const execFileAsync = promisify(execFile);

async function fetchDeuNoPosteViaCurl(): Promise<string> {
  const curlBin = process.platform === "win32" ? "curl.exe" : "curl";
  const { stdout } = await execFileAsync(
    curlBin,
    ["-sL", "-A", BROWSER_USER_AGENT, DEU_NO_POSTE_URL],
    { encoding: "utf8", maxBuffer: 8_000_000 },
  );
  return stdout;
}

export async function fetchDeuNoPosteHtml(): Promise<string> {
  let html = "";

  try {
    const response = await fetch(DEU_NO_POSTE_URL, {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9",
        Referer: "https://www.ojogodobicho.com/",
      },
      next: { revalidate: 60 },
    });

    if (response.ok) {
      html = await response.text();
    }
  } catch {
    // tenta curl abaixo
  }

  if (!html || html.includes("Just a moment")) {
    html = await fetchDeuNoPosteViaCurl();
  }

  if (html.includes("Just a moment") && html.includes("challenges.cloudflare")) {
    throw new Error("Deu no Poste bloqueou a consulta (Cloudflare). Tente novamente em instantes.");
  }

  if (!html.trim()) {
    throw new Error("Resposta vazia do Deu no Poste");
  }

  return html;
}

export async function fetchDeuNoPosteResults(): Promise<DeuNoPosteTable> {
  const html = await fetchDeuNoPosteHtml();
  return parseDeuNoPosteHtml(html);
}

export async function fetchExtractionForDate(
  gameDate: string,
  code: ExtractionCode,
): Promise<{ table: DeuNoPosteTable; prizes: DrawPrize[] }> {
  const table = await fetchDeuNoPosteResults();

  if (table.date !== gameDate) {
    throw new Error(
      `O resultado publicado é de ${table.date}, mas o jogo é de ${gameDate}.`,
    );
  }

  const prizes = getExtractionColumn(table, code);
  if (!isExtractionReady(prizes)) {
    throw new Error(`Extração ${code} ainda não foi publicada no Deu no Poste.`);
  }

  return { table, prizes };
}