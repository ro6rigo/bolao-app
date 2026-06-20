"use client";

import { useEffect, useState } from "react";

type Prediction = {
  id: string;
  homeScore: number;
  awayScore: number;
  isPaid: boolean;
  isCorrect: boolean | null;
  game: {
    homeTeam: string;
    awayTeam: string;
    matchDate: string;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
  };
  payment: { status: string; amount: number } | null;
};

function resultLabel(prediction: Prediction): { text: string; className: string; borderClass: string } {
  if (!prediction.isPaid) {
    return {
      text: "Aguardando pagamento",
      className: "text-amber-700",
      borderClass: "border-l-4 border-amber-400",
    };
  }

  if (prediction.isCorrect === true) {
    return {
      text: "Acertou",
      className: "text-green-700",
      borderClass: "border-l-4 border-green-500",
    };
  }

  if (prediction.isCorrect === false) {
    return {
      text: "Errou",
      className: "text-red-700",
      borderClass: "border-l-4 border-red-400",
    };
  }

  return {
    text: "Resultado pendente",
    className: "text-zinc-600",
    borderClass: "border-l-4 border-zinc-300",
  };
}

export default function PalpitesPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    void fetch("/api/predictions").then((r) => r.json()).then(setPredictions);
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Meus palpites</h2>
      <ul className="space-y-3">
        {predictions.map((p) => {
          const result = resultLabel(p);
          return (
            <li
              key={p.id}
              className={`rounded-xl bg-white p-4 shadow-sm ${result.borderClass}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium">{p.game.homeTeam} x {p.game.awayTeam}</p>
                <span className={`text-sm font-medium ${result.className}`}>{result.text}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">
                Seu palpite: {p.homeScore} x {p.awayScore}
              </p>
              {p.game.homeScore !== null && p.game.awayScore !== null && (
                <p className="text-sm text-zinc-600">
                  Placar real: {p.game.homeScore} x {p.game.awayScore}
                </p>
              )}
              {p.payment?.amount != null && (
                <p className="text-sm text-zinc-600">
                  Valor:{" "}
                  {p.payment.amount.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              )}
              <p className="text-sm text-zinc-500">
                Pago: {p.isPaid ? "Sim" : "Não"} — Pagamento: {p.payment?.status ?? "—"}
              </p>
            </li>
          );
        })}
        {predictions.length === 0 && (
          <p className="text-zinc-500">Nenhum palpite ainda.</p>
        )}
      </ul>
    </div>
  );
}
