import { z } from "zod";

export const BET_AMOUNT_MIN = 0.01;
export const BET_AMOUNT_MAX = 10;

export const betAmountSchema = z
  .number()
  .min(BET_AMOUNT_MIN, `Valor mínimo da aposta: R$ ${BET_AMOUNT_MIN.toFixed(2).replace(".", ",")}`)
  .max(BET_AMOUNT_MAX, `Valor máximo da aposta: R$ ${BET_AMOUNT_MAX.toFixed(2).replace(".", ",")}`);
