"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { PaymentStatusPoller } from "@/app/pagamento/components/PaymentStatusPoller";
import { PixQrDisplay } from "@/app/pagamento/components/PixQrDisplay";

type Game = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
};

type Step = "form" | "payment" | "done";

export default function PalpitarPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [qr, setQr] = useState<{ qrCode: string; qrCodeBase64: string; amount: number } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetch("/api/games/active").then(async (r) => {
      const data = await r.json();
      if (data?.id) setGame(data);
    });
  }, []);

  async function submitPrediction() {
    if (!game || !formRef.current) return;
    setError(null);
    setSubmitting(true);

    const fd = new FormData(formRef.current);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game.id,
          homeScore: Number(fd.get("homeScore")),
          awayScore: Number(fd.get("awayScore")),
          amount: Number(fd.get("amount")),
          cpf: fd.get("cpf"),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setPaymentId(data.paymentId);
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

  if (!game) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-zinc-600">Nenhum jogo aberto para palpite no momento.</p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm space-y-4">
        <p className="text-lg font-medium text-green-700">Palpite confirmado!</p>
        <p className="text-sm text-zinc-600">
          {game.homeTeam} x {game.awayTeam}
        </p>
        <button
          type="button"
          onClick={() => {
            setStep("form");
            setPaymentId(null);
            setQr(null);
            setError(null);
          }}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Fazer outro palpite
        </button>
      </div>
    );
  }

  if (step === "payment" && qr && paymentId) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-xl bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold">Pague via Pix para confirmar</h2>
        <PixQrDisplay {...qr} />
        <PaymentStatusPoller paymentId={paymentId} onStatusChange={(s) => s === "approved" && handleApproved()} />
      </div>
    );
  }

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleFormSubmit}
        className="rounded-xl bg-white p-8 shadow-sm space-y-4"
      >
        <h2 className="text-xl font-semibold text-zinc-900">Palpitar</h2>
        <p className="text-zinc-600">
          {game.homeTeam} x {game.awayTeam}
        </p>
        <p className="text-sm text-zinc-500">
          {new Date(game.matchDate).toLocaleString("pt-BR")}
        </p>

        <div className="flex gap-4">
          <input name="homeScore" type="number" min="0" required placeholder="Gols casa" className="flex-1 rounded-lg border px-3 py-2" />
          <input name="awayScore" type="number" min="0" required placeholder="Gols fora" className="flex-1 rounded-lg border px-3 py-2" />
        </div>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="Valor do palpite (R$)"
          className="w-full rounded-lg border px-3 py-2"
        />
        <input name="cpf" required placeholder="CPF" className="w-full rounded-lg border px-3 py-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full rounded-lg bg-zinc-900 py-3 font-medium text-white">
          Confirmar palpite e gerar Pix
        </button>
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
                Ao acertar o placar, o valor recebido será de <strong>80% do montante</strong> apostado.
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
