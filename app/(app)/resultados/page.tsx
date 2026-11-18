"use client";

import { useEffect, useState } from "react";

type GameResult = {
  id: string;
  drawCode: string | null;
  drawResult: string | null;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string;
  paidPredictions: number;
  winners: number;
};

function formatGameTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function ResultadosPage() {
  const [results, setResults] = useState<GameResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/results").then(async (r) => {
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? "Erro ao carregar resultados");
        return;
      }
      setResults(Array.isArray(data) ? data : []);
    });
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Resultados</h2>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-x-auto rounded-xl bg-white p-6 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-zinc-500">
              <th className="pb-2">Jogo</th>
              <th className="pb-2">Palpites pagos</th>
              <th className="pb-2">Ganhadores</th>
            </tr>
          </thead>
          <tbody>
            {results.map((game) => (
              <tr key={game.id} className="border-b border-zinc-50">
                <td className="py-3">
                  <p className="font-medium text-zinc-900">{formatGameTime(game.matchDate)}</p>
                  {game.drawResult ? (
                    <p className="text-xs text-zinc-600">{game.drawResult}</p>
                  ) : game.homeScore !== null && game.awayScore !== null ? (
                    <p className="text-xs text-zinc-600">
                      Placar: {game.homeScore} x {game.awayScore}
                    </p>
                  ) : null}
                </td>
                <td className="py-3">{game.paidPredictions}</td>
                <td className="py-3">{game.winners}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {results.length === 0 && !error && (
          <p className="py-4 text-center text-sm text-zinc-500">
            Nenhum jogo finalizado com resultado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
