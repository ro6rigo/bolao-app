"use client";

import { useEffect, useState } from "react";

type Game = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
};

type Winner = {
  id: string;
  homeScore: number;
  awayScore: number;
  prize: number;
  user: { name: string; phone: string | null };
};

type WinnersResponse = {
  winners: Winner[];
  totalPaid: number;
  winnerCount: number;
  prizePerWinner: number;
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminGanhadoresPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState("");
  const [winnersData, setWinnersData] = useState<WinnersResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadGames() {
    const res = await fetch("/api/admin/games");
    const data = await res.json();
    setGames(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    void loadGames();
  }, []);

  async function syncResult() {
    if (!selectedGame) return;
    setMessage(null);
    const res = await fetch(`/api/admin/games/${selectedGame}/sync-result`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error);
      return;
    }
    setMessage(`Placar atualizado: ${data.homeScore} x ${data.awayScore}`);
    await loadWinners();
    const gamesRes = await fetch("/api/admin/games");
    const gamesData = await gamesRes.json();
    setGames(Array.isArray(gamesData) ? gamesData : []);
  }

  async function loadWinners() {
    if (!selectedGame) return;
    const res = await fetch(`/api/admin/winners?gameId=${selectedGame}`);
    const data = (await res.json()) as WinnersResponse;
    setWinnersData(res.ok ? data : null);
  }

  useEffect(() => {
    void loadWinners();
  }, [selectedGame]);

  const winners = winnersData?.winners ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Ganhadores</h2>

      <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
        <select
          value={selectedGame}
          onChange={(e) => setSelectedGame(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="">Selecione o jogo</option>
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.homeTeam} x {g.awayTeam} — {g.status}
              {g.homeScore !== null ? ` (${g.homeScore}x${g.awayScore})` : ""}
            </option>
          ))}
        </select>

        <button onClick={syncResult} className="rounded-lg bg-zinc-900 px-4 py-2 text-white">
          Atualizar placar (football-data.org)
        </button>

        {message && <p className="text-sm text-green-700">{message}</p>}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-medium">Ganhadores</h3>

        {winnersData && winners.length > 0 && (
          <p className="mb-4 text-sm text-zinc-600">
            Total arrecadado: {formatCurrency(winnersData.totalPaid)} — Prêmio por ganhador
            (80%): {formatCurrency(winnersData.prizePerWinner)}
          </p>
        )}

        {winners.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum ganhador para este jogo.</p>
        ) : (
          <ul className="space-y-2">
            {winners.map((w) => (
              <li key={w.id} className="border-b border-zinc-50 pb-2">
                {w.user.name} ({w.user.phone ?? "—"}) — palpite {w.homeScore} x {w.awayScore} —{" "}
                {formatCurrency(w.prize)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
