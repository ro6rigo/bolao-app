import { z } from "zod";
import { betLinesFromDetails } from "@/lib/games/bet-lines";
import { betAmountSchema } from "@/lib/validations/bet";

export const MILHAR_EXTRA_OPTIONS = [
  { code: "MC", label: "MC" },
  { code: "MC_5", label: "MC 5" },
  { code: "C", label: "C" },
  { code: "C_5", label: "C 5" },
  { code: "MC_INV", label: "MC INV" },
  { code: "MC_INV_5", label: "MC INV 5" },
  { code: "12", label: "Pelos 12" },
] as const;

export type MilharExtraCode = (typeof MILHAR_EXTRA_OPTIONS)[number]["code"];

export const milharExtraCodeSchema = z.enum([
  "MC",
  "MC_5",
  "C",
  "C_5",
  "MC_INV",
  "MC_INV_5",
  "12",
]);

const selectionSchema = z.object({
  code: z.literal("MILHAR").or(milharExtraCodeSchema),
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

export const milharBetDetailsSchema = z.object({
  number: z
    .string()
    .trim()
    .regex(/^\d+$/, "Digite apenas números")
    .max(20),
  selections: z.array(selectionSchema).min(1),
  entries: z.array(entrySchema).min(1),
  totalAmount: betAmountSchema,
});

export type MilharBetDetails = z.infer<typeof milharBetDetailsSchema>;
export type MilharBetEntry = z.infer<typeof entrySchema>;

export function labelForMilharExtra(code: MilharExtraCode): string {
  return MILHAR_EXTRA_OPTIONS.find((item) => item.code === code)?.label ?? code;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeMilharNumber(value: string): string {
  return digitsOnly(value).padStart(4, "0").slice(-4);
}

export function milharToCentena(value: string): string {
  return normalizeMilharNumber(value).slice(-3);
}

/** Milhar com dígitos invertidos (1234 → 4321). */
export function milharReversed(value: string): string {
  return normalizeMilharNumber(value).split("").reverse().join("");
}

/** Centena “invertida” no MC INV: 3 primeiros dígitos do milhar ao contrário (1234 → 321). */
export function centenaReversedInv(value: string): string {
  return normalizeMilharNumber(value).slice(0, 3).split("").reverse().join("");
}

export function splitAmountInHalf(amount: number): [number, number] {
  const first = Math.round((amount / 2) * 100) / 100;
  const second = Math.round((amount - first) * 100) / 100;
  return [first, second];
}

function prizeRangeForCode(code: MilharExtraCode | "MILHAR"): { prizeFrom: number; prizeTo: number } {
  switch (code) {
    case "MC_5":
    case "C_5":
    case "MC_INV_5":
      return { prizeFrom: 1, prizeTo: 5 };
    case "12":
      return { prizeFrom: 1, prizeTo: 7 };
    default:
      return { prizeFrom: 1, prizeTo: 1 };
  }
}

function expandMcPair(
  number: string,
  amount: number,
  from: MilharExtraCode,
  mode: "direct" | "inv",
): MilharBetEntry[] {
  const milharBet = mode === "inv" ? milharReversed(number) : normalizeMilharNumber(number);
  const centenaBet = mode === "inv" ? centenaReversedInv(number) : milharToCentena(number);
  const [milharAmount, centenaAmount] = splitAmountInHalf(amount);
  const { prizeFrom, prizeTo } = prizeRangeForCode(from);

  return [
    {
      playStyle: "MILHAR",
      betNumber: milharBet,
      amount: milharAmount,
      from,
      prizeFrom,
      prizeTo,
    },
    {
      playStyle: "CENTENA",
      betNumber: centenaBet,
      amount: centenaAmount,
      from,
      prizeFrom,
      prizeTo,
    },
  ];
}

function expandExtraSelection(
  number: string,
  code: MilharExtraCode,
  amount: number,
): MilharBetEntry[] {
  const milhar = normalizeMilharNumber(number);
  const centena = milharToCentena(number);
  const { prizeFrom, prizeTo } = prizeRangeForCode(code);

  switch (code) {
    case "MC":
    case "MC_5":
      return expandMcPair(number, amount, code, "direct");
    case "MC_INV":
    case "MC_INV_5":
      return expandMcPair(number, amount, code, "inv");
    case "C":
    case "C_5":
      return [
        {
          playStyle: "CENTENA",
          betNumber: centena,
          amount,
          from: code,
          prizeFrom,
          prizeTo,
        },
      ];
    case "12": {
      const [firstPrizeAmount, prizes1To7Amount] = splitAmountInHalf(amount);
      return [
        {
          playStyle: "MILHAR",
          betNumber: milhar,
          amount: firstPrizeAmount,
          from: code,
          prizeFrom: 1,
          prizeTo: 1,
        },
        {
          playStyle: "MILHAR",
          betNumber: milhar,
          amount: prizes1To7Amount,
          from: code,
          prizeFrom: 1,
          prizeTo: 7,
        },
      ];
    }
    default:
      return [];
  }
}

export function buildMilharBetDetails(
  betNumber: string,
  milharAmount: number,
  extras: Array<{ code: MilharExtraCode; amount: number }>,
): MilharBetDetails {
  const number = digitsOnly(betNumber);
  const milhar = normalizeMilharNumber(number);
  const basePrizes = prizeRangeForCode("MILHAR");

  const selections: MilharBetDetails["selections"] = [
    { code: "MILHAR", label: "MILHAR", amount: milharAmount },
    ...extras.map((extra) => ({
      code: extra.code,
      label: labelForMilharExtra(extra.code),
      amount: extra.amount,
    })),
  ];

  const entries: MilharBetEntry[] = [
    {
      playStyle: "MILHAR",
      betNumber: milhar,
      amount: milharAmount,
      from: "MILHAR",
      prizeFrom: basePrizes.prizeFrom,
      prizeTo: basePrizes.prizeTo,
    },
  ];

  for (const extra of extras) {
    entries.push(...expandExtraSelection(number, extra.code, extra.amount));
  }

  const totalAmount = selections.reduce((sum, line) => sum + line.amount, 0);

  return milharBetDetailsSchema.parse({
    number,
    selections,
    entries,
    totalAmount,
  });
}

export { betLinesFromDetails as milharBetLinesFromDetails };

function normalizeLegacyDetails(value: Record<string, unknown>): unknown {
  if (Array.isArray(value.lines) && !Array.isArray(value.selections)) {
    return { ...value, selections: value.lines };
  }
  const entriesNeedRebuild =
    Array.isArray(value.entries) &&
    (value.entries as unknown[]).some(
      (item) =>
        typeof item === "object" &&
        item != null &&
        !("prizeFrom" in item) &&
        !("prizeTo" in item),
    );
  if (Array.isArray(value.selections) && (!Array.isArray(value.entries) || entriesNeedRebuild)) {
    const selections = value.selections as MilharBetDetails["selections"];
    const number = String(value.number ?? "");
    const milharSelection = selections.find((item) => item.code === "MILHAR");
    const milharAmount = milharSelection?.amount ?? 0;
    const extras = selections
      .filter((item) => item.code !== "MILHAR")
      .map((item) => ({
        code: item.code as MilharExtraCode,
        amount: item.amount,
      }));
    try {
      return buildMilharBetDetails(number, milharAmount, extras);
    } catch {
      return value;
    }
  }
  return value;
}

export function parseMilharBetDetails(value: unknown): MilharBetDetails | null {
  if (value && typeof value === "object") {
    const normalized = normalizeLegacyDetails(value as Record<string, unknown>);
    const parsed = milharBetDetailsSchema.safeParse(normalized);
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

export function formatMilharBetSummary(details: MilharBetDetails | null): string | null {
  if (!details) return null;

  const grouped = details.entries.reduce<Record<string, MilharBetEntry[]>>((acc, entry) => {
    const bucket = acc[entry.from] ?? [];
    bucket.push(entry);
    acc[entry.from] = bucket;
    return acc;
  }, {});

  const parts: string[] = [];

  const base = grouped.MILHAR?.[0];
  if (base) {
    parts.push(
      `Milhar ${base.betNumber} ${formatMoney(base.amount)} (${formatPrizeRange(base.prizeFrom, base.prizeTo)})`,
    );
  }

  for (const [from, entries] of Object.entries(grouped)) {
    if (from === "MILHAR") continue;
    const games = entries
      .map(
        (entry) =>
          `${entry.playStyle} ${entry.betNumber} ${formatMoney(entry.amount)} (${formatPrizeRange(entry.prizeFrom, entry.prizeTo)})`,
      )
      .join(" + ");
    parts.push(`${from}: ${games}`);
  }

  return `Nº ${normalizeMilharNumber(details.number)} — ${parts.join("; ")}`;
}

export const MILHAR_EXTRA_HINTS: Partial<Record<MilharExtraCode, string>> = {
  MC: "2 jogos: milhar do número e centena (3 últimos dígitos), metade do valor em cada (1º prêmio).",
  MC_5: "2 jogos como o MC; cada um vale do 1º ao 5º prêmio.",
  MC_INV: "2 jogos: milhar invertido (ex. 4321) e centena invertida (ex. 321), metade do valor em cada (1º).",
  MC_INV_5: "Como MC INV, do 1º ao 5º prêmio.",
  C: "1 jogo na centena (3 últimos dígitos), 1º prêmio.",
  C_5: "Centena do 1º ao 5º prêmio.",
  "12": "2 jogos no milhar: metade no 1º prêmio e metade do 1º ao 7º.",
};