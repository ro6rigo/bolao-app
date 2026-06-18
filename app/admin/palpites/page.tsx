"use client";

import { useEffect, useState } from "react";

type Prediction = {
  id: string;
  homeScore: number;
  awayScore: number;
  isPaid: boolean;
  isCorrect: boolean | null;
  user: { name: string; email: string };
  game: { homeTeam: string; awayTeam: string; matchDate: string };
  payment: { status: string; amount: number } | null;
};

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
              <th className="pb-2">Jogo</th>
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
                <td className="py-2">{p.game.homeTeam} x {p.game.awayTeam}</td>
                <td className="py-2">{p.homeScore} x {p.awayScore}</td>
                <td className="py-2">
                  {p.payment?.amount != null
                    ? p.payment.amount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                    : "—"}
                </td>
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
