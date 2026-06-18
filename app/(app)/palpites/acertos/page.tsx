"use client";

import { useEffect, useState } from "react";

type Prediction = {
  id: string;
  homeScore: number;
  awayScore: number;
  game: { homeTeam: string; awayTeam: string; homeScore: number | null; awayScore: number | null };
};

export default function AcertosPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    void fetch("/api/predictions/acertos").then((r) => r.json()).then(setPredictions);
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Palpites com acerto</h2>
      <ul className="space-y-3">
        {predictions.map((p) => (
          <li key={p.id} className="rounded-xl bg-white p-4 shadow-sm border-l-4 border-green-500">
            <p className="font-medium">{p.game.homeTeam} x {p.game.awayTeam}</p>
            <p className="text-sm text-zinc-600">
              Seu palpite: {p.homeScore} x {p.awayScore}
            </p>
            {p.game.homeScore !== null && (
              <p className="text-sm text-green-700">
                Placar real: {p.game.homeScore} x {p.game.awayScore}
              </p>
            )}
          </li>
        ))}
        {predictions.length === 0 && (
          <p className="text-zinc-500">Nenhum acerto ainda.</p>
        )}
      </ul>
    </div>
  );
}
