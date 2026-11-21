import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DrawPrize } from "@/lib/jogo-do-bicho/types";
import {
  matchesCentenaBet,
  matchesCentenaInvertidaFromMilharBet,
  matchesDezenaBet,
  matchesDezenaInvertidaBet,
  matchesGrupoBet,
  matchesMilharBet,
  matchesMilharECentenaInvBet,
  matchesMilharInvertidaBet,
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

describe("dezena invertida", () => {
  const primeiro1292: DrawPrize = {
    position: 1,
    milhar: "1292",
    grupo: "12",
    raw: "1292-12",
  };
  const quinto5629: DrawPrize = {
    position: 5,
    milhar: "5629",
    grupo: "8",
    raw: "5629-8",
  };

  it("palpite 29 acerta 1292-12 (dezena 92)", () => {
    assert.equal(matchesDezenaInvertidaBet("29", primeiro1292), true);
    assert.equal(
      isPredictionCorrectOnPrizes("DEZENA INVERTIDA", "29", [primeiro1292]),
      true,
    );
  });

  it("palpite 29 não acerta 5629-8 (dezena 29, precisa 92)", () => {
    assert.equal(matchesDezenaInvertidaBet("29", quinto5629), false);
    assert.equal(
      isPredictionCorrectOnPrizes("DEZENA INVERTIDA", "29", [quinto5629]),
      false,
    );
  });
});

describe("milhar invertida e milhar e centena inv", () => {
  const milhar4321: DrawPrize = {
    position: 1,
    milhar: "4321",
    grupo: "6",
    raw: "4321-06",
  };
  const milhar2143: DrawPrize = {
    position: 1,
    milhar: "2143",
    grupo: "11",
    raw: "2143-11",
  };
  const centena321: DrawPrize = {
    position: 1,
    milhar: "5321",
    grupo: "6",
    raw: "5321-06",
  };

  it("milhar invertida 1234 acerta 4321 (não anagrama 2143)", () => {
    assert.equal(matchesMilharInvertidaBet("1234", milhar4321), true);
    assert.equal(matchesMilharInvertidaBet("1234", milhar2143), false);
    assert.equal(
      isPredictionCorrectOnPrizes("MILHAR INVERTIDA", "1234", [milhar4321]),
      true,
    );
  });

  it("milhar e centena inv 1234 acerta centena 321 em 5321", () => {
    assert.equal(matchesCentenaInvertidaFromMilharBet("1234", centena321), true);
    assert.equal(matchesMilharECentenaInvBet("1234", centena321), true);
    assert.equal(
      isPredictionCorrectOnPrizes("MILHAR E CENTENA INV", "1234", [centena321]),
      true,
    );
  });
});