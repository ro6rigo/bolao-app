"use client";

import { useEffect, useState } from "react";
import { formatPalpite } from "@/lib/games/play-styles";
import { formatDrawSummary } from "@/lib/jogo-do-bicho/check-prediction";
import { EXTRACTION_LABELS, type ExtractionCode } from "@/lib/jogo-do-bicho/extractions";

type Game = {
  id: string;
  matchDate: string;
  status: string;
};

type Winner = {
  id: string;
  homeScore: number | null;
  awayScore: number | null;
  playStyle: string | null;
  betNumber: string | null;
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

function formatGameTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
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
    if (typeof data.drawCode === "string" && Array.isArray(data.prizes)) {
      const label = EXTRACTION_LABELS[data.drawCode as ExtractionCode] ?? data.drawCode;
      setMessage(`Resultado ${label}: ${formatDrawSummary(data.prizes)}`);
    } else if (data.homeScore != null && data.awayScore != null) {
      setMessage(`Placar atualizado: ${data.homeScore} x ${data.awayScore}`);
    } else {
      setMessage("Resultado atualizado.");
    }
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
              {formatGameTime(g.matchDate)} — {g.status}
            </option>
          ))}
        </select>

        <button onClick={syncResult} className="rounded-lg bg-zinc-900 px-4 py-2 text-white">
          Atualizar resultado (Deu no Poste)
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
                {w.user.name} ({w.user.phone ?? "—"}) — palpite {formatPalpite(w)} —{" "}
                {formatCurrency(w.prize)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
