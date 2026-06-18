"use client";

import { useEffect, useState } from "react";

type PaymentStatusPollerProps = {
  paymentId: string;
  onStatusChange: (status: string) => void;
  pollIntervalMs?: number;
  timeoutMs?: number;
};

export function PaymentStatusPoller({
  paymentId,
  onStatusChange,
  pollIntervalMs = 5000,
  timeoutMs = 30 * 60 * 1000,
}: PaymentStatusPollerProps) {
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    async function poll() {
      while (!cancelled) {
        if (Date.now() - startedAt > timeoutMs) {
          setError("Tempo esgotado. Gere um novo Pix.");
          break;
        }

        try {
          const response = await fetch(`/api/payments/${paymentId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error ?? "Erro ao consultar pagamento");
          }

          setStatus(data.status);
          onStatusChange(data.status);

          if (data.status !== "pending") {
            break;
          }
        } catch (pollError) {
          if (!cancelled) {
            setError(
              pollError instanceof Error
                ? pollError.message
                : "Erro ao consultar pagamento",
            );
          }
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }
    }

    void poll();

    return () => {
      cancelled = true;
    };
  }, [paymentId, onStatusChange, pollIntervalMs, timeoutMs]);

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-600">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        Aguardando confirmação do pagamento...
      </div>
    );
  }

  return null;
}
