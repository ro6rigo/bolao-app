"use client";

import { useEffect, useState } from "react";

type Prediction = {
  id: string;
  homeScore: number;
  awayScore: number;
  isPaid: boolean;
  isCorrect: boolean | null;
  game: { homeTeam: string; awayTeam: string; matchDate: string };
  payment: { status: string; amount: number } | null;
};

export default function PalpitesPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    void fetch("/api/predictions").then((r) => r.json()).then(setPredictions);
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Meus palpites</h2>
      <ul className="space-y-3">
        {predictions.map((p) => (
          <li key={p.id} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="font-medium">{p.game.homeTeam} x {p.game.awayTeam}</p>
            <p className="text-sm text-zinc-600">Palpite: {p.homeScore} x {p.awayScore}</p>
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
        ))}
        {predictions.length === 0 && (
          <p className="text-zinc-500">Nenhum palpite ainda.</p>
        )}
      </ul>
    </div>
  );
}
