"use client";

import { FormEvent, useEffect, useState } from "react";
import { BET_AMOUNT_MAX, BET_AMOUNT_MIN } from "@/lib/validations/bet";

type MatchOption = {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  status: string;
  competition: string | null;
};

type Game = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  status: string;
  isActive: boolean;
  betAmount: number;
};

export default function AdminJogosPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [matches, setMatches] = useState<MatchOption[]>([]);
  const [selectedMatch, setSelectedMatch] = useState("");
  const [betAmount, setBetAmount] = useState("1");
  const [season, setSeason] = useState(String(new Date().getFullYear()));
  const [error, setError] = useState<string | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);

  async function loadGames() {
    try {
      const res = await fetch("/api/admin/games");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Erro ao carregar jogos");
      }
      setGames(Array.isArray(data) ? data : []);
    } catch (err) {
      setGames([]);
      setError(err instanceof Error ? err.message : "Erro ao carregar jogos");
    }
  }

  async function loadMatches(selectedSeason = season) {
    setLoadingMatches(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/fixtures?season=${selectedSeason}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar partidas");
    } finally {
      setLoadingMatches(false);
    }
  }

  useEffect(() => {
    void loadGames();
    void loadMatches();
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        externalMatchId: Number(selectedMatch),
        betAmount: Number(betAmount),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    await loadGames();
  }

  async function activateGame(id: string) {
    await fetch(`/api/admin/games/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true, status: "OPEN" }),
    });
    await loadGames();
  }

  async function deleteGame(id: string) {
    await fetch(`/api/admin/games/${id}`, { method: "DELETE" });
    await loadGames();
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-zinc-900">Jogos</h2>

      <form onSubmit={handleCreate} className="rounded-xl bg-white p-6 shadow-sm space-y-4 text-zinc-900">
        <h3 className="font-medium text-zinc-900">Cadastrar jogo (Brasil — football-data.org)</h3>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-zinc-800">
            Temporada
            <input
              type="number"
              min="2000"
              max="2100"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-28 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
            />
          </label>
          <button
            type="button"
            onClick={() => loadMatches(season)}
            disabled={loadingMatches}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 disabled:opacity-60"
          >
            {loadingMatches ? "Carregando..." : "Buscar partidas"}
          </button>
        </div>

        <select
          required
          value={selectedMatch}
          onChange={(e) => setSelectedMatch(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
        >
          <option value="">Selecione a partida</option>
          {matches.map((match) => (
            <option key={match.matchId} value={match.matchId}>
              {match.homeTeam} x {match.awayTeam} —{" "}
              {new Date(match.date).toLocaleDateString("pt-BR")} ({match.status}
              {match.competition ? ` · ${match.competition}` : ""})
            </option>
          ))}
        </select>

        <label className="flex flex-col gap-1 text-sm text-zinc-800">
          Valor da aposta (R$)
          <input
            type="number"
            step="0.01"
            min={BET_AMOUNT_MIN}
            max={BET_AMOUNT_MAX}
            required
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
          />
          <span className="text-xs text-zinc-500">
            Entre R$ {BET_AMOUNT_MIN.toFixed(2).replace(".", ",")} e R${" "}
            {BET_AMOUNT_MAX.toFixed(2).replace(".", ",")}.
          </span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-white">
          Cadastrar
        </button>
      </form>

      <div className="rounded-xl bg-white p-6 shadow-sm text-zinc-900">
        <h3 className="mb-4 font-medium text-zinc-900">Jogos cadastrados (máx. 1 ativo)</h3>
        <ul className="space-y-3">
          {games.map((game) => (
            <li key={game.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div>
                <p className="font-medium text-zinc-900">{game.homeTeam} x {game.awayTeam}</p>
                <p className="text-sm text-zinc-600">
                  {game.isActive ? "ATIVO" : "inativo"} — {game.status} — Aposta:{" "}
                  {game.betAmount.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                {!game.isActive && (
                  <button onClick={() => activateGame(game.id)} className="text-sm text-green-700 underline">
                    Ativar
                  </button>
                )}
                <button onClick={() => deleteGame(game.id)} className="text-sm text-red-600 underline">
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
