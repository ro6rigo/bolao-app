import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DrawPrize } from "@/lib/jogo-do-bicho/types";
import {
  matchesCentenaBet,
  matchesDezenaBet,
  matchesGrupoBet,
  matchesMilharBet,
} from "@/lib/jogo-do-bicho/draw-match";
import { isPredictionCorrectOnPrizes } from "@/lib/jogo-do-bicho/check-prediction";

const primeiro: DrawPrize = {
  position: 1,
  milhar: "1234",
  grupo: "10",
  raw: "1234-10",
};

describe("conferência contra o 1º resultado 1234-10", () => {
  it("milhar 1234 acerta", () => {
    assert.equal(matchesMilharBet("1234", primeiro), true);
    assert.equal(
      isPredictionCorrectOnPrizes("MILHAR", "1234", [primeiro]),
      true,
    );
  });

  it("centena 234 acerta", () => {
    assert.equal(matchesCentenaBet("234", primeiro), true);
    assert.equal(
      isPredictionCorrectOnPrizes("CENTENA", "234", [primeiro]),
      true,
    );
  });

  it("dezena 34 acerta", () => {
    assert.equal(matchesDezenaBet("34", primeiro), true);
    assert.equal(
      isPredictionCorrectOnPrizes("DEZENA", "34", [primeiro]),
      true,
    );
  });

  it("grupo 10 acerta pelo grupo sorteado", () => {
    assert.equal(matchesGrupoBet("10", primeiro), true);
    assert.equal(matchesGrupoBet("234", primeiro), false);
    assert.equal(
      isPredictionCorrectOnPrizes("GRUPO", "10", [primeiro]),
      true,
    );
  });
});