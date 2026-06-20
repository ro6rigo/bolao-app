"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { PaymentStatusPoller } from "@/app/pagamento/components/PaymentStatusPoller";
import { PixQrDisplay } from "@/app/pagamento/components/PixQrDisplay";
import { MatchScoreboard } from "@/components/MatchScoreboard";

type Game = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  betAmount: number;
  homeTeamCrest?: string | null;
  awayTeamCrest?: string | null;
  competition?: string | null;
};

type Step = "form" | "payment" | "done";

const scoreInputClass =
  "w-14 rounded-lg border-2 border-amber-400/80 bg-white px-1 py-2 text-center text-2xl font-bold tabular-nums text-red-600 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-400/40 sm:w-16 sm:text-3xl [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export default function PalpitarPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [qr, setQr] = useState<{ qrCode: string; qrCodeBase64: string; amount: number } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedScore, setSelectedScore] = useState<{
    homeScore: number;
    awayScore: number;
  } | null>(null);

  const [loadingGame, setLoadingGame] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/games/active");
        const text = await r.text();
        if (!text) {
          setError("Resposta inválida ao carregar o jogo.");
          return;
        }
        const data = JSON.parse(text) as Game | { error?: string } | null;
        if (!r.ok) {
          setError("error" in (data ?? {}) ? String((data as { error: string }).error) : "Erro ao carregar jogo.");
          return;
        }
        if (data && "id" in data) {
          setGame({ ...data, betAmount: data.betAmount ?? 1 });
        }
      } catch {
        setError("Erro ao carregar jogo. Verifique se o servidor está rodando.");
      } finally {
        setLoadingGame(false);
      }
    })();
  }, []);

  async function submitPrediction() {
    if (!game || !formRef.current) return;
    setError(null);
    setSubmitting(true);

    const fd = new FormData(formRef.current);
    const homeScore = Number(fd.get("homeScore"));
    const awayScore = Number(fd.get("awayScore"));
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game.id,
          homeScore,
          awayScore,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setPaymentId(data.paymentId);
      setSelectedScore({ homeScore, awayScore });
      setQr({ qrCode: data.qrCode, qrCodeBase64: data.qrCodeBase64, amount: data.amount });
      setStep("payment");
    } finally {
      setSubmitting(false);
    }
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (formRef.current?.reportValidity()) {
      setShowConfirmModal(true);
    }
  }

  const handleApproved = useCallback(() => setStep("done"), []);

  if (loadingGame) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-zinc-600">Carregando jogo...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-zinc-600">
          {error ?? "Nenhum jogo aberto para palpite no momento."}
        </p>
      </div>
    );
  }

  const scoreboardProps = {
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homeTeamCrest: game.homeTeamCrest,
    awayTeamCrest: game.awayTeamCrest,
    competition: game.competition,
    matchDate: game.matchDate,
  };

  if (step === "done") {
    return (
      <div className="space-y-6">
        <MatchScoreboard
          {...scoreboardProps}
          homeScore={selectedScore?.homeScore}
          awayScore={selectedScore?.awayScore}
        />
        <div className="rounded-xl bg-white p-8 text-center shadow-sm space-y-4">
          <p className="text-lg font-medium text-green-700">Palpite confirmado!</p>
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setPaymentId(null);
              setQr(null);
              setSelectedScore(null);
              setError(null);
            }}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Fazer outro palpite
          </button>
        </div>
      </div>
    );
  }

  if (step === "payment" && qr && paymentId) {
    return (
      <div className="flex flex-col gap-6">
        <MatchScoreboard
          {...scoreboardProps}
          homeScore={selectedScore?.homeScore}
          awayScore={selectedScore?.awayScore}
        />
        <div className="flex flex-col items-center gap-6 rounded-xl bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold">Pague via Pix para confirmar</h2>
          <PixQrDisplay {...qr} />
          <PaymentStatusPoller paymentId={paymentId} onStatusChange={(s) => s === "approved" && handleApproved()} />
        </div>
      </div>
    );
  }

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleFormSubmit}
        className="space-y-6"
      >
        <MatchScoreboard
          {...scoreboardProps}
          scoreInputs={
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                name="homeScore"
                type="number"
                min="0"
                required
                placeholder="0"
                aria-label={`Gols ${game.homeTeam}`}
                className={`${scoreInputClass} placeholder:text-red-300`}
              />
              <span className="text-2xl font-light text-white/50 sm:text-3xl">-</span>
              <input
                name="awayScore"
                type="number"
                min="0"
                required
                placeholder="0"
                aria-label={`Gols ${game.awayTeam}`}
                className={`${scoreInputClass} placeholder:text-red-300`}
              />
            </div>
          }
        />

        <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900">Detalhes do palpite</h2>
          <p className="rounded-lg bg-zinc-100 px-4 py-3 text-sm text-zinc-800">
            Valor da aposta:{" "}
            <strong>
              {game.betAmount.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </strong>
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full rounded-lg bg-zinc-900 py-3 font-medium text-white" disabled>
            Confirmar palpite e gerar Pix
          </button>
        </div>
      </form>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-palpite-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg"
          >
            <h3 id="confirm-palpite-title" className="text-lg font-semibold text-zinc-900">
              Confirmar palpite
            </h3>
            <div className="mt-4 space-y-3 text-sm text-zinc-700">
              <p>
                A aposta deve ser realizada por uma pessoa <strong>maior de 18 anos</strong>.
              </p>
              <p>
                Ao acertar o placar, o valor recebido será de <strong>80% do montante</strong>{" "}
                apostado (
                {game.betAmount.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
                ).
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  void submitPrediction();
                }}
                disabled={submitting}
                className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? "Gerando Pix..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
