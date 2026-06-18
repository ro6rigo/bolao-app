import { z } from "zod";

export const cpfSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .pipe(z.string().length(11, "CPF deve ter 11 dígitos"));

export const optionalCpfSchema = z
  .string()
  .optional()
  .nullable()
  .transform((value) => value?.replace(/\D/g, "") ?? "")
  .pipe(
    z.union([
      z.literal(""),
      z.string().length(11, "CPF deve ter 11 dígitos"),
    ]),
  );
