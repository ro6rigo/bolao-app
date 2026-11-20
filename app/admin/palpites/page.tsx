"use client";

import { useEffect, useState } from "react";
import { formatPredictionTotalAmount } from "@/lib/games/prediction-stake";
import { formatPalpite } from "@/lib/games/play-styles";

type Prediction = {
  id: string;
  homeScore: number | null;
  awayScore: number | null;
  playStyle: string | null;
  betNumber: string | null;
  betDetails: unknown;
  isPaid: boolean;
  isCorrect: boolean | null;
  user: { name: string; email: string };
  game: { matchDate: string };
  payment: { status: string; amount: number } | null;
};

function formatGameSlot(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function AdminPalpitesPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  async function load() {
    const res = await fetch("/api/admin/predictions");
    const data = await res.json();
    setPredictions(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Somatório de palpites</h2>
      <div className="overflow-x-auto rounded-xl bg-white p-6 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-zinc-500">
              <th className="pb-2">E-mail</th>
              <th className="pb-2">Dia e horário</th>
              <th className="pb-2">Palpite</th>
              <th className="pb-2">Valor</th>
              <th className="pb-2">Pago</th>
              <th className="pb-2">Acertou</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((p) => (
              <tr key={p.id} className="border-b border-zinc-50">
                <td className="py-2">{p.user.email}</td>
                <td className="py-2 whitespace-nowrap">
                  {p.game?.matchDate ? formatGameSlot(p.game.matchDate) : "—"}
                </td>
                <td className="py-2">{formatPalpite(p)}</td>
                <td className="py-2">{formatPredictionTotalAmount(p)}</td>
                <td className="py-2">{p.isPaid ? "Sim" : "Não"}</td>
                <td className="py-2">
                  {p.isCorrect === null ? "—" : p.isCorrect ? "Sim" : "Não"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
