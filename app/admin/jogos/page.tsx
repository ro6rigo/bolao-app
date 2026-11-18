"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  formatSlotInSaoPaulo,
  getSlotsForDate,
  todayInSaoPaulo,
  weekdayLabel,
} from "@/lib/games/schedule";

type Game = {
  id: string;
  matchDate: string;
  status: string;
  isActive: boolean;
};

type GameDay = {
  date: string;
  weekday: string;
  slots: string[];
  games: Game[];
  isActive: boolean;
};

function formatTimeLabel(time: string): string {
  return time.slice(0, 5);
}

export default function AdminJogosPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [date, setDate] = useState(todayInSaoPaulo);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const previewSlots = useMemo(() => getSlotsForDate(date), [date]);

  const registeredDates = useMemo(() => {
    const dates = new Set<string>();
    for (const game of games) {
      dates.add(formatSlotInSaoPaulo(new Date(game.matchDate)).date);
    }
    return dates;
  }, [games]);

  const dayGroups = useMemo((): GameDay[] => {
    const byDate = new Map<string, Game[]>();
    for (const game of games) {
      const key = formatSlotInSaoPaulo(new Date(game.matchDate)).date;
      const list = byDate.get(key) ?? [];
      list.push(game);
      byDate.set(key, list);
    }

    return [...byDate.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dayDate, dayGames]) => {
        const slots = dayGames
          .map((game) => formatSlotInSaoPaulo(new Date(game.matchDate)).time)
          .sort();
        return {
          date: dayDate,
          weekday: weekdayLabel(dayDate),
          slots,
          games: dayGames.sort(
            (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime(),
          ),
          isActive: dayGames.some((game) => game.isActive),
        };
      });
  }, [games]);

  const activeDay = dayGroups.find((day) => day.isActive)?.date ?? null;

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

  useEffect(() => {
    void loadGames();
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao cadastrar dia");
        return;
      }
      await loadGames();
    } finally {
      setSubmitting(false);
    }
  }

  async function activateDay(dayDate: string) {
    setError(null);
    const res = await fetch("/api/admin/game-days", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dayDate }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erro ao ativar dia");
      return;
    }
    await loadGames();
  }

  async function deleteDay(dayDate: string) {
    setError(null);
    const res = await fetch("/api/admin/game-days", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dayDate }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erro ao excluir dia");
      return;
    }
    await loadGames();
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-zinc-900">Jogos</h2>

      <form onSubmit={handleCreate} className="space-y-4 rounded-xl bg-white p-6 text-zinc-900 shadow-sm">
        <h3 className="font-medium text-zinc-900">Cadastrar dia</h3>

        <label className="flex flex-col gap-1 text-sm text-zinc-800">
          Dia
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
          />
        </label>

        <p className="text-sm text-zinc-600">
          {weekdayLabel(date)} — horários:{" "}
          {previewSlots.length > 0
            ? previewSlots.map(formatTimeLabel).join(", ")
            : "nenhum"}
        </p>

        {registeredDates.has(date) && (
          <p className="text-sm text-amber-800">Este dia já está cadastrado.</p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || previewSlots.length === 0 || registeredDates.has(date)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {submitting ? "Cadastrando..." : "Cadastrar dia"}
        </button>
      </form>

      <div className="rounded-xl bg-white p-6 text-zinc-900 shadow-sm">
        <h3 className="mb-1 font-medium text-zinc-900">Dias cadastrados</h3>
        <p className="mb-4 text-sm text-zinc-500">
          Apenas 1 dia pode ficar ativo. Dia ativo: {activeDay ?? "nenhum"}
        </p>
        <ul className="space-y-4">
          {dayGroups.map((day) => (
            <li
              key={day.date}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4"
            >
              <div>
                <p className="font-medium text-zinc-900">
                  {new Date(`${day.date}T12:00:00-03:00`).toLocaleDateString("pt-BR")} —{" "}
                  {day.weekday}
                  {day.isActive ? " — ATIVO" : ""}
                </p>
                <p className="text-sm text-zinc-600">
                  Horários: {day.slots.map(formatTimeLabel).join(", ")}
                </p>
                <p className="text-xs text-zinc-500">{day.games.length} jogos</p>
              </div>
              <div className="flex gap-2">
                {!day.isActive && (
                  <button
                    onClick={() => activateDay(day.date)}
                    className="text-sm text-green-700 underline"
                  >
                    Ativar dia
                  </button>
                )}
                <button
                  onClick={() => deleteDay(day.date)}
                  className="text-sm text-red-600 underline"
                >
                  Excluir dia
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}