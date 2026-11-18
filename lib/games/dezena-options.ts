import { z } from "zod";
import { betLinesFromDetails } from "@/lib/games/bet-lines";
import { betAmountSchema } from "@/lib/validations/bet";

export const DEZENA_EXTRA_OPTIONS = [
  { code: "2", label: "2" },
  { code: "3", label: "3" },
  { code: "4", label: "4" },
  { code: "5", label: "5" },
  { code: "6", label: "6" },
  { code: "7", label: "7" },
] as const;

export type DezenaExtraCode = (typeof DEZENA_EXTRA_OPTIONS)[number]["code"];

export const dezenaExtraCodeSchema = z.enum(["2", "3", "4", "5", "6", "7"]);

const selectionSchema = z.object({
  code: z.literal("DEZENA").or(dezenaExtraCodeSchema),
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

export const dezenaBetDetailsSchema = z.object({
  number: z.string().trim().regex(/^\d{2}$/, "Dezena inválida"),
  selections: z.array(selectionSchema).min(1),
  entries: z.array(entrySchema).min(1),
  totalAmount: betAmountSchema,
});

export type DezenaBetDetails = z.infer<typeof dezenaBetDetailsSchema>;
export type DezenaBetEntry = z.infer<typeof entrySchema>;

export function labelForDezenaExtra(code: DezenaExtraCode): string {
  return DEZENA_EXTRA_OPTIONS.find((item) => item.code === code)?.label ?? code;
}

export function normalizeDezenaNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  const n = Number(digits);
  if (!Number.isFinite(n) || n < 10 || n > 99) {
    throw new Error("Dezena deve ser de 10 a 99");
  }
  return String(n);
}

function prizeRangeForExtra(code: DezenaExtraCode): { prizeFrom: number; prizeTo: number } {
  const n = Number(code);
  if (code === "2") {
    return { prizeFrom: 2, prizeTo: 2 };
  }
  return { prizeFrom: 1, prizeTo: n };
}

function expandExtraSelection(
  dezena: string,
  code: DezenaExtraCode,
  amount: number,
): DezenaBetEntry[] {
  const { prizeFrom, prizeTo } = prizeRangeForExtra(code);
  return [
    {
      playStyle: "DEZENA",
      betNumber: dezena,
      amount,
      from: code,
      prizeFrom,
      prizeTo,
    },
  ];
}

export function buildDezenaBetDetails(
  betNumber: string,
  dezenaAmount: number,
  extras: Array<{ code: DezenaExtraCode; amount: number }>,
): DezenaBetDetails {
  const number = normalizeDezenaNumber(betNumber);

  const selections: DezenaBetDetails["selections"] = [
    { code: "DEZENA", label: "DEZENA", amount: dezenaAmount },
    ...extras.map((extra) => ({
      code: extra.code,
      label: labelForDezenaExtra(extra.code),
      amount: extra.amount,
    })),
  ];

  const entries: DezenaBetEntry[] = [
    {
      playStyle: "DEZENA",
      betNumber: number,
      amount: dezenaAmount,
      from: "DEZENA",
      prizeFrom: 1,
      prizeTo: 1,
    },
  ];

  for (const extra of extras) {
    entries.push(...expandExtraSelection(number, extra.code, extra.amount));
  }

  const totalAmount = selections.reduce((sum, line) => sum + line.amount, 0);

  return dezenaBetDetailsSchema.parse({
    number,
    selections,
    entries,
    totalAmount,
  });
}

export { betLinesFromDetails as dezenaBetLinesFromDetails };

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
      const selections = value.selections as DezenaBetDetails["selections"];
      const dezenaSelection = selections.find((item) => item.code === "DEZENA");
      const dezenaAmount = dezenaSelection?.amount ?? 0;
      const extras = selections
        .filter((item) => item.code !== "DEZENA")
        .map((item) => ({
          code: item.code as DezenaExtraCode,
          amount: item.amount,
        }));
      try {
        return buildDezenaBetDetails(String(value.number ?? ""), dezenaAmount, extras);
      } catch {
        return value;
      }
    }
  }
  return value;
}

export function parseDezenaBetDetails(value: unknown): DezenaBetDetails | null {
  if (value && typeof value === "object") {
    const normalized = normalizeLegacyDetails(value as Record<string, unknown>);
    const parsed = dezenaBetDetailsSchema.safeParse(normalized);
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

export function formatDezenaBetSummary(details: DezenaBetDetails | null): string | null {
  if (!details) return null;

  const grouped = details.entries.reduce<Record<string, DezenaBetEntry[]>>((acc, entry) => {
    const bucket = acc[entry.from] ?? [];
    bucket.push(entry);
    acc[entry.from] = bucket;
    return acc;
  }, {});

  const parts: string[] = [];

  const base = grouped.DEZENA?.[0];
  if (base) {
    parts.push(
      `Dezena ${base.betNumber.padStart(2, "0")} ${formatMoney(base.amount)} (${formatPrizeRange(base.prizeFrom, base.prizeTo)})`,
    );
  }

  for (const [from, entries] of Object.entries(grouped)) {
    if (from === "DEZENA") continue;
    for (const entry of entries) {
      parts.push(
        `${from}: DEZENA ${entry.betNumber.padStart(2, "0")} ${formatMoney(entry.amount)} (${formatPrizeRange(entry.prizeFrom, entry.prizeTo)})`,
      );
    }
  }

  return `Dezena ${details.number.padStart(2, "0")} — ${parts.join("; ")}`;
}

export const DEZENA_EXTRA_HINTS: Partial<Record<DezenaExtraCode, string>> = {
  "2": "Mais 1 jogo no 2º prêmio (com o valor marcado). Com a dezena principal: 2 jogos (1º e 2º).",
  "3": "1 jogo do 1º ao 3º prêmio.",
  "4": "1 jogo do 1º ao 4º prêmio.",
  "5": "1 jogo do 1º ao 5º prêmio (como MC 5).",
  "6": "1 jogo do 1º ao 6º prêmio.",
  "7": "1 jogo do 1º ao 7º prêmio.",
};