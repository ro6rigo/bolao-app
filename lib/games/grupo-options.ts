import { z } from "zod";
import { betAmountSchema } from "@/lib/validations/bet";
import { betLinesFromDetails } from "@/lib/games/bet-lines";

export const GRUPO_EXTRA_OPTIONS = [
  { code: "2", label: "2" },
  { code: "3", label: "3" },
  { code: "4", label: "4" },
  { code: "5", label: "5" },
  { code: "6", label: "6" },
  { code: "7", label: "7" },
] as const;

export type GrupoExtraCode = (typeof GRUPO_EXTRA_OPTIONS)[number]["code"];

export const grupoExtraCodeSchema = z.enum(["2", "3", "4", "5", "6", "7"]);

const selectionSchema = z.object({
  code: z.literal("GRUPO").or(grupoExtraCodeSchema),
  label: z.string(),
  amount: betAmountSchema,
});

const entrySchema = z.object({
  playStyle: z.string(),
  betNumber: z.string(),
  amount: betAmountSchema,
  from: z.string(),
  prizeFrom: z.number().int().min(1).max(7).default(1),
  prizeTo: z.number().int().min(1).max(7).default(1),
});

export const grupoBetDetailsSchema = z.object({
  number: z.string().trim().regex(/^\d{1,2}$/, "Grupo inválido"),
  selections: z.array(selectionSchema).min(1),
  entries: z.array(entrySchema).min(1),
  totalAmount: betAmountSchema,
});

export type GrupoBetDetails = z.infer<typeof grupoBetDetailsSchema>;
export type GrupoBetEntry = z.infer<typeof entrySchema>;

export function labelForGrupoExtra(code: GrupoExtraCode): string {
  return GRUPO_EXTRA_OPTIONS.find((item) => item.code === code)?.label ?? code;
}

export function normalizeGrupoNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  const n = Number(digits);
  if (!Number.isFinite(n) || n < 1 || n > 25) {
    throw new Error("Grupo deve ser de 1 a 25");
  }
  return String(n);
}

function prizeRangeForExtra(code: GrupoExtraCode): { prizeFrom: number; prizeTo: number } {
  const n = Number(code);
  if (code === "2") {
    return { prizeFrom: 2, prizeTo: 2 };
  }
  return { prizeFrom: 1, prizeTo: n };
}

function expandExtraSelection(
  grupo: string,
  code: GrupoExtraCode,
  amount: number,
): GrupoBetEntry[] {
  const { prizeFrom, prizeTo } = prizeRangeForExtra(code);
  return [
    {
      playStyle: "GRUPO",
      betNumber: grupo,
      amount,
      from: code,
      prizeFrom,
      prizeTo,
    },
  ];
}

export function buildGrupoBetDetails(
  betNumber: string,
  grupoAmount: number,
  extras: Array<{ code: GrupoExtraCode; amount: number }>,
): GrupoBetDetails {
  const number = normalizeGrupoNumber(betNumber);

  const selections: GrupoBetDetails["selections"] = [
    { code: "GRUPO", label: "GRUPO", amount: grupoAmount },
    ...extras.map((extra) => ({
      code: extra.code,
      label: labelForGrupoExtra(extra.code),
      amount: extra.amount,
    })),
  ];

  const entries: GrupoBetEntry[] = [
    {
      playStyle: "GRUPO",
      betNumber: number,
      amount: grupoAmount,
      from: "GRUPO",
      prizeFrom: 1,
      prizeTo: 1,
    },
  ];

  for (const extra of extras) {
    entries.push(...expandExtraSelection(number, extra.code, extra.amount));
  }

  const totalAmount = selections.reduce((sum, line) => sum + line.amount, 0);

  return grupoBetDetailsSchema.parse({
    number,
    selections,
    entries,
    totalAmount,
  });
}

export { betLinesFromDetails as grupoBetLinesFromDetails };

function normalizeLegacyDetails(value: Record<string, unknown>): unknown {
  if (Array.isArray(value.selections)) {
    const entriesNeedRebuild =
      !Array.isArray(value.entries) ||
      (value.entries as unknown[]).some(
        (item) =>
          typeof item === "object" &&
          item != null &&
          !("prizeFrom" in item) &&
          !("prizeTo" in item),
      );
    if (entriesNeedRebuild) {
      const selections = value.selections as GrupoBetDetails["selections"];
      const grupoSelection = selections.find((item) => item.code === "GRUPO");
      const grupoAmount = grupoSelection?.amount ?? 0;
      const extras = selections
        .filter((item) => item.code !== "GRUPO")
        .map((item) => ({
          code: item.code as GrupoExtraCode,
          amount: item.amount,
        }));
      try {
        return buildGrupoBetDetails(String(value.number ?? ""), grupoAmount, extras);
      } catch {
        return value;
      }
    }
  }
  return value;
}

export function parseGrupoBetDetails(value: unknown): GrupoBetDetails | null {
  if (value && typeof value === "object") {
    const normalized = normalizeLegacyDetails(value as Record<string, unknown>);
    const parsed = grupoBetDetailsSchema.safeParse(normalized);
    return parsed.success ? parsed.data : null;
  }
  return null;
}

function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPrizeRange(from: number, to: number): string {
  if (from === to) return `${to}º`;
  return `${from}º–${to}º`;
}

export function formatGrupoBetSummary(details: GrupoBetDetails | null): string | null {
  if (!details) return null;

  const grouped = details.entries.reduce<Record<string, GrupoBetEntry[]>>((acc, entry) => {
    const bucket = acc[entry.from] ?? [];
    bucket.push(entry);
    acc[entry.from] = bucket;
    return acc;
  }, {});

  const parts: string[] = [];

  const base = grouped.GRUPO?.[0];
  if (base) {
    parts.push(
      `Grupo ${base.betNumber} ${formatMoney(base.amount)} (${formatPrizeRange(base.prizeFrom, base.prizeTo)})`,
    );
  }

  for (const [from, entries] of Object.entries(grouped)) {
    if (from === "GRUPO") continue;
    for (const entry of entries) {
      parts.push(
        `${from}: GRUPO ${entry.betNumber} ${formatMoney(entry.amount)} (${formatPrizeRange(entry.prizeFrom, entry.prizeTo)})`,
      );
    }
  }

  return `Grupo ${details.number} — ${parts.join("; ")}`;
}

export const GRUPO_EXTRA_HINTS: Partial<Record<GrupoExtraCode, string>> = {
  "2": "Mais 1 jogo no 2º prêmio (com o valor marcado). Com o grupo principal: 2 jogos (1º e 2º).",
  "3": "1 jogo do 1º ao 3º prêmio.",
  "4": "1 jogo do 1º ao 4º prêmio.",
  "5": "1 jogo do 1º ao 5º prêmio (como MC 5).",
  "6": "1 jogo do 1º ao 6º prêmio.",
  "7": "1 jogo do 1º ao 7º prêmio.",
};
