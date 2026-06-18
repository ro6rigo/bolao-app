import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .min(10, "Telefone inválido");
